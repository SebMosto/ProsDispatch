-- 1. Enums
create type if not exists invoice_status as enum (
  'draft',
  'sent',
  'paid',
  'void',
  'overdue'
);

create type if not exists invoice_payment_method as enum (
  'stripe',
  'cash',
  'cheque',
  'etransfer',
  'other'
);

-- 2. Invoices Table
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id),
  contractor_id uuid not null references auth.users(id),
  invoice_number text not null,
  status invoice_status not null default 'draft',
  subtotal integer not null default 0,
  tax_data jsonb not null default '[]'::jsonb,
  total_amount integer not null default 0,
  pdf_url text,
  payment_method invoice_payment_method,
  payment_note text,
  paid_at timestamptz,
  stripe_payment_intent_id text
);

create unique index if not exists invoices_contractor_invoice_number_key
  on invoices(contractor_id, invoice_number);
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

-- 5. RLS Policies
alter table invoices enable row level security;

create policy "invoices_select_own"
  on invoices for select
  using (auth.uid() = contractor_id);

create policy "invoices_insert_own"
  on invoices for insert
  with check (auth.uid() = contractor_id);

create policy "invoices_update_own"
  on invoices for update
  using (auth.uid() = contractor_id)
  with check (auth.uid() = contractor_id);

create policy "invoices_delete_own"
  on invoices for delete
  using (auth.uid() = contractor_id);

create policy "invoices_select_with_token"
  on invoices for select
  using (
    exists (
      select 1
      from invoice_tokens
      where invoice_tokens.invoice_id = invoices.id
        and invoice_tokens.token = coalesce(
          current_setting('request.headers', true)::jsonb->>'x-invoice-token',
          ''
        )
        and invoice_tokens.expires_at > timezone('utc', now())
    )
  );
