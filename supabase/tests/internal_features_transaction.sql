-- Integration test: synthetic fixtures, all changes rolled back. Run as postgres.
begin;
create temp table fixture as select gen_random_uuid() a, gen_random_uuid() b, gen_random_uuid() employer, gen_random_uuid() staff, gen_random_uuid() company, gen_random_uuid() job, gen_random_uuid() application;
grant select on fixture to authenticated;
insert into auth.users(id,raw_user_meta_data) select a,'{}'::jsonb from fixture union all select b,'{}'::jsonb from fixture union all select employer,'{"account_purpose":"employer"}'::jsonb from fixture union all select staff,'{}'::jsonb from fixture;
insert into public.user_roles(user_id,role) select staff,'next_admin' from fixture;
select set_config('request.jwt.claim.sub',staff::text,true) from fixture;
insert into public.companies(id,slug,name,created_by,verification) select company,'test-'||company,'Transaction test company',employer,'approved' from fixture;
insert into public.company_members(company_id,user_id,role) select company,employer,'owner' from fixture;
insert into public.jobs(id,company_id,title,description,created_by,status,deadline,published_at) select job,company,'Internal test job','Synthetic integration test vacancy. Rolled back after checks.',employer,'published',current_date+7,now() from fixture;
select set_config('request.jwt.claim.sub',a::text,true) from fixture;
set local role authenticated;
insert into public.cv_drafts(user_id,document) select a,'{"version":1,"cv":{"name":"Test"}}' from fixture;
insert into public.applications(id,job_id,candidate_id) select application,job,a from fixture;
do $$ begin
 if (select count(*) from public.notifications where event_key like 'application:%')<>1 then raise exception 'missing candidate notification'; end if;
end $$;
update public.notifications set read_at=now();
select set_config('request.jwt.claim.sub',b::text,true) from fixture;
do $$ begin
 if exists(select 1 from public.cv_drafts) then raise exception 'draft leaked across users'; end if;
 if exists(select 1 from public.notifications) then raise exception 'notification leaked across users'; end if;
 begin
  insert into public.cv_drafts(user_id,document) select a,'{}' from fixture;
  raise exception 'cross-user draft write allowed';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.notifications(user_id,title_ar,title_en,href,event_key) select b,'x','x','/candidate','forged' from fixture;
  raise exception 'forged notification allowed';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub',employer::text,true) from fixture;
do $$ begin
 if (select count(*) from public.notifications where event_key like 'new-application:%')<>1 then raise exception 'missing employer notification'; end if;
 if exists(select 1 from public.cv_drafts) then raise exception 'draft leaked to employer'; end if;
end $$;
update public.applications set status='shortlisted' where id=(select application from fixture);
select set_config('request.jwt.claim.sub',a::text,true) from fixture;
do $$ begin
 if (select count(*) from public.notifications where event_key like 'application:%')<>2 then raise exception 'missing stage notification'; end if;
 if (select count(*) from public.applications where status='shortlisted')<>1 then raise exception 'stage change failed'; end if;
 begin
  update public.notifications set title_en='forged';
  raise exception 'notification content editable';
 exception when insufficient_privilege then null; end;
end $$;
insert into public.job_alerts(user_id,keyword,created_at) select a,'Internal test job',now()-interval '1 minute' from fixture;
reset role;
select private.deliver_job_alerts();
select set_config('request.jwt.claim.sub',a::text,true) from fixture;
set local role authenticated;
do $$ begin
 if (select count(*) from public.notifications where event_key like 'job-alert:%')<>1 then raise exception 'job alert not delivered'; end if;
end $$;
reset role;
select private.deliver_job_alerts();
do $$ begin
 if (select count(*) from public.notifications where user_id=(select a from fixture) and event_key like 'job-alert:%')<>1 then raise exception 'duplicate alert'; end if;
end $$;
select 'PASS: application receipt, employer inbox, status update, read marker, draft isolation, forged write denial, alert delivery and deduplication' result;
rollback;
