-- RLS tests for migration 0001. Run against a scratch DB with a stub auth schema (see docs/TEST_REPORT.md).
-- State-based assertions: a blocked write may raise OR silently affect 0 rows; both count as blocked.
\set ON_ERROR_STOP off
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on public.companies to anon;
grant usage, select on all sequences in schema public to authenticated;

insert into auth.users(id) values
 ('00000000-0000-0000-0000-00000000000a'),
 ('00000000-0000-0000-0000-00000000000b'),
 ('00000000-0000-0000-0000-0000000000ad');
insert into public.user_roles(user_id, role) values ('00000000-0000-0000-0000-0000000000ad','super_admin');

create table public.test_results(test text, ok boolean);
grant all on public.test_results to authenticated, anon;

set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-00000000000a';
insert into public.user_roles(user_id, role) values ('00000000-0000-0000-0000-00000000000a','super_admin');
insert into public.test_results select 'T1 candidate cannot self-grant admin',
  not exists (select 1 from public.user_roles where user_id='00000000-0000-0000-0000-00000000000a' and role='super_admin');
insert into public.test_results select 'T2 A cannot read B profile',
  count(*)=0 from public.profiles where id='00000000-0000-0000-0000-00000000000b';

insert into public.companies(slug,name,created_by) values ('acme','Acme','00000000-0000-0000-0000-00000000000a');
insert into public.test_results select 'T3a creator can see own pending company', count(*)=1 from public.companies where slug='acme';
insert into public.company_members(company_id,user_id,role)
  select id,'00000000-0000-0000-0000-00000000000a','owner' from public.companies where slug='acme';
insert into public.test_results select 'T3b creator bootstraps as owner', count(*)=1 from public.company_members;
update public.companies set verification='approved' where slug='acme';
insert into public.test_results select 'T4 owner cannot self-approve', verification='pending' from public.companies where slug='acme';

set request.jwt.sub = '00000000-0000-0000-0000-00000000000b';
insert into public.test_results select 'T5 outsider cannot see pending company', count(*)=0 from public.companies;
insert into public.test_results select 'T6 outsider cannot see members', count(*)=0 from public.company_members;
reset role;
do $$ declare cid uuid; begin
  select id into cid from public.companies where slug='acme';
  perform set_config('test.acme', cid::text, false);
end $$;
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-00000000000b';
insert into public.company_members(company_id,user_id,role)
  values (current_setting('test.acme')::uuid,'00000000-0000-0000-0000-00000000000b','owner');
reset role;
insert into public.test_results select 'T7 outsider cannot join company by known id',
  not exists (select 1 from public.company_members where user_id='00000000-0000-0000-0000-00000000000b');

-- B creates own company: bootstrap must work for a second company
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-00000000000b';
insert into public.companies(slug,name,created_by) values ('beta','Beta','00000000-0000-0000-0000-00000000000b');
insert into public.company_members(company_id,user_id,role)
  select id,'00000000-0000-0000-0000-00000000000b','owner' from public.companies where slug='beta';
insert into public.test_results select 'T8 second creator bootstraps own company',
  count(*)=1 from public.company_members where user_id='00000000-0000-0000-0000-00000000000b';
reset role;

set role anon;
insert into public.test_results select 'T9 anon sees no pending company', count(*)=0 from public.companies;
reset role;
set role authenticated; set request.jwt.sub='00000000-0000-0000-0000-0000000000ad';
update public.companies set verification='approved', verified_at=now() where slug='acme';
insert into public.test_results select 'T10 admin can approve', verification='approved' from public.companies where slug='acme';
reset role; set role anon;
insert into public.test_results select 'T11 anon sees approved company only', count(*)=1 from public.companies;
reset role;
select test, case when ok then 'PASS' else 'FAIL' end as result from public.test_results order by test;
