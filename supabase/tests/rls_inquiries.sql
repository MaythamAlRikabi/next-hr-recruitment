-- RLS/constraint tests for migration 0004 (inquiries). Run after 0001-0004 on the scratch DB.
\set ON_ERROR_STOP off
grant usage on schema public to anon, authenticated;
create table if not exists public.test_results2(test text, ok boolean);
grant all on public.test_results2 to anon, authenticated;
insert into auth.users(id) values
 ('00000000-0000-0000-0000-00000000000a'),('00000000-0000-0000-0000-00000000000b'),('00000000-0000-0000-0000-0000000000cc')
 on conflict do nothing;
insert into public.user_roles(user_id, role) values ('00000000-0000-0000-0000-0000000000cc','next_recruiter') on conflict do nothing;

-- anon: insert allowed, read-back blocked
set role anon;
insert into public.inquiries(reference,kind,full_name,email,message,privacy_consent)
 values ('NX-20261029-AAAAAA','contact','Test Anon','anon@example.com','Hello this is a valid message',true);
do $$ declare n int; begin
  begin select count(*) into n from public.inquiries; exception when insufficient_privilege then n := 0; end;
  insert into public.test_results2 values ('Q1 anon cannot read inquiries', n = 0);
end $$;
insert into public.inquiries(reference,kind,full_name,email,message,privacy_consent,status)
 values ('NX-20261029-AAAAAB','contact','Test Anon','anon2@example.com','Hello this is a valid message',true,'closed');
insert into public.inquiries(reference,kind,full_name,email,message,privacy_consent,assigned_to)
 values ('NX-20261029-AAAAAC','contact','Test Anon','anon3@example.com','Hello this is a valid message',true,'00000000-0000-0000-0000-0000000000cc');
insert into public.inquiries(reference,kind,full_name,email,message,privacy_consent,submitted_by)
 values ('NX-20261029-AAAAAD','contact','Test Anon','anon4@example.com','Hello this is a valid message',true,'00000000-0000-0000-0000-00000000000a');
update public.inquiries set status='closed';
-- invalid payloads
insert into public.inquiries(reference,kind,full_name,email,message,privacy_consent) values ('bad','contact','Test Anon','x@example.com','Hello this is a valid message',true);
insert into public.inquiries(reference,kind,full_name,email,message,privacy_consent) values ('NX-20261029-BBBBBB','contact','Test Anon','not-an-email','Hello this is a valid message',true);
insert into public.inquiries(reference,kind,full_name,email,message,privacy_consent) values ('NX-20261029-CCCCCC','contact','Test Anon','x@example.com','short',true);
insert into public.inquiries(reference,kind,full_name,email,message,privacy_consent) values ('NX-20261029-DDDDDD','contact','Test Anon','x@example.com','Hello this is a valid message',false);
reset role;
insert into public.test_results2 select 'Q2 only the one valid anon row exists', count(*)=1 from public.inquiries;
insert into public.test_results2 select 'Q3 anon cannot set status/assignee/submitted_by', count(*)=0 from public.inquiries where status<>'new' or assigned_to is not null or submitted_by is not null;
insert into public.test_results2 select 'Q4 anon cannot update', count(*)=1 from public.inquiries where status='new';

-- rate limit: 5 per hour per email
set role anon;
do $$ begin
  for i in 1..7 loop
    begin
      insert into public.inquiries(reference,kind,full_name,email,message,privacy_consent)
      values ('NX-20261029-RL000'||i,'contact','Rate Limit','rate@example.com','Hello this is a valid message',true);
    exception when others then null; end;
  end loop;
end $$;
reset role;
insert into public.test_results2 select 'Q5 rate limit caps at 5/hour/email', count(*)=5 from public.inquiries where lower(email)='rate@example.com';

-- authenticated user: sees own, not others'
set role authenticated; set request.jwt.sub='00000000-0000-0000-0000-00000000000a';
insert into public.inquiries(reference,kind,full_name,email,message,privacy_consent)
 values ('NX-20261029-USERA1','career_consulting','User A','a@example.com','Hello this is a valid message',true);
insert into public.test_results2 select 'Q6 user sees only own inquiries', count(*)=1 and bool_and(submitted_by='00000000-0000-0000-0000-00000000000a') from public.inquiries;
update public.inquiries set status='closed';
set request.jwt.sub='00000000-0000-0000-0000-00000000000b';
insert into public.test_results2 select 'Q7 other user sees none', count(*)=0 from public.inquiries;
insert into public.inquiries(reference,kind,full_name,email,message,privacy_consent,submitted_by)
 values ('NX-20261029-SPOOF1','contact','Spoof','s@example.com','Hello this is a valid message',true,'00000000-0000-0000-0000-00000000000a');
reset role;
insert into public.test_results2 select 'Q8 cannot spoof submitted_by; user cannot update own', (select count(*) from public.inquiries where reference='NX-20261029-SPOOF1')=0
  and (select status from public.inquiries where reference='NX-20261029-USERA1')='new';

-- staff
set role authenticated; set request.jwt.sub='00000000-0000-0000-0000-0000000000cc';
insert into public.test_results2 select 'Q9 recruiter reads all', count(*)>=7 from public.inquiries;
update public.inquiries set status='in_progress' where reference='NX-20261029-USERA1';
reset role;
insert into public.test_results2 select 'Q10 recruiter can update status', status='in_progress' from public.inquiries where reference='NX-20261029-USERA1';

select test, case when ok then 'PASS' else 'FAIL' end as result from public.test_results2 order by test;
