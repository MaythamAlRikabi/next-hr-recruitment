-- Storage policy tests for migration 0008. Run after 0001-0008 on a SCRATCH db with the stub auth + storage schemas.
-- NOTE: stubbed Storage — the real bucket limits (size / mime) are enforced by the Storage API and are NOT tested here.
\set ON_ERROR_STOP off
grant usage on schema public to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.user_roles, public.company_members to authenticated;
grant select, insert, update on public.companies to authenticated;
create table public.test_results8(test text, ok boolean);
grant all on public.test_results8 to anon, authenticated;
insert into auth.users(id) values
 ('00000000-0000-0000-0000-00000000000a'),('00000000-0000-0000-0000-00000000000b'),
 ('00000000-0000-0000-0000-0000000000e1'),('00000000-0000-0000-0000-0000000000c1');
insert into public.user_roles(user_id, role) values ('00000000-0000-0000-0000-0000000000c1','next_recruiter') on conflict do nothing;
insert into public.companies(id,slug,name,created_by,verification) values
 ('11111111-1111-1111-1111-111111111111','cx','Company X','00000000-0000-0000-0000-0000000000e1','approved');
insert into public.company_members(company_id,user_id,role) values ('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-0000000000e1','owner');

insert into public.test_results8 select 'S1 bucket is private with 5 MB limit and pdf/docx only',
  (select not public and file_size_limit=5242880 and allowed_mime_types @> array['application/pdf'] and cardinality(allowed_mime_types)=2 from storage.buckets where id='resumes');

set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-00000000000a';
insert into storage.objects(bucket_id,name,owner) values ('resumes','00000000-0000-0000-0000-00000000000a/cv.pdf','00000000-0000-0000-0000-00000000000a');
insert into storage.objects(bucket_id,name,owner) values ('resumes','00000000-0000-0000-0000-00000000000b/planted.pdf','00000000-0000-0000-0000-00000000000a');
insert into storage.objects(bucket_id,name,owner) values ('resumes','cv-root.pdf','00000000-0000-0000-0000-00000000000a');
reset role;
insert into public.test_results8 select 'S2 candidate can upload only into own folder', (select count(*) from storage.objects)=1 and exists(select 1 from storage.objects where name='00000000-0000-0000-0000-00000000000a/cv.pdf');
-- fixture for another user's file (inserted as superuser)
insert into storage.objects(bucket_id,name,owner) values ('resumes','00000000-0000-0000-0000-00000000000b/b.pdf','00000000-0000-0000-0000-00000000000b');

set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-00000000000a';
insert into public.test_results8 select 'S3 candidate reads own file only', (select count(*) from storage.objects)=1;
delete from storage.objects where name='00000000-0000-0000-0000-00000000000b/b.pdf';
reset role;
insert into public.test_results8 select 'S4 candidate cannot delete another user''s file', exists(select 1 from storage.objects where name='00000000-0000-0000-0000-00000000000b/b.pdf');
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-00000000000a';
update storage.objects set name='00000000-0000-0000-0000-00000000000a/renamed.pdf' where name='00000000-0000-0000-0000-00000000000a/cv.pdf';
reset role;
insert into public.test_results8 select 'S5 no UPDATE policy: file cannot be renamed/moved', exists(select 1 from storage.objects where name='00000000-0000-0000-0000-00000000000a/cv.pdf');

set role anon;
do $$ declare n int; begin
  begin select count(*) into n from storage.objects; exception when insufficient_privilege then n := 0; end;
  insert into public.test_results8 values ('S6 anonymous sees nothing', n=0);
end $$;
reset role;

-- metadata row for A's CV; profile private -> staff must not read the file
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-00000000000a';
insert into public.candidate_profiles(user_id,headline) values ('00000000-0000-0000-0000-00000000000a','Accountant');
insert into public.resumes(user_id,storage_path,file_name,mime_type,size_bytes) values ('00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-00000000000a/cv.pdf','cv.pdf','application/pdf',1000);
reset role;
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000c1';
insert into public.test_results8 select 'S7 staff cannot read a private candidate''s file', (select count(*) from storage.objects)=0;
reset role;

-- consent + searchable -> staff can read A's file, but not B's
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-00000000000a';
insert into public.talent_pool_consents(user_id,action,text_version) values ('00000000-0000-0000-0000-00000000000a','granted','v1');
update public.candidate_profiles set resume_visibility='searchable' where user_id='00000000-0000-0000-0000-00000000000a';
reset role;
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000c1';
insert into public.test_results8 select 'S8 staff reads file of searchable + consenting candidate only', (select count(*) from storage.objects)=1 and exists(select 1 from storage.objects where name like '%000a/cv.pdf');
delete from storage.objects where name like '%000a/cv.pdf';
reset role;
insert into public.test_results8 select 'S9 staff cannot delete candidate files', exists(select 1 from storage.objects where name like '%000a/cv.pdf');

set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000e1';
insert into public.test_results8 select 'S10 client company member cannot read any CV file', (select count(*) from storage.objects)=0;
reset role;

-- withdrawal removes staff access to the blob
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-00000000000a';
insert into public.talent_pool_consents(user_id,action,text_version) values ('00000000-0000-0000-0000-00000000000a','withdrawn','v1');
reset role;
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000c1';
insert into public.test_results8 select 'S11 withdrawal removes staff access to the file at once', (select count(*) from storage.objects)=0;
reset role;

select test, case when ok then 'PASS' else 'FAIL' end as result from public.test_results8 order by length(test), test;
select count(*) filter (where ok) as passed, count(*) as total from public.test_results8;
