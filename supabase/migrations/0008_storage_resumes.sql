-- 0008 — private CV bucket and Storage policies (DRAFT: not applied anywhere).
-- Depends on 0007 (public.resumes, public.candidate_profiles, private.has_active_pool_consent).
--
-- Rules:
--   * bucket is PRIVATE; only PDF / DOCX, max 5 MB (same limits as public.resumes).
--   * a candidate owns the folder "<auth.uid()>/…" and may add, read and delete only there.
--   * NEXT staff may read a file only if public.resumes (through its own RLS) lets them see the row,
--     i.e. visibility = 'searchable' AND an active talent-pool consent exists. Withdrawal removes access at once.
--   * Client companies have NO policy on this bucket: they never read CV files.
--   * No UPDATE policy: a file is replaced by uploading a new one and deleting the old one.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resumes', 'resumes', false, 5242880,
  array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy resumes_obj_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

create policy resumes_obj_select_own on storage.objects
  for select to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

create policy resumes_obj_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

-- The subquery runs under the caller's RLS on public.resumes (resumes_own_all / resumes_staff_read),
-- so staff access follows exactly the same visibility + consent rules as the metadata row.
create policy resumes_obj_select_staff on storage.objects
  for select to authenticated
  using (
    bucket_id = 'resumes'
    and private.is_next_staff()
    and exists (select 1 from public.resumes r where r.storage_path = storage.objects.name)
  );
