-- Telegram sources supplied by the owner on 2026-10-31. NOT applied to the real database (needs the owner's approval).
-- Run after migration 0012. Each channel was opened in the owner's Chrome: https://t.me/s/<handle> shows its public preview.
-- iraqimedicalrep is NOT listed: its owner disabled the public preview (t.me/s/ redirects to "View in Telegram"), so it cannot be
-- read automatically. Its posts can still be added with the paste form (/agency/external-jobs).
insert into public.job_sources (kind, name, handle, basis, created_by)
select 'telegram_channel', v.name, v.handle,
       'Public Telegram preview supplied by the NEXT owner on 2026-10-31. Channel-owner permission not confirmed: the ad links back to the original post and is reviewed by NEXT staff before it is shown.',
       (select user_id from public.user_roles where role = 'super_admin' order by created_at limit 1)
from (values
  ('All Iraq Jobs',                  'alliraqjobs'),
  ('Medical field & اعلانات طبية',    'medicalad12'),
  ('وظائف في العراق (iraqjobs1995)',  'iraqjobs1995'),
  ('Medical Field',                  'Medical_Field'),
  ('اعلانات المندوبين والمجموعة الطبية', 'repiraq'),
  ('اعلانات الفيلد الدوائي',          'pharmacy906')
) as v(name, handle)
where not exists (select 1 from public.job_sources s where s.handle = v.handle);
