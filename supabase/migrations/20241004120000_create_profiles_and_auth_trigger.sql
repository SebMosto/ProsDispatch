-- Drop existing objects if they exist (idempotent)
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists set_profile_updated_at on public.profiles;
drop function if exists public.handle_new_user();
drop function if exists public.set_profile_updated_at();
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

-- Create profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  business_name text,
  role text not null default 'contractor',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles enable row level security;

-- Create function to handle new user
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, business_name, role)
  values (new.id, new.email, null, null, 'contractor')
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Create trigger for new users
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Create function to update timestamp
create function public.set_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- Create trigger for updated_at
create trigger set_profile_updated_at
  before update on public.profiles
  for each row 
  execute function public.set_profile_updated_at();

-- RLS Policies
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
