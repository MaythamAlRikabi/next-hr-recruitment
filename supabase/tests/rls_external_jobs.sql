-- RLS/workflow tests for migration 0009 (external jobs). Run after 0001-0009 on a SCRATCH database with the stub auth schema.
\set ON_ERROR_STOP off
grant usage on schema public to anon, authenticated;
create table public.test_results9(test text, ok boolean);
grant all on public.test_results9 to anon, authenticated;

insert into auth.users(id) values
 ('00000000-0000-0000-0000-0000000000c1'),  -- recruiter
 ('00000000-0000-0000-0000-00000000000a'),  -- candidate
 ('00000000-0000-0000-0000-0000000000e1');  -- employer
insert into public.user_roles(user_id, role) values ('00000000-0000-0000-0000-0000000000c1','next_recruiter') on conflict do nothing;

-- staff: source + 3 jobs
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000c1';
insert into public.job_sources(id,kind,name,handle,basis) values ('51111111-0000-0000-0000-000000000001','telegram_channel','Test channel','test_channel','Channel owner gave written permission');
insert into public.external_jobs(id,source_id,source_label,external_ref,source_url,raw_text,raw_hash,title,agency,city,apply_url,salary_min,salary_max,salary_currency,status) values
 ('e0000000-0000-0000-0000-000000000001','51111111-0000-0000-0000-000000000001','Test channel','test_channel/1','https://t.me/test_channel/1','Raw post text for the first external vacancy, long enough.',repeat('a',64),'First external job','MasterMinds','baghdad','https://example.com/apply',700,1000,'USD','pending_review'),
 ('e0000000-0000-0000-0000-000000000002','51111111-0000-0000-0000-000000000001','Test channel','test_channel/2','https://t.me/test_channel/2','Raw post text for the second external vacancy, long enough.',repeat('b',64),'Second external job',null,'erbil','https://example.com/apply2',null,null,null,'pending_review'),
 ('e0000000-0000-0000-0000-000000000003','51111111-0000-0000-0000-000000000001','Test channel','test_channel/3','https://t.me/test_channel/3','Raw post text for the third external vacancy, long enough.',repeat('c',64),'Third external job',null,'basra','https://example.com/apply3',null,null,null,'pending_review');
-- publish #1 and #3, expire #3 later
update public.external_jobs set status='published' where id in ('e0000000-0000-0000-0000-000000000001','e0000000-0000-0000-0000-000000000003');
reset role; set request.jwt.sub = '';
update public.external_jobs set expires_at = now() - interval '1 day' where id = 'e0000000-0000-0000-0000-000000000003';

insert into public.test_results9 select 'E1 staff created 3 jobs with created_by = staff', count(*)=3 and bool_and(created_by='00000000-0000-0000-0000-0000000000c1') from public.external_jobs;
insert into public.test_results9 select 'E2 publish sets reviewed_by + published_at', (select reviewed_by='00000000-0000-0000-0000-0000000000c1' and published_at is not null from public.external_jobs where id='e0000000-0000-0000-0000-000000000001');

-- anon
set role anon;
insert into public.test_results9 select 'E3 anon: base table has no rows visible/readable', (select count(*) from (select 1) x) = 1;
reset role;
do $$ begin
  set local role anon;
  perform 1 from public.external_jobs;
  insert into public.test_results9 values ('E3b anon cannot select base table', false);
exception when insufficient_privilege then
  reset role;
  insert into public.test_results9 values ('E3b anon cannot select base table', true);
end $$;
do $$ begin
  set local role anon;
  perform 1 from public.job_sources;
  insert into public.test_results9 values ('E3c anon cannot select job_sources', false);
exception when insufficient_privilege then
  reset role;
  insert into public.test_results9 values ('E3c anon cannot select job_sources', true);
end $$;
set role anon;
insert into public.test_results9 select 'E4 anon view: exactly the published, unexpired job', count(*)=1 and min(title)='First external job' from public.external_job_listings;
insert into public.test_results9 select 'E5 view exposes no raw_text/hash/reviewer columns', not exists (select 1 from information_schema.columns where table_name='external_job_listings' and column_name in ('raw_text','raw_hash','reviewed_by','created_by','parse_warnings','status'));
reset role;

-- authenticated non-staff (candidate, employer)
do $$ declare u text; begin
  foreach u in array array['00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-0000000000e1'] loop
    perform set_config('request.jwt.sub', u, false);
    set local role authenticated;
    begin
      insert into public.external_jobs(source_label,raw_text,raw_hash,title,apply_url) values ('xx','Raw post text that is long enough to pass.',repeat('d',64),'Hack job','https://x.example');
      reset role;
      insert into public.test_results9 values ('E6 non-staff ('||right(u,2)||') cannot insert', false);
    exception when others then
      reset role;
      insert into public.test_results9 values ('E6 non-staff ('||right(u,2)||') cannot insert', true);
    end;
    set local role authenticated;
    insert into public.test_results9 select 'E7 non-staff ('||right(u,2)||') reads 0 base rows', count(*)=0 from public.external_jobs;
    update public.external_jobs set status='published' where id='e0000000-0000-0000-0000-000000000002';
    reset role;
    insert into public.test_results9 select 'E8 non-staff ('||right(u,2)||') cannot publish', status='pending_review' from public.external_jobs where id='e0000000-0000-0000-0000-000000000002';
  end loop;
  perform set_config('request.jwt.sub','',false);
end $$;

-- data integrity (as staff)
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000c1';
create temp table _try(name text, ok boolean);
do $$ begin
  begin insert into public.external_jobs(source_label,raw_text,raw_hash,title,apply_url) values ('xx','Raw post text that is long enough to pass.',repeat('a',64),'Duplicate hash','https://x.example'); insert into _try values ('E9 duplicate raw_hash rejected', false);
  exception when unique_violation then insert into _try values ('E9 duplicate raw_hash rejected', true); end;
  begin insert into public.external_jobs(source_id,source_label,external_ref,raw_text,raw_hash,title,apply_url) values ('51111111-0000-0000-0000-000000000001','xx','test_channel/1','Raw post text that is long enough to pass.',repeat('e',64),'Dup ref','https://x.example'); insert into _try values ('E10 duplicate (source, external_ref) rejected', false);
  exception when unique_violation then insert into _try values ('E10 duplicate (source, external_ref) rejected', true); end;
  begin insert into public.external_jobs(source_label,raw_text,raw_hash,title,apply_url,salary_min,salary_max,salary_currency) values ('xx','Raw post text that is long enough to pass.',repeat('f',64),'Bad range','https://x.example',900,100,'USD'); insert into _try values ('E11 salary_max < salary_min rejected', false);
  exception when check_violation then insert into _try values ('E11 salary_max < salary_min rejected', true); end;
  begin insert into public.external_jobs(source_label,raw_text,raw_hash,title,apply_url,salary_min) values ('xx','Raw post text that is long enough to pass.',repeat('1',64),'No currency','https://x.example',900); insert into _try values ('E12 salary without currency rejected', false);
  exception when check_violation then insert into _try values ('E12 salary without currency rejected', true); end;
  begin insert into public.external_jobs(source_label,raw_text,raw_hash,title) values ('xx','Raw post text that is long enough to pass.',repeat('2',64),'No route'); insert into _try values ('E13 no apply route rejected', false);
  exception when check_violation then insert into _try values ('E13 no apply route rejected', true); end;
  begin insert into public.external_jobs(source_label,raw_text,raw_hash,title,apply_url) values ('xx','Raw post text that is long enough to pass.',repeat('3',64),'JS link','javascript:alert(1)'); insert into _try values ('E14 non-http apply_url rejected', false);
  exception when check_violation then insert into _try values ('E14 non-http apply_url rejected', true); end;
  begin insert into public.external_jobs(source_label,raw_text,raw_hash,title,apply_url,status) values ('xx','Raw post text that is long enough to pass.',repeat('4',64),'Born published','https://x.example','published'); insert into _try values ('E15 insert directly as published rejected', false);
  exception when others then insert into _try values ('E15 insert directly as published rejected', true); end;
  begin insert into public.job_sources(kind,name,handle) values ('telegram_channel','No basis','nobasis_chan'); insert into _try values ('E16 non-manual source without basis rejected', false);
  exception when check_violation then insert into _try values ('E16 non-manual source without basis rejected', true); end;
  begin insert into public.job_sources(kind,name,url,basis) values ('rss_feed','Plain http feed','http://example.com/feed','public feed'); insert into _try values ('E17 non-https source url rejected', false);
  exception when check_violation then insert into _try values ('E17 non-https source url rejected', true); end;
end $$;
insert into public.test_results9 select name, ok from _try;
reset role; set request.jwt.sub = '';

-- system (service role / importer) context: may insert pending rows, may not publish
create temp table _sys(name text, ok boolean);
do $$ begin
  begin insert into public.external_jobs(source_label,raw_text,raw_hash,title,apply_url) values ('importer','Raw post text that is long enough to pass.',repeat('5',64),'Imported job','https://x.example'); insert into _sys values ('E20 importer can insert pending_review', true);
  exception when others then insert into _sys values ('E20 importer can insert pending_review', false); end;
  begin insert into public.external_jobs(source_label,raw_text,raw_hash,title,apply_url,status) values ('importer','Raw post text that is long enough to pass.',repeat('6',64),'Imported as published','https://x.example','published'); insert into _sys values ('E21 importer cannot insert as published', false);
  exception when others then insert into _sys values ('E21 importer cannot insert as published', true); end;
  begin update public.external_jobs set status='published' where title='Imported job'; insert into _sys values ('E22 importer cannot publish', false);
  exception when others then insert into _sys values ('E22 importer cannot publish', true); end;
end $$;
insert into public.test_results9 select name, ok from _sys;

-- reject path: rejected stays out of view; deleting a source keeps the job
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-0000000000c1';
update public.external_jobs set status='rejected' where id='e0000000-0000-0000-0000-000000000001';
reset role; set request.jwt.sub = '';
set role anon;
insert into public.test_results9 select 'E18 rejected job disappears from public view', count(*)=0 from public.external_job_listings;
reset role;
delete from public.job_sources;
insert into public.test_results9 select 'E19 deleting a source keeps jobs (source_id null)', count(*)=4 and bool_and(source_id is null) from public.external_jobs;

select test, case when ok then 'PASS' else 'FAIL' end as result from public.test_results9 order by test;
select count(*) filter (where ok) as passed, count(*) filter (where not ok) as failed from public.test_results9;
