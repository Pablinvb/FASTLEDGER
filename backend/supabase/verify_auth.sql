-- Diagnostic queries for Supabase Auth after applying 001_trade_os.sql.

select tgname, tgenabled, tgfoid::regprocedure
from pg_trigger
where tgrelid = 'auth.users'::regclass
  and not tgisinternal;

select id, email, created_at
from auth.users
order by created_at desc
limit 10;

select id, email, full_name, created_at
from public.profiles
order by created_at desc
limit 10;
