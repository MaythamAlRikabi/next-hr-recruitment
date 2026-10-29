-- guard_company_verification still referenced public.is_next_admin() after 0002 moved it to private.
create or replace function public.guard_company_verification()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.verification is distinct from old.verification
      or new.verified_at is distinct from old.verified_at)
     and not private.is_next_admin() then
    raise exception 'only NEXT admins can change verification status';
  end if;
  return new;
end $$;
revoke execute on function public.guard_company_verification() from public, anon, authenticated;
