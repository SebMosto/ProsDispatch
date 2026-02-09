insert into storage.buckets (id, name, public)
values ('invoices', 'invoices', true)
on conflict (id) do nothing;

-- Policy: Contractors can upload invoices
-- We assume the filename includes the invoice ID which is unique.
create policy "Contractors can upload invoices"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'invoices' );

-- Policy: Public Read Access
-- Since the bucket is public, files are accessible via public URL.
-- This policy allows API access if needed (e.g. downloading via client SDK).
create policy "Public Read Invoices"
on storage.objects for select
to public
using ( bucket_id = 'invoices' );
