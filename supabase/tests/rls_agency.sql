-- RLS/workflow tests for migration 0007 (talent pool, managed recruitment, interviews, alerts, CMS).
-- Run after 0001-0007 on a SCRATCH database with the stub auth schema. State-based: a blocked write may raise OR affect 0 rows.
\set ON_ERROR_STOP off
grant usage on schema public to anon, authenticated;
grant select on public.companies to anon;
grant select, insert, update on public.companies to authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.user_roles, public.company_members to authenticated;
create table public.test_results7(test text, ok boolean);
grant all on public.test_results7 to anon, authenticated;

-- people: A,B candidates | E1 owner of X (approved) | E2 owner of Y (approved) | S1,S2 recruiters | AD next_admin
insert into auth.users(id) values
 ('00000000-0000-0000-0000-00000000000a'),('00000000-0000-0000-0000-00000000000b'),
 ('00000000-0000-0000-0000-0000000000e1'),('00000000-0000-0000-0000-0000000000e2'),
 ('00000000-0000-0000-0000-0000000000c1'),('00000000-0000-0000-0000-0000000000c2'),
 ('00000000-0000-0000-0000-0000000000ad');
insert into public.user_roles(user_id, role) values
 ('00000000-0000-0000-0000-0000000000c1','next_recruiter'),
 ('00000000-0000-0000-0000-0000000000c2','next_recruiter'),
 ('00000000-0000-0000-0000-0000000000ad','next_admin')
 on conflict do nothing;
update public.profiles set full_name = 'Alice Candidate' where id = '00000000-0000-0000-0000-00000000000a';
update public.profiles set full_name = 'Bob Candidate' where id = '00000000-0000-0000-0000-00000000000b';
insert into public.companies(id,slug,name,created_by,verification) values
 ('11111111-1111-1111-1111-111111111111','cx','Company X','00000000-0000-0000-0000-0000000000e1','approved'),
 ('22222222-2222-2222-2222-222222222222','cy','Company Y','00000000-0000-0000-0000-0000000000e2','approved');
insert into public.company_members(company_id,user_id,role) values
 ('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-0000000000e1','owner'),
 ('22222222-2222-2222-2222-222222222222','00000000-0000-0000-0000-0000000000e2','owner');

-- ---------- jobs: staff creates fixtures (guard reads auth.uid())
set request.jwt.sub = '00000000-0000-0000-0000-0000000000c1';
insert into public.jobs(id,company_id,title,description,status,created_by,recruitment_method,hide_employer,show_salary,salary_min,salary_currency) values
 ('aaaaaaaa-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Direct job X','A valid description for the direct job at company X.','published','00000000-0000-0000-0000-0000000000e1','direct',false,false,900,'USD'),
 ('aaaaaaaa-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','Managed hidden job','A valid description for a managed job with hidden employer.','published','00000000-0000-0000-0000-0000000000c1','next_managed',true,false,null,null),
 ('aaaaaaaa-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','Confidential executive role','A valid description for a confidential executive search.','published','00000000-0000-0000-0000-0000000000c1','confidential_executive',true,false,null,null),
 ('aaaaaaaa-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','Managed visible job','A valid description for a managed job with visible employer.','published','00000000-0000-0000-0000-0000000000c1','next_managed',false,true,1200,'USD');
set request.jwt.sub = '';

-- ---------- K1-K4 public surface
set role anon;
insert into public.test_results7 select 'K1 anon: jobs table shows only direct + visible-managed (2 rows)', count(*)=2 from public.jobs;
insert into public.test_results7 select 'K2 anon: job_listings hides executive, shows 3 rows', count(*)=3 from public.job_listings;
insert into public.test_results7 select 'K3 anon: hidden-employer listing has null company', count(*)=1 from public.job_listings where title='Managed hidden job' and company_name is null and company_id is null and employer_hidden;
insert into public.test_results7 select 'K4 anon: salary hidden unless show_salary', (select salary_min is null from public.job_listings where title='Direct job X') and (select salary_min=1200 from public.job_listings where title='Managed visible job');
reset role;

-- ---------- K5-K7 employer cannot use managed methods
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000e1';
insert into public.jobs(company_id,title,description,created_by,recruitment_method) values
 ('11111111-1111-1111-1111-111111111111','E1 managed attempt','A valid description for a managed attempt by employer.','00000000-0000-0000-0000-0000000000e1','next_managed');
insert into public.jobs(company_id,title,description,created_by,hide_employer) values
 ('11111111-1111-1111-1111-111111111111','E1 hidden attempt','A valid description for a hidden attempt by employer.','00000000-0000-0000-0000-0000000000e1',true);
insert into public.jobs(company_id,title,description,created_by) values
 ('11111111-1111-1111-1111-111111111111','E1 direct draft','A valid description for a normal direct draft job.','00000000-0000-0000-0000-0000000000e1');
update public.jobs set recruitment_method='next_managed' where title='E1 direct draft';
reset role;
insert into public.test_results7 select 'K5 employer cannot create next_managed job', count(*)=0 from public.jobs where title='E1 managed attempt';
insert into public.test_results7 select 'K6 employer cannot hide employer', count(*)=0 from public.jobs where title='E1 hidden attempt';
insert into public.test_results7 select 'K7 employer cannot flip own job to managed', recruitment_method='direct' from public.jobs where title='E1 direct draft';
set request.jwt.sub = '00000000-0000-0000-0000-0000000000c1';
insert into public.jobs(company_id,title,description,created_by,recruitment_method,hide_employer) values
 ('11111111-1111-1111-1111-111111111111','Exec not hidden','A valid description for an executive job that is not hidden.','00000000-0000-0000-0000-0000000000c1','confidential_executive',false);
set request.jwt.sub = '';
insert into public.test_results7 select 'K8 DB: confidential_executive requires hide_employer', count(*)=0 from public.jobs where title='Exec not hidden';

-- ---------- applications on managed jobs go to NEXT only
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-00000000000a';
insert into public.applications(id,job_id,candidate_id) values ('bbbbbbbb-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000a');
insert into public.applications(id,job_id,candidate_id) values ('bbbbbbbb-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000002','00000000-0000-0000-0000-00000000000a');
insert into public.applications(id,job_id,candidate_id) values ('bbbbbbbb-0000-0000-0000-000000000003','aaaaaaaa-0000-0000-0000-000000000003','00000000-0000-0000-0000-00000000000a');
reset role;
insert into public.test_results7 select 'K9 candidate can apply to hidden-employer managed job but not to executive', (select count(*) from public.applications where id in ('bbbbbbbb-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000002'))=2
  and (select count(*) from public.applications where id='bbbbbbbb-0000-0000-0000-000000000003')=0;
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000e1';
insert into public.test_results7 select 'K10 client sees applications of its DIRECT job only', (select count(*) from public.applications)=1
  and (select count(*) from public.applications where job_id='aaaaaaaa-0000-0000-0000-000000000001')=1;
insert into public.test_results7 select 'K11 client reads profile of a DIRECT applicant', (select count(*) from public.profiles where id='00000000-0000-0000-0000-00000000000a')=1;
reset role;
-- candidate B applies only to the managed job; E1 must not see B at all
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-00000000000b';
insert into public.applications(id,job_id,candidate_id) values ('bbbbbbbb-0000-0000-0000-000000000004','aaaaaaaa-0000-0000-0000-000000000002','00000000-0000-0000-0000-00000000000b');
reset role;
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000e1';
insert into public.test_results7 select 'K12 client cannot read profile of a candidate who applied only to a managed job', (select count(*) from public.profiles where id='00000000-0000-0000-0000-00000000000b')=0;
update public.applications set status='shortlisted' where id='bbbbbbbb-0000-0000-0000-000000000004';
reset role;
insert into public.test_results7 select 'K13 client cannot change status of a managed application', status='new' from public.applications where id='bbbbbbbb-0000-0000-0000-000000000004';
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000c1';
update public.applications set status='shortlisted' where id='bbbbbbbb-0000-0000-0000-000000000004';
reset role;
insert into public.test_results7 select 'K14 NEXT staff can progress a managed application', status='shortlisted' from public.applications where id='bbbbbbbb-0000-0000-0000-000000000004';

-- ---------- talent pool consent + visibility
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-00000000000a';
insert into public.candidate_profiles(user_id,headline,summary,years_experience,seniority,resume_visibility) values
 ('00000000-0000-0000-0000-00000000000a','Accountant','Five years in accounting.',5,'mid','searchable');
reset role;
insert into public.test_results7 select 'K15 cannot become searchable without consent', count(*)=0 from public.candidate_profiles;
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-00000000000a';
insert into public.candidate_profiles(user_id,headline,summary,years_experience,seniority) values
 ('00000000-0000-0000-0000-00000000000a','Accountant','Five years in accounting.',5,'mid');
reset role;
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000c1';
insert into public.test_results7 select 'K16 staff cannot read a private profile', count(*)=0 from public.candidate_profiles;
reset role;
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-00000000000a';
insert into public.talent_pool_consents(user_id,action,text_version) values ('00000000-0000-0000-0000-00000000000a','granted','v1');
update public.candidate_profiles set resume_visibility='anonymized' where user_id='00000000-0000-0000-0000-00000000000a';
reset role;
insert into public.test_results7 select 'K17 visibility can change after consent', resume_visibility='anonymized' from public.candidate_profiles;
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000c1';
insert into public.test_results7 select 'K18 staff reads consenting non-private profile', count(*)=1 from public.candidate_profiles;
reset role;
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000e1';
insert into public.test_results7 select 'K19 employer cannot read ANY talent-pool profile, resume or consent', (select count(*) from public.candidate_profiles)=0 and (select count(*) from public.resumes)=0 and (select count(*) from public.talent_pool_consents)=0;
reset role;
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-00000000000b';
insert into public.test_results7 select 'K20 other candidate cannot read profile or consents', (select count(*) from public.candidate_profiles)=0 and (select count(*) from public.talent_pool_consents)=0;
update public.candidate_profiles set headline='hacked' where user_id='00000000-0000-0000-0000-00000000000a';
insert into public.resumes(user_id,storage_path,file_name,mime_type,size_bytes) values
 ('00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-00000000000a/spoof.pdf','spoof.pdf','application/pdf',1000);
reset role;
insert into public.test_results7 select 'K21 other candidate cannot modify or write for A', (select headline from public.candidate_profiles)='Accountant' and (select count(*) from public.resumes)=0;
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-00000000000a';
insert into public.resumes(user_id,storage_path,file_name,mime_type,size_bytes) values ('00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-00000000000a/cv.pdf','cv.pdf','application/pdf',200000);
insert into public.resumes(user_id,storage_path,file_name,mime_type,size_bytes) values ('00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-00000000000a/bad.exe','bad.exe','application/x-msdownload',2000);
insert into public.resumes(user_id,storage_path,file_name,mime_type,size_bytes) values ('00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-00000000000b/stolen.pdf','stolen.pdf','application/pdf',2000);
insert into public.resumes(user_id,storage_path,file_name,mime_type,size_bytes) values ('00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-00000000000a/huge.pdf','huge.pdf','application/pdf',9999999);
reset role;
insert into public.test_results7 select 'K23 resume constraints: only the valid own PDF stored', count(*)=1 from public.resumes;
-- staff sees resume only for searchable
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000c1';
insert into public.test_results7 select 'K24 staff cannot read resume of an anonymized (non-searchable) profile', count(*)=0 from public.resumes;
reset role;
-- withdrawal resets visibility
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-00000000000a';
update public.candidate_profiles set resume_visibility='searchable' where user_id='00000000-0000-0000-0000-00000000000a';
reset role;
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000c1';
insert into public.test_results7 select 'K25 staff reads resume of searchable consenting profile', count(*)=1 from public.resumes;
reset role;
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-00000000000a';
insert into public.talent_pool_consents(user_id,action,text_version) values ('00000000-0000-0000-0000-00000000000a','withdrawn','v1');
update public.talent_pool_consents set action='granted' where user_id='00000000-0000-0000-0000-00000000000a';
delete from public.talent_pool_consents where user_id='00000000-0000-0000-0000-00000000000a';
reset role;
insert into public.test_results7 select 'K26 withdrawal resets visibility to private', resume_visibility='private' from public.candidate_profiles;
insert into public.test_results7 select 'K27 consent history is append-only (2 rows, last=withdrawn)', (select count(*) from public.talent_pool_consents)=2 and (select action from public.talent_pool_consents order by id desc limit 1)='withdrawn';
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000c1';
insert into public.test_results7 select 'K28 staff loses access after withdrawal (profile + resume)', (select count(*) from public.candidate_profiles)=0 and (select count(*) from public.resumes)=0;
reset role;
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-00000000000a';
update public.candidate_profiles set resume_visibility='searchable' where user_id='00000000-0000-0000-0000-00000000000a';
reset role;
insert into public.test_results7 select 'K29 cannot re-enable visibility after withdrawal', resume_visibility='private' from public.candidate_profiles;
-- re-grant (fresh consent) so later shortlist tests can use A
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-00000000000a';
insert into public.talent_pool_consents(user_id,action,text_version) values ('00000000-0000-0000-0000-00000000000a','granted','v2');
reset role;

-- ---------- recruitment requests
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000e1';
insert into public.recruitment_requests(id,company_id,requester_id,positions,vacancies_count,industry) values
 ('cccccccc-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-0000000000e1','Two sales managers',2,'sales');
insert into public.recruitment_requests(company_id,requester_id,positions) values
 ('22222222-2222-2222-2222-222222222222','00000000-0000-0000-0000-0000000000e1','Foreign company attempt');
reset role;
insert into public.test_results7 select 'K30 owner submits request for own company only', (select count(*) from public.recruitment_requests where id='cccccccc-0000-0000-0000-000000000001')=1
  and (select count(*) from public.recruitment_requests where positions='Foreign company attempt')=0;
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000e2';
insert into public.test_results7 select 'K31 other company cannot read the request', count(*)=0 from public.recruitment_requests;
update public.recruitment_requests set status='closed' where id='cccccccc-0000-0000-0000-000000000001';
reset role;
insert into public.test_results7 select 'K32 other company cannot change the request', status='submitted' from public.recruitment_requests where id='cccccccc-0000-0000-0000-000000000001';
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-00000000000a';
insert into public.recruitment_requests(company_id,requester_id,positions) values ('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-00000000000a','Candidate attempt');
reset role;
insert into public.test_results7 select 'K33 candidate cannot create requests', count(*)=0 from public.recruitment_requests where positions='Candidate attempt';
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000e1';
update public.recruitment_requests set status='in_progress' where id='cccccccc-0000-0000-0000-000000000001';
reset role;
insert into public.test_results7 select 'K34 client cannot skip workflow states', status='submitted' from public.recruitment_requests where id='cccccccc-0000-0000-0000-000000000001';
-- staff sees unassigned submitted request, assignment by admin only
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000c1';
insert into public.test_results7 select 'K35 recruiter sees a new (unassigned) request', count(*)=1 from public.recruitment_requests;
insert into public.agency_assignments(request_id,recruiter_id,assigned_by) values ('cccccccc-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000c1','00000000-0000-0000-0000-0000000000c1');
reset role;
insert into public.test_results7 select 'K36 recruiter cannot self-assign', count(*)=0 from public.agency_assignments;
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000ad';
insert into public.agency_assignments(request_id,recruiter_id,assigned_by) values ('cccccccc-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-0000000000ad');
insert into public.agency_assignments(request_id,recruiter_id,assigned_by) values ('cccccccc-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000c1','00000000-0000-0000-0000-0000000000ad');
reset role;
insert into public.test_results7 select 'K37 admin assigns staff only (candidate rejected), request becomes assigned', (select count(*) from public.agency_assignments)=1 and (select status='assigned' from public.recruitment_requests where id='cccccccc-0000-0000-0000-000000000001');
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000c2';
insert into public.test_results7 select 'K38 unassigned recruiter no longer sees it', count(*)=0 from public.recruitment_requests;
update public.recruitment_requests set status='in_progress' where id='cccccccc-0000-0000-0000-000000000001';
reset role;
insert into public.test_results7 select 'K39 unassigned recruiter cannot progress it', status='assigned' from public.recruitment_requests where id='cccccccc-0000-0000-0000-000000000001';
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000c1';
update public.recruitment_requests set status='in_progress' where id='cccccccc-0000-0000-0000-000000000001';
reset role;
insert into public.test_results7 select 'K40 assigned recruiter progresses to in_progress', status='in_progress' from public.recruitment_requests where id='cccccccc-0000-0000-0000-000000000001';

-- ---------- shortlist (A full disclosure needing consent, B anonymized)
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000c2';
insert into public.shortlists(id,request_id,title,created_by) values ('dddddddd-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000001','Hijack','00000000-0000-0000-0000-0000000000c2');
reset role;
insert into public.test_results7 select 'K41 unassigned recruiter cannot create shortlist for the request', count(*)=0 from public.shortlists;
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000e1';
insert into public.shortlists(id,request_id,title,created_by) values ('dddddddd-0000-0000-0000-000000000002','cccccccc-0000-0000-0000-000000000001','Client made','00000000-0000-0000-0000-0000000000e1');
reset role;
insert into public.test_results7 select 'K42 client cannot create shortlists', count(*)=0 from public.shortlists;
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000c1';
insert into public.shortlists(id,request_id,title,created_by) values ('dddddddd-0000-0000-0000-000000000003','cccccccc-0000-0000-0000-000000000001','Sales managers','00000000-0000-0000-0000-0000000000c1');
insert into public.shortlist_items(id,shortlist_id,candidate_id,disclosure) values
 ('eeeeeeee-0000-0000-0000-000000000001','dddddddd-0000-0000-0000-000000000003','00000000-0000-0000-0000-00000000000a','full'),
 ('eeeeeeee-0000-0000-0000-000000000002','dddddddd-0000-0000-0000-000000000003','00000000-0000-0000-0000-00000000000b','anonymized');
reset role;
insert into public.test_results7 select 'K43 assigned recruiter builds shortlist with 2 items', (select count(*) from public.shortlist_items)=2;
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000e1';
insert into public.test_results7 select 'K44 client sees nothing from a draft shortlist (table, items, view)', (select count(*) from public.shortlists)=0 and (select count(*) from public.shortlist_items)=0 and (select count(*) from public.client_shortlist_view)=0;
reset role;
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000c1';
update public.shortlists set status='submitted' where id='dddddddd-0000-0000-0000-000000000003';
reset role;
insert into public.test_results7 select 'K45 cannot submit while a FULL disclosure lacks consent', status='draft' from public.shortlists where id='dddddddd-0000-0000-0000-000000000003';
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000c1';
update public.shortlist_items set consent_status='granted' where id='eeeeeeee-0000-0000-0000-000000000001';
reset role;
insert into public.test_results7 select 'K46 staff cannot grant consent on behalf of a candidate', consent_status='pending' from public.shortlist_items where id='eeeeeeee-0000-0000-0000-000000000001';
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-00000000000b';
update public.shortlist_items set consent_status='granted' where id='eeeeeeee-0000-0000-0000-000000000001';
update public.shortlist_items set disclosure='full' where id='eeeeeeee-0000-0000-0000-000000000002';
do $$ begin perform public.respond_shortlist_consent('eeeeeeee-0000-0000-0000-000000000001', true); exception when others then null; end $$;
reset role;
insert into public.test_results7 select 'K47 candidate B cannot touch A''s row nor change own disclosure', (select consent_status from public.shortlist_items where id='eeeeeeee-0000-0000-0000-000000000001')='pending'
  and (select disclosure from public.shortlist_items where id='eeeeeeee-0000-0000-0000-000000000002')='anonymized';
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-00000000000a';
insert into public.test_results7 select 'K48 candidate A has NO direct table access (recruiter_note stays internal) but sees own consent request', (select count(*) from public.shortlist_items)=0 and (select count(*) from public.my_consent_requests)=1;
update public.shortlist_items set consent_status='granted', recruiter_note='edited' where id='eeeeeeee-0000-0000-0000-000000000001';
reset role;
insert into public.test_results7 select 'K49 candidate cannot edit recruiter note', recruiter_note is distinct from 'edited' from public.shortlist_items where id='eeeeeeee-0000-0000-0000-000000000001';
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-00000000000a';
select public.respond_shortlist_consent('eeeeeeee-0000-0000-0000-000000000001', true);
reset role;
insert into public.test_results7 select 'K50 candidate A grants consent through respond_shortlist_consent', consent_status='granted' from public.shortlist_items where id='eeeeeeee-0000-0000-0000-000000000001';
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000c1';
update public.shortlists set status='submitted' where id='dddddddd-0000-0000-0000-000000000003';
reset role;
insert into public.test_results7 select 'K51 shortlist submits; request moves to shortlist_sent', (select status from public.shortlists where id='dddddddd-0000-0000-0000-000000000003')='submitted'
  and (select status from public.recruitment_requests where id='cccccccc-0000-0000-0000-000000000001')='shortlist_sent';
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000e1';
insert into public.test_results7 select 'K52 client sees submitted shortlist header', count(*)=1 from public.shortlists;
insert into public.test_results7 select 'K53 client has NO direct access to shortlist_items', count(*)=0 from public.shortlist_items;
insert into public.test_results7 select 'K54 client view: 2 candidates, A named (consented), B anonymous', (select count(*) from public.client_shortlist_view)=2
  and (select count(*) from public.client_shortlist_view where full_name='Alice Candidate')=1
  and (select count(*) from public.client_shortlist_view where full_name is null and reference like 'Candidate %')=1;
insert into public.test_results7 select 'K55 client view never exposes B''s name', count(*)=0 from public.client_shortlist_view where full_name ilike '%Bob%';
reset role;
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000e2';
insert into public.test_results7 select 'K56 other company sees no shortlist data', (select count(*) from public.shortlists)=0 and (select count(*) from public.client_shortlist_view)=0;
reset role;
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000c1';
update public.shortlist_items set recruiter_note='late edit' where id='eeeeeeee-0000-0000-0000-000000000002';
delete from public.shortlist_items where id='eeeeeeee-0000-0000-0000-000000000002';
reset role;
insert into public.test_results7 select 'K57 submitted shortlist is immutable (no edit, no delete)', (select count(*) from public.shortlist_items)=2 and (select recruiter_note from public.shortlist_items where id='eeeeeeee-0000-0000-0000-000000000002') is null;
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-00000000000a';
select public.respond_shortlist_consent('eeeeeeee-0000-0000-0000-000000000001', false);
reset role;
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000e1';
insert into public.test_results7 select 'K58 consent revocation removes A from the client view immediately', (select count(*) from public.client_shortlist_view)=1 and (select count(*) from public.client_shortlist_view where full_name is not null)=0;
reset role;
-- client may finish the request (placed) only via staff
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000e1';
update public.recruitment_requests set status='placed' where id='cccccccc-0000-0000-0000-000000000001';
reset role;
insert into public.test_results7 select 'K59 client cannot mark a placement', status='shortlist_sent' from public.recruitment_requests where id='cccccccc-0000-0000-0000-000000000001';
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000c1';
update public.recruitment_requests set status='placed' where id='cccccccc-0000-0000-0000-000000000001';
reset role;
insert into public.test_results7 select 'K60 assigned recruiter records placement', status='placed' from public.recruitment_requests where id='cccccccc-0000-0000-0000-000000000001';
-- client can withdraw an unassigned request
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000e2';
insert into public.recruitment_requests(id,company_id,requester_id,positions) values ('cccccccc-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222','00000000-0000-0000-0000-0000000000e2','Driver');
update public.recruitment_requests set status='closed' where id='cccccccc-0000-0000-0000-000000000002';
reset role;
insert into public.test_results7 select 'K61 client may withdraw its own unassigned request', status='closed' from public.recruitment_requests where id='cccccccc-0000-0000-0000-000000000002';

-- ---------- interviews
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000e1';
insert into public.interviews(id,application_id,scheduled_at,created_by) values ('f0f0f0f0-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000001', now()+interval '2 days','00000000-0000-0000-0000-0000000000e1');
insert into public.interviews(id,application_id,scheduled_at,created_by) values ('f0f0f0f0-0000-0000-0000-000000000002','bbbbbbbb-0000-0000-0000-000000000004', now()+interval '2 days','00000000-0000-0000-0000-0000000000e1');
insert into public.interview_feedback(interview_id,author_id,body,recommendation) values ('f0f0f0f0-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000e1','Strong candidate','advance');
reset role;
insert into public.test_results7 select 'K62 client schedules interviews for DIRECT applications only', (select count(*) from public.interviews where id='f0f0f0f0-0000-0000-0000-000000000001')=1 and (select count(*) from public.interviews where id='f0f0f0f0-0000-0000-0000-000000000002')=0;
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-00000000000a';
insert into public.test_results7 select 'K63 candidate sees own interview but not feedback', (select count(*) from public.interviews)=1 and (select count(*) from public.interview_feedback)=0;
reset role;
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000e2';
insert into public.test_results7 select 'K64 other company sees no interviews or feedback', (select count(*) from public.interviews)=0 and (select count(*) from public.interview_feedback)=0;
reset role;
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-00000000000b';
insert into public.test_results7 select 'K65 other candidate sees no interviews', count(*)=0 from public.interviews;
reset role;
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000c1';
insert into public.interviews(id,application_id,scheduled_at,created_by) values ('f0f0f0f0-0000-0000-0000-000000000003','bbbbbbbb-0000-0000-0000-000000000004', now()+interval '3 days','00000000-0000-0000-0000-0000000000c1');
insert into public.interview_feedback(interview_id,author_id,body) values ('f0f0f0f0-0000-0000-0000-000000000003','00000000-0000-0000-0000-0000000000c1','Good fit');
reset role;
insert into public.test_results7 select 'K66 NEXT staff schedules + records feedback for a managed application', (select count(*) from public.interviews where id='f0f0f0f0-0000-0000-0000-000000000003')=1 and (select count(*) from public.interview_feedback where body='Good fit')=1;
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000e1';
insert into public.test_results7 select 'K67 client cannot see the managed interview or its feedback', (select count(*) from public.interviews where id='f0f0f0f0-0000-0000-0000-000000000003')=0 and (select count(*) from public.interview_feedback where body='Good fit')=0;
reset role;

-- ---------- job alerts
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-00000000000a';
do $$ declare g int; begin
  for g in 1..12 loop
    begin insert into public.job_alerts(user_id,keyword,city) values ('00000000-0000-0000-0000-00000000000a','k'||g,'baghdad');
    exception when others then null; end;
  end loop;
end $$;
reset role;
insert into public.test_results7 select 'K68 alerts capped at exactly 10 per user (guard blocks #11 and #12)', count(*)=10 from public.job_alerts;
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-00000000000b';
insert into public.test_results7 select 'K69 other user sees no alerts', count(*)=0 from public.job_alerts;
insert into public.job_alerts(user_id,keyword) values ('00000000-0000-0000-0000-00000000000a','spoof');
reset role;
insert into public.test_results7 select 'K70 cannot create alert for someone else', count(*)=0 from public.job_alerts where keyword='spoof';

-- ---------- articles / CMS
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000c1';
insert into public.articles(id,slug,title,body,category,author_id,author_name,status) values
 ('a0a0a0a0-0000-0000-0000-000000000001','draft-guide','Draft guide','Body text.','recruitment_guide','00000000-0000-0000-0000-0000000000c1','NEXT Team','draft');
insert into public.articles(id,slug,title,body,category,author_id,author_name,status) values
 ('a0a0a0a0-0000-0000-0000-000000000002','self-published','Self published','Body text.','recruitment_guide','00000000-0000-0000-0000-0000000000c1','NEXT Team','published');
reset role;
insert into public.test_results7 select 'K71 recruiter can draft but cannot publish', (select count(*) from public.articles where slug='draft-guide')=1 and (select count(*) from public.articles where slug='self-published')=0;
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000ad';
update public.articles set status='published' where slug='draft-guide';
reset role;
insert into public.test_results7 select 'K72 admin publishes; published_at is set', (select status='published' and published_at is not null from public.articles where slug='draft-guide');
set role anon;
insert into public.test_results7 select 'K73 anon reads published articles only', (select count(*) from public.articles)=1;
reset role;
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000c1';
update public.articles set status='draft' where slug='draft-guide';
reset role;
insert into public.test_results7 select 'K74 recruiter cannot unpublish', status='published' from public.articles where slug='draft-guide';
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-00000000000a';
insert into public.articles(slug,title,body,category,author_id,author_name) values ('cand-article','Candidate article','Body text.','career_article','00000000-0000-0000-0000-00000000000a','Alice');
reset role;
insert into public.test_results7 select 'K75 candidate cannot write articles', count(*)=0 from public.articles where slug='cand-article';
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-00000000000b';
insert into public.test_results7 select 'K76 candidate cannot read drafts', count(*)=1 from public.articles;
reset role;

-- ---------- audit trail
insert into public.test_results7 select 'K77 audit rows exist for consent, request, assignment, shortlist, article',
  (select count(distinct action) from public.audit_logs where action in
    ('talent_pool_granted','talent_pool_withdrawn','request_submitted','request_assigned','shortlist_submitted','article_published','shortlist_consent_granted','request_placed'))=8;
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000e1';
do $$ declare n int; begin
  begin select count(*) into n from public.audit_logs; exception when insufficient_privilege then n := 0; end;
  insert into public.test_results7 values ('K78 client cannot read audit logs', n = 0);
end $$;
reset role;
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000c1';
insert into public.audit_logs(action, entity_type) values ('forged','x');
reset role;
insert into public.test_results7 select 'K79 audit log cannot be forged by users', count(*)=0 from public.audit_logs where action='forged';

select test, case when ok then 'PASS' else 'FAIL' end as result from public.test_results7 order by length(test), test;
select count(*) filter (where ok) as passed, count(*) as total from public.test_results7;
