create table "public"."job_tokens" (
    "token" uuid not null default gen_random_uuid(),
    "job_id" uuid not null,
    "created_at" timestamp with time zone default now(),
    "expires_at" timestamp with time zone not null,
    "opened_at" timestamp with time zone,
    "status" text check (status in ('active', 'used', 'expired')) default 'active',
    primary key ("token"),
    foreign key ("job_id") references "public"."jobs"("id") on delete cascade
);

alter table "public"."job_tokens" enable row level security;

create policy "Contractors can view tokens for their jobs"
on "public"."job_tokens"
as permissive
for select
to authenticated
using (
    exists (
        select 1 from "public"."jobs"
        where "jobs"."id" = "job_tokens"."job_id"
        and "jobs"."contractor_id" = auth.uid()
    )
);

create policy "Contractors can create tokens for their jobs"
on "public"."job_tokens"
as permissive
for insert
to authenticated
with check (
    exists (
        select 1 from "public"."jobs"
        where "jobs"."id" = "job_tokens"."job_id"
        and "jobs"."contractor_id" = auth.uid()
    )
);

grant select, insert, update, delete on table "public"."job_tokens" to "authenticated";
grant select, insert, update, delete on table "public"."job_tokens" to "service_role";
