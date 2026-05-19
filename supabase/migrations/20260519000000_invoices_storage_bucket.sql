-- Create invoices bucket (public so PDF URLs work without auth)
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true);

-- Contractors can upload to their own folder only
CREATE POLICY "Contractors can upload their invoices"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'invoices' AND (auth.uid()::text = (storage.foldername(name))[1]));

-- Public can read any invoice PDF via URL
CREATE POLICY "Public can read invoices"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'invoices');
