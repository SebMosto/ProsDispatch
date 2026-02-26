create table if not exists public.job_tokens (
  token uuid default gen_random_uuid() primary key,
  job_id uuid not null references public.jobs(id) on delete cascade,
  status text not null check (status in ('pending', 'used', 'expired')) default 'pending',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

alter table public.job_tokens enable row level security;

create policy "Contractors can view tokens for their jobs"
  on public.job_tokens
  for select
  using (
    exists (
      select 1 from public.jobs
      where jobs.id = job_tokens.job_id
      and jobs.contractor_id = auth.uid()
    )
  );
