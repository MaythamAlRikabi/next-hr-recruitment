-- RLS helper functions move to a schema that is NOT exposed by the Supabase API,
-- so they cannot be called through /rest/v1/rpc. Policies keep working (they reference by oid).
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

alter function public.has_role(public.app_role) set schema private;
alter function public.is_next_staff() set schema private;
alter function public.is_next_admin() set schema private;
alter function public.company_role_of(uuid) set schema private;

revoke execute on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;
