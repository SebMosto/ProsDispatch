-- 1. Enums
DO $$ begin
    create type invoice_status as enum (
      'draft', 'sent', 'paid', 'void', 'overdue'
    );
exception
    when duplicate_object then null;
end $$;

DO $$ begin
    create type invoice_payment_method as enum (
      'stripe', 'cash', 'cheque', 'etransfer', 'other'
    );
exception
    when duplicate_object then null;
end $$;

-- 2. Invoices Table
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id),
  contractor_id uuid not null references auth.users(id),
  invoice_number text not null,
  status invoice_status not null default 'draft',
  date_issued date,
  date_due date not null default current_date,
  subtotal integer not null default 0,
  tax_data jsonb not null default '[]'::jsonb,
  total_amount integer not null default 0,
  pdf_url text,
  payment_method invoice_payment_method,
  payment_note text,
  paid_at timestamptz,
  stripe_payment_intent_id text,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists invoices_contractor_invoice_number_key on invoices(contractor_id, invoice_number);
create index if not exists invoices_job_id_idx on invoices(job_id);
create index if not exists invoices_contractor_id_idx on invoices(contractor_id);
create index if not exists invoices_status_idx on invoices(status);

-- 3. Invoice Items Table
create table if not exists invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  description text not null,
  quantity numeric not null,
  unit_price integer not null,
  amount integer not null
);

create index if not exists invoice_items_invoice_id_idx on invoice_items(invoice_id);

-- 4. Invoice Tokens Table
create table if not exists invoice_tokens (
  token text primary key,
  invoice_id uuid not null references invoices(id) on delete cascade,
  expires_at timestamptz not null default (timezone('utc', now()) + interval '30 days'),
  opened_at timestamptz
);

create index if not exists invoice_tokens_invoice_id_idx on invoice_tokens(invoice_id);

-- 5. Immutability Guard
create or replace function public.enforce_invoice_immutability()
returns trigger
language plpgsql
security definer set search_path = public
as $func$
begin
  if old.status in ('paid', 'void') and new.status <> old.status then
    raise exception 'Invoice status is final once %', old.status;
  end if;

  if old.status <> 'draft' then
    if new.job_id is distinct from old.job_id
      or new.contractor_id is distinct from old.contractor_id
      or new.invoice_number is distinct from old.invoice_number
      or new.date_issued is distinct from old.date_issued
      or new.date_due is distinct from old.date_due
      or new.subtotal is distinct from old.subtotal
      or new.tax_data is distinct from old.tax_data
      or new.total_amount is distinct from old.total_amount
      or new.pdf_url is distinct from old.pdf_url then
      raise exception 'Invoice is immutable once sent';
    end if;
  end if;

  return new;
end;
$func$;

drop trigger if exists enforce_invoice_immutability on public.invoices;
create trigger enforce_invoice_immutability
  before update on public.invoices
  for each row
  execute function public.enforce_invoice_immutability();

-- 6. Secure Public Access
create or replace function public.get_invoice_by_token(access_token text)
returns setof invoices
language sql
security definer set search_path = public
as $func$
  with touched as (
    update invoice_tokens
    set opened_at = coalesce(opened_at, timezone('utc', now()))
    where token = access_token
      and expires_at > timezone('utc', now())
    returning invoice_id
  )
  select invoices.*
  from invoices
  join touched on touched.invoice_id = invoices.id;
$func$;

-- 7. RLS
alter table invoices enable row level security;
alter table invoice_items enable row level security;
alter table invoice_tokens enable row level security;

-- Invoices Policies
drop policy if exists "invoices_select_own" on invoices;
create policy "invoices_select_own"
  on invoices for select
  using (auth.uid() = contractor_id);

drop policy if exists "invoices_insert_own" on invoices;
create policy "invoices_insert_own"
  on invoices for insert
  with check (auth.uid() = contractor_id);

drop policy if exists "invoices_update_own" on invoices;
create policy "invoices_update_own"
  on invoices for update
  using (auth.uid() = contractor_id)
  with check (auth.uid() = contractor_id);

drop policy if exists "invoices_delete_own" on invoices;
create policy "invoices_delete_own"
  on invoices for delete
  using (auth.uid() = contractor_id);

-- Invoice Items Policies
drop policy if exists "invoice_items_select_own" on invoice_items;
create policy "invoice_items_select_own"
  on invoice_items for select
  using (
    exists (
      select 1
      from invoices
      where invoices.id = invoice_items.invoice_id
        and invoices.contractor_id = auth.uid()
    )
  );

drop policy if exists "invoice_items_insert_own" on invoice_items;
create policy "invoice_items_insert_own"
  on invoice_items for insert
  with check (
    exists (
      select 1
      from invoices
      where invoices.id = invoice_items.invoice_id
        and invoices.contractor_id = auth.uid()
    )
  );

drop policy if exists "invoice_items_update_own" on invoice_items;
create policy "invoice_items_update_own"
  on invoice_items for update
  using (
    exists (
      select 1
      from invoices
      where invoices.id = invoice_items.invoice_id
        and invoices.contractor_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from invoices
      where invoices.id = invoice_items.invoice_id
        and invoices.contractor_id = auth.uid()
    )
  );

drop policy if exists "invoice_items_delete_own" on invoice_items;
create policy "invoice_items_delete_own"
  on invoice_items for delete
  using (
    exists (
      select 1
      from invoices
      where invoices.id = invoice_items.invoice_id
        and invoices.contractor_id = auth.uid()
    )
  );

-- Invoice Tokens Policies
drop policy if exists "invoice_tokens_select_own" on invoice_tokens;
create policy "invoice_tokens_select_own"
  on invoice_tokens for select
  using (
    exists (
      select 1
      from invoices
      where invoices.id = invoice_tokens.invoice_id
        and invoices.contractor_id = auth.uid()
    )
  );

drop policy if exists "invoice_tokens_insert_own" on invoice_tokens;
create policy "invoice_tokens_insert_own"
  on invoice_tokens for insert
  with check (
    exists (
      select 1
      from invoices
      where invoices.id = invoice_tokens.invoice_id
        and invoices.contractor_id = auth.uid()
    )
  );

drop policy if exists "invoice_tokens_delete_own" on invoice_tokens;
create policy "invoice_tokens_delete_own"
  on invoice_tokens for delete
  using (
    exists (
      select 1
      from invoices
      where invoices.id = invoice_tokens.invoice_id
        and invoices.contractor_id = auth.uid()
    )
  );
