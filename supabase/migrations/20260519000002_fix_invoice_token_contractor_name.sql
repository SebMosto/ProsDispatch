-- Update get_invoice_by_token to return business_name with full_name fallback.
-- Previously returned p.business_name directly, which was null for contractors
-- who had not set a business name, causing the UI to fall back to a hardcoded string.

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
  select invoice_id
  into v_invoice_id
  from public.invoice_tokens
  where token = p_token
    and expires_at > timezone('utc', now());

  if v_invoice_id is null then
    raise exception 'TOKEN_INVALID_OR_EXPIRED';
  end if;

  update public.invoice_tokens
  set opened_at = coalesce(opened_at, timezone('utc', now()))
  where token = p_token;

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
    coalesce(nullif(trim(p.business_name), ''), p.full_name),
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
