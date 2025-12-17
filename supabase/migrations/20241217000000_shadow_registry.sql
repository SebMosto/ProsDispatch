-- 1. Create Enums for strict typing
create type client_type as enum ('individual', 'business');
create type supported_locale as enum ('en', 'fr');

-- 2. Clients Table (With Soft Delete & Language)
create table clients (
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid not null references auth.users(id),
  type client_type not null default 'individual',
  name text not null,
  email text, 
  preferred_language supported_locale not null default 'en',
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz -- Soft Delete for Tax Integrity
);

-- 3. Properties Table (With Soft Delete & Future Proofing)
create table properties (
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid not null references auth.users(id),
  client_id uuid not null references clients(id),
  
  address_line1 text not null,
  address_line2 text,
  city text not null,
  province text not null, -- No DB Constraint (handled in App/Zod)
  postal_code text not null,
  nickname text,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz -- Soft Delete for Tax Integrity
);

-- 4. Indexes for Performance
create index clients_contractor_id_idx on clients(contractor_id);
create index properties_contractor_id_idx on properties(contractor_id);
create index properties_client_id_idx on properties(client_id);

-- 5. Security & RLS (Row Level Security)
alter table clients enable row level security;
alter table properties enable row level security;

-- Policy: Isolation (Contractor can only see/edit their own data)
create policy "Contractor Isolation Policy" on clients
  for all
  using (auth.uid() = contractor_id)
  with check (auth.uid() = contractor_id);

create policy "Contractor Isolation Policy" on properties
  for all
  using (auth.uid() = contractor_id)
  with check (auth.uid() = contractor_id);
