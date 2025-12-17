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

-- Fix: Used $func$ delimiter to avoid conflict with outer $$ blocks
do $$
begin
  if not exists (
    select 1 from pg_proc
    where proname = 'handle_new_user'
      and pg_function_is_visible(oid)
  ) then
    create function public.handle_new_user()
    returns trigger
    language plpgsql
    security definer set search_path = public
    as $func$
    begin
      insert into public.profiles (id, email, full_name, business_name, role)
      values (new.id, new.email, null, null, 'contractor')
      on conflict (id) do nothing;
      return new;
    end;
    $func$;
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'on_auth_user_created'
  ) then
    create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function public.handle_new_user();
  end if;
end$$;

-- Fix: Used $func$ delimiter here as well
do $$
begin
  if not exists (
    select 1 from pg_proc
    where proname = 'set_profile_updated_at'
      and pg_function_is_visible(oid)
  ) then
    create function public.set_profile_updated_at()
    returns trigger
    language plpgsql
    security definer set search_path = public
    as $func$
    begin
      new.updated_at = timezone('utc', now());
      return new;
    end;
    $func$;
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_profile_updated_at'
  ) then
    create trigger set_profile_updated_at
    before update on public.profiles
    for each row execute function public.set_profile_updated_at();
  end if;
end$$;

create policy if not exists "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy if not exists "Users can update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
