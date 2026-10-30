-- Tests for migration 0011 (application shares + mandatory closing date). Run after 0001-0011 on a SCRATCH db with the stubs.
\set ON_ERROR_STOP off
grant usage on schema public to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.user_roles, public.company_members, public.companies to authenticated;
create table public.test_results11(test text, ok boolean);
grant all on public.test_results11 to anon, authenticated, service_role;

-- A,B,C candidates | E1 owner of company X (approved) | E2 owner of company Y (approved) | ST staff
insert into auth.users(id) values
 ('00000000-0000-0000-0000-00000000000a'),('00000000-0000-0000-0000-00000000000b'),('00000000-0000-0000-0000-00000000000c'),
 ('00000000-0000-0000-0000-0000000000e1'),('00000000-0000-0000-0000-0000000000e2'),('00000000-0000-0000-0000-0000000000cc');
insert into public.user_roles(user_id, role) values ('00000000-0000-0000-0000-0000000000cc','next_recruiter') on conflict do nothing;
insert into public.companies(id,slug,name,created_by,verification) values
 ('11111111-1111-1111-1111-111111111111','cx','Company X','00000000-0000-0000-0000-0000000000e1','approved'),
 ('22222222-2222-2222-2222-222222222222','cy','Company Y','00000000-0000-0000-0000-0000000000e2','approved');
insert into public.company_members(company_id,user_id,role) values
 ('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-0000000000e1','owner'),
 ('22222222-2222-2222-2222-222222222222','00000000-0000-0000-0000-0000000000e2','owner');

-- fixtures as staff context
set request.jwt.sub = '00000000-0000-0000-0000-0000000000cc';
insert into public.jobs(id,company_id,title,description,status,created_by,deadline,recruitment_method) values
 ('aaaaaaaa-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Direct job X','A valid description for the direct job at company X.','published','00000000-0000-0000-0000-0000000000e1',current_date+10,'direct'),
 ('aaaaaaaa-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','Managed job X','A valid description for the managed job at company X.','published','00000000-0000-0000-0000-0000000000e1',current_date+10,'next_managed'),
 ('aaaaaaaa-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','Soon expired pub','A valid description for a job that will expire soon.','published','00000000-0000-0000-0000-0000000000e1',current_date+1,'direct'),
 ('aaaaaaaa-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','Soon expired draft','A valid description for a draft that will expire soon.','draft','00000000-0000-0000-0000-0000000000e1',current_date+1,'direct'),
 ('aaaaaaaa-0000-0000-0000-000000000005','11111111-1111-1111-1111-111111111111','Live pub','A valid description for a job that stays live for long.','published','00000000-0000-0000-0000-0000000000e1',current_date+20,'direct');
set request.jwt.sub = '';
insert into public.candidate_profiles(user_id, headline, summary) values
 ('00000000-0000-0000-0000-00000000000a','Pharma rep','Five years in the field'),
 ('00000000-0000-0000-0000-00000000000b','Accountant','Ten years'),
 ('00000000-0000-0000-0000-00000000000c','Driver','Experienced');
insert into public.resumes(id,user_id,storage_path,file_name,mime_type,size_bytes) values
 ('c0000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-00000000000a/cv.pdf','a.pdf','application/pdf',1000),
 ('c0000000-0000-0000-0000-00000000000b','00000000-0000-0000-0000-00000000000b','00000000-0000-0000-0000-00000000000b/cv.pdf','b.pdf','application/pdf',1000),
 ('c0000000-0000-0000-0000-00000000000c','00000000-0000-0000-0000-00000000000c','00000000-0000-0000-0000-00000000000c/cv.pdf','c.pdf','application/pdf',1000);
insert into storage.buckets(id,name,public) values ('resumes','resumes',false) on conflict do nothing;
insert into storage.objects(bucket_id,name,owner) values
 ('resumes','00000000-0000-0000-0000-00000000000a/cv.pdf','00000000-0000-0000-0000-00000000000a'),
 ('resumes','00000000-0000-0000-0000-00000000000b/cv.pdf','00000000-0000-0000-0000-00000000000b'),
 ('resumes','00000000-0000-0000-0000-00000000000c/cv.pdf','00000000-0000-0000-0000-00000000000c');

-- ---------- candidates apply
set role authenticated;
set request.jwt.sub = '00000000-0000-0000-0000-00000000000a';
insert into public.applications(job_id,candidate_id,resume_id,share_profile) values
 ('aaaaaaaa-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000a','c0000000-0000-0000-0000-00000000000a',true);
-- A tries to attach B's CV on another job
insert into public.applications(job_id,candidate_id,resume_id,share_profile) values
 ('aaaaaaaa-0000-0000-0000-000000000005','00000000-0000-0000-0000-00000000000a','c0000000-0000-0000-0000-00000000000b',true);
-- A applies to the managed job with CV
insert into public.applications(job_id,candidate_id,resume_id,share_profile) values
 ('aaaaaaaa-0000-0000-0000-000000000002','00000000-0000-0000-0000-00000000000a','c0000000-0000-0000-0000-00000000000a',true);
set request.jwt.sub = '00000000-0000-0000-0000-00000000000c';
-- C: CV only, profile NOT shared
insert into public.applications(job_id,candidate_id,resume_id,share_profile) values
 ('aaaaaaaa-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000c','c0000000-0000-0000-0000-00000000000c',false);
set request.jwt.sub = '00000000-0000-0000-0000-00000000000b';
-- B: profile only, no CV
insert into public.applications(job_id,candidate_id,resume_id,share_profile) values
 ('aaaaaaaa-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000b',null,true);
reset role; set request.jwt.sub = '';
insert into public.test_results11 select 'A1 own CV attaches', exists(select 1 from public.applications where candidate_id='00000000-0000-0000-0000-00000000000a' and job_id='aaaaaaaa-0000-0000-0000-000000000001' and resume_id is not null);
insert into public.test_results11 select 'A2 foreign CV cannot be attached', not exists(select 1 from public.applications where job_id='aaaaaaaa-0000-0000-0000-000000000005');

-- ---------- employer E1 (direct job of company X)
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000e1';
insert into public.test_results11 select 'E1 sees CV rows of A (direct) and C only', (select count(*) from public.resumes)=2 and exists(select 1 from public.resumes where id='c0000000-0000-0000-0000-00000000000a') and exists(select 1 from public.resumes where id='c0000000-0000-0000-0000-00000000000c');
insert into public.test_results11 select 'E1 sees profiles of A and B (shared), not C (not shared)',
  (select count(*) from public.candidate_profiles)=2 and not exists(select 1 from public.candidate_profiles where user_id='00000000-0000-0000-0000-00000000000c');
insert into public.test_results11 select 'E1 can read the files of A and C only', (select count(*) from storage.objects)=2 and not exists(select 1 from storage.objects where name like '00000000-0000-0000-0000-00000000000b/%');
reset role;

-- E1 must NOT see the managed-job-only exposure: make A's direct application withdrawn first? (separate check below)
-- managed job: put A's attachment only on the managed job application to prove E1 gets nothing from it
update public.applications set resume_id=null where job_id='aaaaaaaa-0000-0000-0000-000000000001' and candidate_id='00000000-0000-0000-0000-00000000000a';
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000e1';
insert into public.test_results11 select 'E1 gets nothing from A''s MANAGED-job application CV', not exists(select 1 from public.resumes where id='c0000000-0000-0000-0000-00000000000a') and not exists(select 1 from storage.objects where name like '00000000-0000-0000-0000-00000000000a/%');
reset role;

-- ---------- employer E2 (other company) and anon
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000e2';
insert into public.test_results11 select 'E2 sees no CV, profile or file', (select count(*) from public.resumes)=0 and (select count(*) from public.candidate_profiles)=0 and (select count(*) from storage.objects)=0;
reset role;
set role anon;
do $$ declare n int; begin begin select count(*) into n from public.resumes; exception when insufficient_privilege then n:=0; end;
 insert into public.test_results11 values ('E3 anon sees no CV', n=0); end $$;
reset role;

-- ---------- staff sees managed application CV
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000cc';
insert into public.test_results11 select 'ST staff sees A''s CV via the managed application', exists(select 1 from public.resumes where id='c0000000-0000-0000-0000-00000000000a') and exists(select 1 from storage.objects where name like '00000000-0000-0000-0000-00000000000a/%');
reset role;

-- ---------- withdrawal ends access
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-00000000000c';
update public.applications set status='withdrawn' where candidate_id='00000000-0000-0000-0000-00000000000c';
reset role;
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000e1';
insert into public.test_results11 select 'W1 withdrawn application removes CV access', not exists(select 1 from public.resumes where id='c0000000-0000-0000-0000-00000000000c') and not exists(select 1 from storage.objects where name like '00000000-0000-0000-0000-00000000000c/%');
reset role;

-- ---------- D) closing date
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000e1';
insert into public.jobs(id,company_id,title,description,created_by,deadline) values
 ('dddddddd-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','D ok','A valid description for the deadline test job.','00000000-0000-0000-0000-0000000000e1',current_date+30);
insert into public.jobs(id,company_id,title,description,created_by) values
 ('dddddddd-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','D null','A valid description for the deadline test job.','00000000-0000-0000-0000-0000000000e1');
insert into public.jobs(id,company_id,title,description,created_by,deadline) values
 ('dddddddd-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','D past','A valid description for the deadline test job.','00000000-0000-0000-0000-0000000000e1',current_date-1);
insert into public.jobs(id,company_id,title,description,created_by,deadline) values
 ('dddddddd-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','D far','A valid description for the deadline test job.','00000000-0000-0000-0000-0000000000e1',current_date+400);
update public.jobs set deadline = current_date-5 where id='dddddddd-0000-0000-0000-000000000001';
reset role;
insert into public.test_results11 select 'D1 valid deadline accepted', exists(select 1 from public.jobs where id='dddddddd-0000-0000-0000-000000000001');
insert into public.test_results11 select 'D2 null deadline rejected', not exists(select 1 from public.jobs where id='dddddddd-0000-0000-0000-000000000002');
insert into public.test_results11 select 'D3 past deadline rejected', not exists(select 1 from public.jobs where id='dddddddd-0000-0000-0000-000000000003');
insert into public.test_results11 select 'D4 deadline beyond 180 days rejected', not exists(select 1 from public.jobs where id='dddddddd-0000-0000-0000-000000000004');
insert into public.test_results11 select 'D5 deadline cannot be moved into the past', (select deadline from public.jobs where id='dddddddd-0000-0000-0000-000000000001') = current_date+30;

-- backdate fixtures (superuser, guard off) to simulate the passing of time
alter table public.jobs disable trigger jobs_guard;
update public.jobs set deadline = current_date-1 where id in ('aaaaaaaa-0000-0000-0000-000000000003','aaaaaaaa-0000-0000-0000-000000000004');
alter table public.jobs enable trigger jobs_guard;
insert into public.applications(job_id,candidate_id) values ('aaaaaaaa-0000-0000-0000-000000000003','00000000-0000-0000-0000-00000000000b');
alter table public.external_jobs disable trigger external_jobs_guard;
insert into public.external_jobs(raw_text,raw_hash,title,source_url,status,expires_at,source_label)
 values ('an old external post that has expired already', repeat('a',64),'Ext old','https://example.com/p/1','published', now()-interval '1 day','src');
alter table public.external_jobs enable trigger external_jobs_guard;

-- authenticated users cannot run the closer
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000cc';
do $$ begin begin perform public.close_expired_jobs(); insert into public.test_results11 values ('X1 authenticated cannot call close_expired_jobs', false);
 exception when insufficient_privilege then insert into public.test_results11 values ('X1 authenticated cannot call close_expired_jobs', true); end; end $$;
reset role;
set role anon;
do $$ begin begin perform public.close_expired_jobs(); insert into public.test_results11 values ('X2 anon cannot call close_expired_jobs', false);
 exception when insufficient_privilege then insert into public.test_results11 values ('X2 anon cannot call close_expired_jobs', true); end; end $$;
reset role;
set role service_role; set request.jwt.sub = '';
do $$ declare r jsonb; begin r := public.close_expired_jobs();
 insert into public.test_results11 values ('X3 service role closes 1 published, archives 1 draft, expires 1 external', r = '{"closed":1,"archived":1,"external_expired":1}'::jsonb); end $$;
reset role;
insert into public.test_results11 select 'X4 expired published job is closed; live job untouched',
  (select status from public.jobs where id='aaaaaaaa-0000-0000-0000-000000000003')='closed' and (select status from public.jobs where id='aaaaaaaa-0000-0000-0000-000000000005')='published';
insert into public.test_results11 select 'X5 expired draft archived', (select status from public.jobs where id='aaaaaaaa-0000-0000-0000-000000000004')='archived';
insert into public.test_results11 select 'X6 applications are kept after closing', exists(select 1 from public.applications where job_id='aaaaaaaa-0000-0000-0000-000000000003');
insert into public.test_results11 select 'X7 external job marked expired', (select status from public.external_jobs where raw_hash=repeat('a',64))='expired';

select test, case when ok then 'PASS' else 'FAIL' end as result from public.test_results11 order by test;
select count(*) filter (where ok) as passed, count(*) filter (where not ok) as failed from public.test_results11;
