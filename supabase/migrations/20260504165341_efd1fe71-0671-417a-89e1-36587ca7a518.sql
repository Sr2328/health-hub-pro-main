
-- Lock search_path on generate_patient_code (was missing)
create or replace function public.generate_patient_code()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.patient_code is null or new.patient_code = '' then
    new.patient_code := 'HMS-' || extract(year from now())::text || '-' ||
      lpad(nextval('public.patient_code_seq')::text, 5, '0');
  end if;
  return new;
end;
$$;

-- Restrict execute on security definer functions
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
revoke execute on function public.is_staff(uuid) from public, anon;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.generate_patient_code() from public, anon, authenticated;
