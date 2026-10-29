-- Additive profile foundation. Run after supabase-schema.sql in the SQL Editor.
-- Does not change user_data or publish any existing account.
begin;
create schema if not exists lume_private;
revoke all on schema lume_private from public, anon;
grant usage on schema lume_private to authenticated;
create table if not exists public.lume_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 username text not null unique check (username ~ '^[a-z0-9_]{3,24}$'),
 display_name text not null check (char_length(display_name) between 1 and 60),
 bio text not null default '' check (char_length(bio)<=160),
 photo text not null default '' check (photo='' or (length(photo)<=250000 and photo ~ '^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$')),
 audience text not null default 'private' check (audience in ('private','members')),
 share_photo boolean not null default false,
 share_bio boolean not null default false,
 share_weekly boolean not null default false,
 share_monthly boolean not null default false,
 share_workouts boolean not null default false,
 updated_at timestamptz not null default now()
);
alter table public.lume_profiles enable row level security;
revoke all on public.lume_profiles from public, anon, authenticated;
grant select, insert, update on public.lume_profiles to authenticated;
drop policy if exists "Lume profile owner read" on public.lume_profiles;
create policy "Lume profile owner read" on public.lume_profiles for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists "Lume profile owner insert" on public.lume_profiles;
create policy "Lume profile owner insert" on public.lume_profiles for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists "Lume profile owner update" on public.lume_profiles;
create policy "Lume profile owner update" on public.lume_profiles for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

create or replace function public.lume_my_profile() returns jsonb language sql stable security invoker set search_path='' as $$
 select to_jsonb(p) from public.lume_profiles p where p.user_id=auth.uid();
$$;
create or replace function public.lume_save_profile(p_username text,p_display_name text,p_bio text,p_photo text,p_audience text,p_share_photo boolean,p_share_bio boolean,p_share_weekly boolean,p_share_monthly boolean,p_share_workouts boolean)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare result public.lume_profiles;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
 insert into public.lume_profiles(user_id,username,display_name,bio,photo,audience,share_photo,share_bio,share_weekly,share_monthly,share_workouts)
 values(auth.uid(),lower(trim(p_username)),trim(p_display_name),p_bio,p_photo,p_audience,p_share_photo,p_share_bio,p_share_weekly,p_share_monthly,p_share_workouts)
 on conflict(user_id) do update set username=excluded.username,display_name=excluded.display_name,bio=excluded.bio,photo=excluded.photo,audience=excluded.audience,share_photo=excluded.share_photo,share_bio=excluded.share_bio,share_weekly=excluded.share_weekly,share_monthly=excluded.share_monthly,share_workouts=excluded.share_workouts,updated_at=now()
 returning * into result;
 return to_jsonb(result);
end;$$;

create or replace function lume_private.session_time(value text) returns timestamptz language plpgsql stable security invoker set search_path='' as $$
begin
 if value is null or value !~ '^\d{4}-\d{2}-\d{2}T' then return null; end if;
 return value::timestamptz;
exception when others then return null;
end;$$;
-- The only privileged read derives a narrow, opt-in projection; raw history never leaves it.
create or replace function lume_private.profile_projection(handle text) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare p public.lume_profiles; payload jsonb; result jsonb; weekly integer; monthly integer; workouts jsonb;
begin
 if auth.uid() is null then return null; end if;
 select * into p from public.lume_profiles where username=lower(trim(handle)) and audience='members';
 if not found then return null; end if;
 result=jsonb_build_object('username',p.username,'displayName',p.display_name);
 if p.share_bio then result=result||jsonb_build_object('bio',p.bio); end if;
 if p.share_photo then result=result||jsonb_build_object('photo',p.photo); end if;
 if p.share_weekly or p.share_monthly or p.share_workouts then
  select data->'sessions' into payload from public.user_data where user_id=p.user_id;
  if jsonb_typeof(payload) is distinct from 'array' then payload='[]'::jsonb; end if;
  with valid as (
   select left(coalesce(s->>'name','Treino'),100) as name,lume_private.session_time(s->>'date') as at_time from jsonb_array_elements(payload) s
  ), past as (
   select *, (at_time at time zone 'America/Sao_Paulo')::date as day from valid where at_time is not null and at_time<=now()
  ) select
   count(distinct day) filter(where day>=date_trunc('week',now() at time zone 'America/Sao_Paulo')::date),
   count(distinct day) filter(where day>=date_trunc('month',now() at time zone 'America/Sao_Paulo')::date),
   (select coalesce(jsonb_agg(jsonb_build_object('name',q.name,'date',q.at_time) order by q.at_time desc),'[]'::jsonb) from (select name,at_time from past order by at_time desc limit 10) q)
  into weekly,monthly,workouts from past;
  if p.share_weekly then result=result||jsonb_build_object('weeklyDays',weekly); end if;
  if p.share_monthly then result=result||jsonb_build_object('monthlyDays',monthly); end if;
  if p.share_workouts then result=result||jsonb_build_object('workouts',workouts); end if;
 end if;
 return result;
end;$$;
create or replace function public.lume_get_profile(p_username text) returns jsonb language sql stable security invoker set search_path='' as $$
 select lume_private.profile_projection(p_username);
$$;
revoke all on function public.lume_my_profile() from public,anon;
revoke all on function public.lume_save_profile(text,text,text,text,text,boolean,boolean,boolean,boolean,boolean) from public,anon;
revoke all on function public.lume_get_profile(text) from public,anon;
revoke all on function lume_private.session_time(text) from public,anon,authenticated;
revoke all on function lume_private.profile_projection(text) from public,anon;
grant execute on function public.lume_my_profile(),public.lume_get_profile(text),lume_private.profile_projection(text) to authenticated;
grant execute on function public.lume_save_profile(text,text,text,text,text,boolean,boolean,boolean,boolean,boolean) to authenticated;
commit;
