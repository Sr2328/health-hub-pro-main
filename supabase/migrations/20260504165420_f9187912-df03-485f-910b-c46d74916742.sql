
create or replace function public.claim_first_admin()
returns boolean language plpgsql security definer set search_path = public as $$
declare
  has_admin boolean;
begin
  if auth.uid() is null then return false; end if;
  select exists(select 1 from public.user_roles where role='super_admin') into has_admin;
  if has_admin then return false; end if;
  insert into public.user_roles(user_id, role) values (auth.uid(),'super_admin') on conflict do nothing;
  return true;
end;
$$;
revoke execute on function public.claim_first_admin() from public, anon;
grant execute on function public.claim_first_admin() to authenticated;
