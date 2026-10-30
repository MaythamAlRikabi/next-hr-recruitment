# Admin guide
The first Super Admin is created only by a controlled SQL step run by the owner after the person registers normally:
`insert into public.user_roles(user_id, role) select id, 'super_admin' from auth.users where email = '<verified email>';`
(run in the Supabase SQL editor; never exposed in the app). `/admin` shows live counts; `/agency` lists inquiries. User management, company verification UI, settings and audit-log views are not built yet.
