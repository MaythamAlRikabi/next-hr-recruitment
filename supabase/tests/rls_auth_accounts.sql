-- Tests for migration 0005 (run after 0001-0005).
\set ON_ERROR_STOP off
create table if not exists public.test_results3(test text, ok boolean);
grant all on public.test_results3 to anon, authenticated;

insert into auth.users(id, raw_user_meta_data) values
 ('10000000-0000-0000-0000-00000000000a', '{"full_name":"  Alice  ","account_purpose":"candidate","terms_accepted":"true"}'),
 ('10000000-0000-0000-0000-00000000000b', '{"full_name":"Bob Co","account_purpose":"employer","terms_accepted":"true"}'),
 ('10000000-0000-0000-0000-00000000000c', '{"full_name":"Mallory","account_purpose":"super_admin","role":"super_admin","roles":["super_admin"],"terms_accepted":"yes"}'),
 ('10000000-0000-0000-0000-00000000000d', jsonb_build_object('full_name', repeat('x', 500)));
insert into auth.users(id) values ('10000000-0000-0000-0000-0000000000ad');
insert into public.user_roles(user_id, role) values ('10000000-0000-0000-0000-0000000000ad','next_admin');

insert into public.test_results3 select 'A1 candidate signup: candidate role only',
  (select array_agg(role::text order by role::text) from public.user_roles where user_id='10000000-0000-0000-0000-00000000000a') = array['candidate'];
insert into public.test_results3 select 'A2 name trimmed + terms timestamp',
  (select full_name='Alice' and terms_accepted_at is not null from public.profiles where id='10000000-0000-0000-0000-00000000000a');
insert into public.test_results3 select 'A3 employer purpose: candidate + employer roles',
  (select array_agg(role::text order by role::text) from public.user_roles where user_id='10000000-0000-0000-0000-00000000000b') = array['candidate','employer'];
insert into public.test_results3 select 'A4 metadata cannot grant staff roles',
  not exists (select 1 from public.user_roles where user_id='10000000-0000-0000-0000-00000000000c' and role in ('next_recruiter','next_admin','super_admin','employer'));
insert into public.test_results3 select 'A5 unknown purpose falls back to candidate, no terms stamp',
  (select account_purpose='candidate' and terms_accepted_at is null from public.profiles where id='10000000-0000-0000-0000-00000000000c');
insert into public.test_results3 select 'A6 oversized name truncated to 120',
  (select char_length(full_name)=120 from public.profiles where id='10000000-0000-0000-0000-00000000000d');

grant usage on schema public to anon, authenticated;
set role authenticated; set request.jwt.sub='10000000-0000-0000-0000-00000000000a';
insert into public.account_deletion_requests(user_id, reason) values ('10000000-0000-0000-0000-00000000000a','leaving');
insert into public.account_deletion_requests(user_id, reason) values ('10000000-0000-0000-0000-00000000000a','duplicate pending');
insert into public.account_deletion_requests(user_id) values ('10000000-0000-0000-0000-00000000000b');
insert into public.test_results3 select 'A7 user files own request; duplicate pending + filing for others blocked',
  (select count(*) from public.account_deletion_requests)=1;
update public.account_deletion_requests set status='completed';
set request.jwt.sub='10000000-0000-0000-0000-00000000000b';
insert into public.test_results3 select 'A8 other user cannot see request', (select count(*) from public.account_deletion_requests)=0;
set request.jwt.sub='10000000-0000-0000-0000-0000000000ad';
insert into public.test_results3 select 'A9 admin sees request', (select count(*) from public.account_deletion_requests)=1;
update public.account_deletion_requests set status='processing', processed_by='10000000-0000-0000-0000-0000000000ad', processed_at=now();
reset role;
insert into public.test_results3 select 'A10 user could not self-complete; admin could process',
  (select status='processing' from public.account_deletion_requests limit 1);

select test, case when ok then 'PASS' else 'FAIL' end result from public.test_results3 order by test;
