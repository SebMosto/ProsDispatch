-- bead_006: Invoicing & Payments (Stripe Direct Charge)
-- This migration aligns the database schema and RLS policies with SPEC-004 / SPEC-005.

-- 1. Adjust invoices RLS to enforce draft-only mutability for contractors
alter table public.invoices enable row level security;

-- Drop existing update policy if present so we can replace it with draft-only rules
do $$
begin
  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'invoices'
      and policyname = 'invoices_update_own'
  ) then
    drop policy "invoices_update_own" on public.invoices;
  end if;
end $$;

-- Ensure basic select/insert policies exist (idempotent with existing ones)
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'invoices'
      and policyname = 'invoices_select_own'
  ) then
    create policy "invoices_select_own"
      on public.invoices for select
      using (auth.uid() = contractor_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'invoices'
      and policyname = 'invoices_insert_own'
  ) then
    create policy "invoices_insert_own"
      on public.invoices for insert
      with check (auth.uid() = contractor_id);
  end if;
end $$;

-- Draft-only updates for contractors (immutability once sent/paid/void/overdue)
create policy if not exists "invoices_update_draft_only"
  on public.invoices for update
  using (auth.uid() = contractor_id and status = 'draft')
  with check (auth.uid() = contractor_id and status = 'draft');


-- 2. Simplify invoice_items RLS to cascade through invoice ownership
alter table public.invoice_items enable row level security;

-- Drop existing per-action policies if they exist
do $$
begin
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'invoice_items' and policyname = 'invoice_items_select_own') then
    drop policy "invoice_items_select_own" on public.invoice_items;
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'invoice_items' and policyname = 'invoice_items_insert_own') then
    drop policy "invoice_items_insert_own" on public.invoice_items;
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'invoice_items' and policyname = 'invoice_items_update_own') then
    drop policy "invoice_items_update_own" on public.invoice_items;
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'invoice_items' and policyname = 'invoice_items_delete_own') then
    drop policy "invoice_items_delete_own" on public.invoice_items;
  end if;
end $$;

-- Single cascading policy that covers all operations
create policy if not exists "invoice_items_via_invoice"
  on public.invoice_items for all
  using (
    exists (
      select 1
      from public.invoices
      where public.invoices.id = public.invoice_items.invoice_id
        and public.invoices.contractor_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.invoices
      where public.invoices.id = public.invoice_items.invoice_id
        and public.invoices.contractor_id = auth.uid()
    )
  );


-- 3. Lock down invoice_tokens for direct table access
alter table public.invoice_tokens enable row level security;

-- Remove contractor-facing policies so tokens are only usable via RPCs / service-role
do $$
begin
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'invoice_tokens' and policyname = 'invoice_tokens_select_own') then
    drop policy "invoice_tokens_select_own" on public.invoice_tokens;
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'invoice_tokens' and policyname = 'invoice_tokens_insert_own') then
    drop policy "invoice_tokens_insert_own" on public.invoice_tokens;
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'invoice_tokens' and policyname = 'invoice_tokens_delete_own') then
    drop policy "invoice_tokens_delete_own" on public.invoice_tokens;
  end if;
end $$;


-- 4. Tax and Stripe Connect fields on profiles
alter table public.profiles
  add column if not exists tax_gst_rate numeric default 0.05,
  add column if not exists tax_qst_rate numeric default 0.09975,
  add column if not exists stripe_connect_id text,
  add column if not exists stripe_connect_onboarded boolean default false;


-- 5. Replace get_invoice_by_token with JSON-returning RPC for public access
drop function if exists public.get_invoice_by_token(text);

create or replace function public.get_invoice_by_token(p_token text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invoice_id uuid;
  v_result json;
begin
  -- Validate token (non-expired link)
  select invoice_id
  into v_invoice_id
  from public.invoice_tokens
  where token = p_token
    and expires_at > timezone('utc', now());

  if v_invoice_id is null then
    raise exception 'TOKEN_INVALID_OR_EXPIRED';
  end if;

  -- Mark first open timestamp (idempotent)
  update public.invoice_tokens
  set opened_at = coalesce(opened_at, timezone('utc', now()))
  where token = p_token;

  -- Build minimal JSON payload for homeowner view
  select json_build_object(
    'invoice',
    row_to_json(i),
    'items',
    (
      select json_agg(row_to_json(ii))
      from public.invoice_items ii
      where ii.invoice_id = i.id
    ),
    'contractor_name',
    p.business_name,
    'pdf_url',
    i.pdf_url
  )
  into v_result
  from public.invoices i
  join public.profiles p
    on p.id = i.contractor_id
  where i.id = v_invoice_id;

  return v_result;
end;
$$;

