-- ROLLBACK for 0008. Export the files first: deleting the bucket rows does not delete stored blobs through SQL,
-- remove objects with the Storage API/dashboard before dropping the bucket.
begin;
drop policy if exists resumes_obj_select_staff on storage.objects;
drop policy if exists resumes_obj_delete_own on storage.objects;
drop policy if exists resumes_obj_select_own on storage.objects;
drop policy if exists resumes_obj_insert_own on storage.objects;
delete from storage.buckets where id = 'resumes';
commit;
