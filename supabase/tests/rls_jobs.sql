-- RLS/workflow tests for migration 0006 (jobs, applications). Run after 0001-0006 on a SCRATCH database
-- with the stub auth schema (see docs/RLS_TEST_REPORT.md). State-based: a blocked write may raise OR affect 0 rows.
\set ON_ERROR_STOP off
grant usage on schema public to anon, authenticated;
grant select on public.companies to anon;
grant select, insert, update on public.companies to authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.user_roles, public.company_members to authenticated;
create table public.test_results6(test text, ok boolean);
grant all on public.test_results6 to anon, authenticated;

-- people: A,B candidates | E1 owner of company X (approved) | E2 owner of company Y (pending) | ST staff
insert into auth.users(id) values
 ('00000000-0000-0000-0000-00000000000a'),('00000000-0000-0000-0000-00000000000b'),
 ('00000000-0000-0000-0000-0000000000e1'),('00000000-0000-0000-0000-0000000000e2'),
 ('00000000-0000-0000-0000-0000000000cc');
insert into public.user_roles(user_id, role) values ('00000000-0000-0000-0000-0000000000cc','next_recruiter')
 on conflict do nothing;
insert into public.companies(id,slug,name,created_by,verification) values
 ('11111111-1111-1111-1111-111111111111','cx','Company X','00000000-0000-0000-0000-0000000000e1','approved'),
 ('22222222-2222-2222-2222-222222222222','cy','Company Y','00000000-0000-0000-0000-0000000000e2','pending');
insert into public.company_members(company_id,user_id,role) values
 ('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-0000000000e1','owner'),
 ('22222222-2222-2222-2222-222222222222','00000000-0000-0000-0000-0000000000e2','owner');

-- fixtures (inserted as table owner, bypassing RLS and the staff-only publish rule through staff context)
set request.jwt.sub = '00000000-0000-0000-0000-0000000000cc';
-- staff context for guard functions: they read auth.uid() -> staff
insert into public.jobs(id,company_id,title,description,status,created_by,deadline) values
 ('aaaaaaaa-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Published job X','A valid description for the published job at company X.','published','00000000-0000-0000-0000-0000000000e1',null),
 ('aaaaaaaa-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','Draft job X','A valid description for the draft job at company X.','draft','00000000-0000-0000-0000-0000000000e1',null),
 ('aaaaaaaa-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','Expired job X','A valid description for the expired job at company X.','published','00000000-0000-0000-0000-0000000000e1', current_date - 1),
 ('aaaaaaaa-0000-0000-0000-000000000004','22222222-2222-2222-2222-222222222222','Published job Y','A valid description for a job of an unverified company.','published','00000000-0000-0000-0000-0000000000e2',null);
set request.jwt.sub = '';

-- ---------- anon
set role anon;
do $$ declare n int; begin
  select count(*) into n from public.jobs;
  insert into public.test_results6 values ('J1 anon sees exactly the 1 live job of an approved company', n = 1);
end $$;
insert into public.jobs(company_id,title,description,created_by) values ('11111111-1111-1111-1111-111111111111','Anon job','A valid description for an anon attempt.','00000000-0000-0000-0000-0000000000e1');
do $$ declare n int; begin
  begin select count(*) into n from public.applications; exception when insufficient_privilege then n := 0; end;
  insert into public.test_results6 values ('J2 anon cannot read applications', n = 0);
end $$;
reset role;
insert into public.test_results6 select 'J3 anon cannot insert jobs', count(*)=0 from public.jobs where title='Anon job';

-- ---------- employer E1
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000e1';
insert into public.jobs(id,company_id,title,description,created_by) values
 ('aaaaaaaa-0000-0000-0000-000000000010','11111111-1111-1111-1111-111111111111','E1 new job','A valid description for a job created by an employer.','00000000-0000-0000-0000-0000000000e1');
insert into public.jobs(company_id,title,description,created_by) values
 ('22222222-2222-2222-2222-222222222222','E1 into Y','A valid description for a foreign-company attempt.','00000000-0000-0000-0000-0000000000e1');
insert into public.jobs(company_id,title,description,created_by,status) values
 ('11111111-1111-1111-1111-111111111111','E1 self-publish','A valid description for a self published attempt.','00000000-0000-0000-0000-0000000000e1','published');
update public.jobs set status='published' where id='aaaaaaaa-0000-0000-0000-000000000010';
insert into public.test_results6 select 'J4 employer inserts draft in own company', count(*)=1 from public.jobs where id='aaaaaaaa-0000-0000-0000-000000000010';
insert into public.test_results6 select 'J5 employer cannot insert into another company', count(*)=0 from public.jobs where title='E1 into Y';
insert into public.test_results6 select 'J6 employer cannot create/publish directly', count(*)=0 from public.jobs where title='E1 self-publish';
insert into public.test_results6 select 'J7 employer cannot publish own job', status='draft' from public.jobs where id='aaaaaaaa-0000-0000-0000-000000000010';
update public.jobs set status='pending_review' where id='aaaaaaaa-0000-0000-0000-000000000010';
insert into public.test_results6 select 'J8 employer can submit for review', status='pending_review' from public.jobs where id='aaaaaaaa-0000-0000-0000-000000000010';
update public.jobs set status='draft' where id='aaaaaaaa-0000-0000-0000-000000000001';
insert into public.test_results6 select 'J9 employer cannot pull a published job back to draft', status='published' from public.jobs where id='aaaaaaaa-0000-0000-0000-000000000001';
update public.jobs set company_id='22222222-2222-2222-2222-222222222222' where id='aaaaaaaa-0000-0000-0000-000000000002';
insert into public.test_results6 select 'J10 company_id is immutable', company_id='11111111-1111-1111-1111-111111111111' from public.jobs where id='aaaaaaaa-0000-0000-0000-000000000002';
insert into public.test_results6 select 'J11 employer sees own drafts but not company Y jobs', (select count(*) from public.jobs where status='draft')>=1 and (select count(*) from public.jobs where company_id='22222222-2222-2222-2222-222222222222')=0;
reset role;

-- ---------- staff publishes
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000cc';
update public.jobs set status='published' where id='aaaaaaaa-0000-0000-0000-000000000010';
insert into public.test_results6 select 'J12 staff can publish and published_at is set', status='published' and published_at is not null from public.jobs where id='aaaaaaaa-0000-0000-0000-000000000010';
reset role;

-- ---------- E2 isolation
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000e2';
update public.jobs set title='hijacked' where company_id='11111111-1111-1111-1111-111111111111';
reset role;
insert into public.test_results6 select 'J13 other company cannot edit company X jobs', count(*)=0 from public.jobs where title='hijacked';

-- ---------- candidate A applies
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-00000000000a';
insert into public.jobs(company_id,title,description,created_by) values ('11111111-1111-1111-1111-111111111111','Cand job','A valid description for a candidate attempt.','00000000-0000-0000-0000-00000000000a');
insert into public.applications(id,job_id,candidate_id,cover_note) values ('bbbbbbbb-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000a','Hello');
insert into public.applications(job_id,candidate_id) values ('aaaaaaaa-0000-0000-0000-000000000002','00000000-0000-0000-0000-00000000000a'); -- draft
insert into public.applications(job_id,candidate_id) values ('aaaaaaaa-0000-0000-0000-000000000003','00000000-0000-0000-0000-00000000000a'); -- expired
insert into public.applications(job_id,candidate_id) values ('aaaaaaaa-0000-0000-0000-000000000004','00000000-0000-0000-0000-00000000000a'); -- unverified company
insert into public.applications(job_id,candidate_id) values ('aaaaaaaa-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000b'); -- spoof
insert into public.applications(job_id,candidate_id) values ('aaaaaaaa-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000a'); -- duplicate
insert into public.applications(job_id,candidate_id,status) values ('aaaaaaaa-0000-0000-0000-000000000010','00000000-0000-0000-0000-00000000000a','hired'); -- forced status
insert into public.test_results6 select 'J14 candidate cannot create jobs', count(*)=0 from public.jobs where title='Cand job';
insert into public.test_results6 select 'J15 candidate applied to live job; blocked on draft/expired/unverified/spoof/duplicate/forced status',
  (select count(*) from public.applications)=1;
reset role;

-- ---------- candidate A cannot tamper after submit
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-00000000000a';
update public.applications set status='hired' where id='bbbbbbbb-0000-0000-0000-000000000001';
update public.applications set cover_note='edited' where id='bbbbbbbb-0000-0000-0000-000000000001';
reset role;
insert into public.test_results6 select 'J16 candidate cannot self-promote or edit after submit', status='new' and cover_note='Hello' from public.applications where id='bbbbbbbb-0000-0000-0000-000000000001';

-- ---------- B isolation
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-00000000000b';
insert into public.test_results6 select 'J17 candidate B cannot read A application or events', (select count(*) from public.applications)=0 and (select count(*) from public.application_events)=0;
insert into public.test_results6 select 'J18 B cannot read A profile', count(*)=0 from public.profiles where id='00000000-0000-0000-0000-00000000000a';
reset role;

-- ---------- employer E1 works the pipeline
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000e1';
insert into public.test_results6 select 'J19 employer sees applicant of own job', count(*)=1 from public.applications;
insert into public.test_results6 select 'J20 employer can read applicant profile (applied) but not non-applicant B', (select count(*) from public.profiles where id='00000000-0000-0000-0000-00000000000a')=1 and (select count(*) from public.profiles where id='00000000-0000-0000-0000-00000000000b')=0;
update public.applications set status='shortlisted' where id='bbbbbbbb-0000-0000-0000-000000000001';
insert into public.test_results6 select 'J21 employer moves pipeline stage', status='shortlisted' from public.applications where id='bbbbbbbb-0000-0000-0000-000000000001';
update public.applications set status='withdrawn' where id='bbbbbbbb-0000-0000-0000-000000000001';
update public.applications set status='new' where id='bbbbbbbb-0000-0000-0000-000000000001';
insert into public.test_results6 select 'J22 employer cannot set withdrawn/new', status='shortlisted' from public.applications where id='bbbbbbbb-0000-0000-0000-000000000001';
insert into public.application_notes(application_id,author_id,body) values ('bbbbbbbb-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000e1','Strong profile');
insert into public.application_notes(application_id,author_id,body) values ('bbbbbbbb-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000e2','forged author');
insert into public.test_results6 select 'J23 employer adds own note; forged author blocked', count(*)=1 from public.application_notes;
reset role;

-- ---------- E2 sees nothing of company X
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000e2';
insert into public.test_results6 select 'J24 other company sees no applications/notes/events', (select count(*) from public.applications)=0 and (select count(*) from public.application_notes)=0 and (select count(*) from public.application_events)=0;
reset role;

-- ---------- candidate A: notes hidden, may withdraw
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-00000000000a';
insert into public.test_results6 select 'J25 candidate cannot read employer notes', count(*)=0 from public.application_notes;
insert into public.application_notes(application_id,author_id,body) values ('bbbbbbbb-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000a','candidate note');
update public.applications set status='withdrawn' where id='bbbbbbbb-0000-0000-0000-000000000001';
reset role;
insert into public.test_results6 select 'J26 candidate cannot write notes', count(*)=1 from public.application_notes;
insert into public.test_results6 select 'J27 candidate can withdraw', status='withdrawn' from public.applications where id='bbbbbbbb-0000-0000-0000-000000000001';
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000e1';
update public.applications set status='interview' where id='bbbbbbbb-0000-0000-0000-000000000001';
reset role;
insert into public.test_results6 select 'J28 withdrawn application is frozen', status='withdrawn' from public.applications where id='bbbbbbbb-0000-0000-0000-000000000001';
insert into public.test_results6 select 'J29 history: created(new) + shortlisted + withdrawn, no forged rows', count(*)=3 from public.application_events where application_id='bbbbbbbb-0000-0000-0000-000000000001';

-- ---------- saved jobs
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-00000000000a';
insert into public.saved_jobs(user_id,job_id) values ('00000000-0000-0000-0000-00000000000a','aaaaaaaa-0000-0000-0000-000000000001');
insert into public.saved_jobs(user_id,job_id) values ('00000000-0000-0000-0000-00000000000b','aaaaaaaa-0000-0000-0000-000000000001');
reset role;
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-00000000000b';
insert into public.test_results6 select 'J30 saved jobs: own only, no spoofing, not readable by others', (select count(*) from public.saved_jobs)=0;
reset role;
insert into public.test_results6 select 'J31 exactly one saved job exists (A)', count(*)=1 from public.saved_jobs;

-- ---------- expired / unverified jobs never leak to anon
set role anon;
insert into public.test_results6 select 'J32 anon cannot see expired, draft or unverified-company jobs', count(*) filter (where title in ('Expired job X','Draft job X','Published job Y'))=0 from public.jobs;
reset role;

select test, case when ok then 'PASS' else 'FAIL' end as result from public.test_results6 order by length(test), test;
select count(*) filter (where ok) as passed, count(*) as total from public.test_results6;
