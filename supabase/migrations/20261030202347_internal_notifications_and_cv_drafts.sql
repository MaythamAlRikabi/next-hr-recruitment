-- Private in-platform inbox and drafts. No email or third-party AI dependency.
create table public.notifications (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 title_ar text not null, title_en text not null,
 href text not null check (href ~ '^/[a-z]' and href !~ '[[:space:]]'),
 event_key text not null, read_at timestamptz, created_at timestamptz not null default now(),
 unique(user_id,event_key)
);
create index notifications_user_created on public.notifications(user_id,created_at desc);
alter table public.notifications enable row level security;
revoke all on public.notifications from anon,authenticated;
grant select on public.notifications to authenticated;
grant update(read_at) on public.notifications to authenticated;
create policy notifications_read on public.notifications for select to authenticated using(user_id=(select auth.uid()));
create policy notifications_mark on public.notifications for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

create table public.cv_drafts (
 user_id uuid primary key references auth.users(id) on delete cascade,
 document jsonb not null check(jsonb_typeof(document)='object' and octet_length(document::text)<=100000),
 updated_at timestamptz not null default now()
);
alter table public.cv_drafts enable row level security;
revoke all on public.cv_drafts from anon,authenticated;
grant select,insert,update,delete on public.cv_drafts to authenticated;
create policy cv_drafts_owner on public.cv_drafts for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

create function private.notify_application() returns trigger language plpgsql security definer set search_path='' as $$
declare _company uuid; _method text;
begin
 if tg_op='UPDATE' and new.status is not distinct from old.status then return new; end if;
 insert into public.notifications(user_id,title_ar,title_en,href,event_key)
 values(new.candidate_id, case when tg_op='INSERT' then 'تم استلام طلب التوظيف' else 'تم تحديث حالة طلب التوظيف' end,
 case when tg_op='INSERT' then 'Application received' else 'Application status updated' end,
 '/candidate','application:'||new.id||':'||new.status) on conflict do nothing;
 if tg_op='INSERT' then
   select company_id,recruitment_method::text into _company,_method from public.jobs where id=new.job_id;
   if _method='direct' then
     insert into public.notifications(user_id,title_ar,title_en,href,event_key)
     select user_id,'وصل طلب توظيف جديد','New application received','/employer/jobs/'||new.job_id,'new-application:'||new.id
     from public.company_members where company_id=_company and role::text in ('owner','hr_manager','recruiter','hiring_manager') on conflict do nothing;
   else
     insert into public.notifications(user_id,title_ar,title_en,href,event_key)
     select user_id,'وصل طلب توظيف مُدار','New managed application','/agency/jobs','new-application:'||new.id
     from public.user_roles where role::text in ('next_recruiter','next_admin','super_admin') on conflict do nothing;
   end if;
 end if;
 return new;
end $$;
revoke all on function private.notify_application() from public,anon,authenticated;
create trigger notifications_application after insert or update of status on public.applications for each row execute function private.notify_application();

create function private.deliver_job_alerts() returns integer language plpgsql security definer set search_path='' as $$
declare a record; _count integer:=0; _n integer;
begin
 -- Lock due preferences so overlapping executions cannot duplicate delivery.
 for a in select * from public.job_alerts where active and (last_sent_at is null or last_sent_at < now()-case when frequency::text='daily' then interval '1 day' else interval '7 days' end) for update skip locked loop
  insert into public.notifications(user_id,title_ar,title_en,href,event_key)
  select a.user_id,'فرصة جديدة: '||j.title,'New opportunity: '||j.title,'/jobs/'||j.id,'job-alert:'||j.id
  from public.job_listings j where j.published_at>=coalesce(a.last_sent_at,a.created_at)
    and (a.keyword is null or strpos(lower(j.title||' '||j.description),lower(a.keyword))>0)
    and (a.city is null or j.city=a.city) and (a.industry is null or j.industry=a.industry)
  on conflict do nothing;
  get diagnostics _n=row_count; _count:=_count+_n;
  update public.job_alerts set last_sent_at=now() where id=a.id;
 end loop;
 return _count;
end $$;
revoke all on function private.deliver_job_alerts() from public,anon,authenticated;
select cron.schedule('next-internal-job-alerts','15 * * * *','select private.deliver_job_alerts();');
