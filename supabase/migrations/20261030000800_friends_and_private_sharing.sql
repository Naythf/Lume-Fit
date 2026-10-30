-- Issue #38. Additive social graph; no existing account is published or opted in.
begin;
alter table public.lume_profiles drop constraint if exists lume_profiles_audience_check;
alter table public.lume_profiles add constraint lume_profiles_audience_check check(audience in ('private','friends','members'));
alter table public.lume_profiles add column if not exists allow_requests boolean not null default false;
create table if not exists lume_private.friendships(
 low_id uuid not null references auth.users(id) on delete cascade,
 high_id uuid not null references auth.users(id) on delete cascade,
 requester uuid not null references auth.users(id) on delete cascade,
 status text not null check(status in ('pending','accepted','inactive')),
 updated_at timestamptz not null default now(),
 primary key(low_id,high_id),check(low_id<high_id),check(requester in(low_id,high_id))
);
create index if not exists friendships_high on lume_private.friendships(high_id,status);
create index if not exists friendships_requester on lume_private.friendships(requester);
create table if not exists lume_private.blocks(
 owner_id uuid not null references auth.users(id) on delete cascade,
 target_id uuid not null references auth.users(id) on delete cascade,
 primary key(owner_id,target_id),check(owner_id<>target_id)
);
create index if not exists blocks_target on lume_private.blocks(target_id);
create table if not exists lume_private.request_limits(
 owner_id uuid primary key references auth.users(id) on delete cascade,
 window_start timestamptz not null default now(), attempts integer not null default 0
);
alter table lume_private.friendships enable row level security;
alter table lume_private.blocks enable row level security;
alter table lume_private.request_limits enable row level security;
revoke all on lume_private.friendships,lume_private.blocks,lume_private.request_limits from public,anon,authenticated;
-- Internal tables have no client grants or policies. All graph transitions are validated here.
create or replace function lume_private.friends_api(action text,handle text) returns jsonb language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid(); target public.lume_profiles; lo uuid; hi uuid; edge lume_private.friendships; result jsonb; amount integer;
begin
 if me is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
 if not exists(select 1 from public.lume_profiles where user_id=me) then raise exception 'PROFILE_REQUIRED'; end if;
 if action='state' then
  select jsonb_build_object('allowRequests',p.allow_requests,
   'people',coalesce((select jsonb_agg(x.item order by x.updated_at desc) from (
    select f.updated_at,jsonb_build_object('username',q.username,'displayName',q.display_name,'relationship',case when f.status='accepted' then 'friend' when f.requester=me then 'outgoing' else 'incoming' end) item
    from lume_private.friendships f join public.lume_profiles q on q.user_id=case when f.low_id=me then f.high_id else f.low_id end
    where (f.low_id=me or f.high_id=me) and f.status in('pending','accepted') and not exists(select 1 from lume_private.blocks b where (b.owner_id=me and b.target_id=q.user_id) or (b.owner_id=q.user_id and b.target_id=me))
   ) x),'[]'::jsonb),
   'blocked',coalesce((select jsonb_agg(jsonb_build_object('username',q.username,'displayName',q.display_name,'relationship','blocked') order by q.username) from lume_private.blocks b join public.lume_profiles q on q.user_id=b.target_id where b.owner_id=me),'[]'::jsonb)) into result
  from public.lume_profiles p where p.user_id=me;
  return result;
 end if;
 if action='requests_on' or action='requests_off' then
  update public.lume_profiles set allow_requests=(action='requests_on') where user_id=me;
  if action='requests_off' then
   -- Serialize with every incoming pair. Settings themselves don't disclose data.
   -- Pending invitations remain available to accept or decline; new ones are denied.
   null;
  end if;
  return jsonb_build_object('ok',true);
 end if;
 if handle is null or lower(trim(handle)) !~ '^[a-z0-9_]{3,24}$' then raise exception 'UNAVAILABLE'; end if;
 select * into target from public.lume_profiles where username=lower(trim(handle));
 if not found or target.user_id=me then
  if action='search' then return null; end if;
  raise exception 'UNAVAILABLE';
 end if;
 lo=least(me,target.user_id);hi=greatest(me,target.user_id);
 if action<>'search' then perform pg_advisory_xact_lock(hashtextextended(lo::text||hi::text,0));end if;
 select * into edge from lume_private.friendships where low_id=lo and high_id=hi;
 if action='unblock' then
  delete from lume_private.blocks where owner_id=me and target_id=target.user_id;
  return jsonb_build_object('ok',true);
 end if;
 if action='block' then
  insert into lume_private.blocks values(me,target.user_id) on conflict do nothing;
  update lume_private.friendships set status='inactive',updated_at=now() where low_id=lo and high_id=hi;
  return jsonb_build_object('ok',true);
 end if;
 if exists(select 1 from lume_private.blocks where (owner_id=me and target_id=target.user_id) or(owner_id=target.user_id and target_id=me)) then
  if action='search' then return null; end if;
  raise exception 'UNAVAILABLE';
 end if;
 if action='search' then
  if target.audience='private' and not target.allow_requests and coalesce(edge.status,'inactive')='inactive' then return null;end if;
  if target.audience='friends' and not target.allow_requests and coalesce(edge.status,'inactive')='inactive' then return null;end if;
  return jsonb_build_object('username',target.username,'displayName',target.display_name,'relationship',case when edge.status='accepted' then 'friend' when edge.status='pending' and edge.requester=me then 'outgoing' when edge.status='pending' then 'incoming' else 'none' end,'canRequest',target.allow_requests);
 end if;
 if action='request' then
  -- Shared profile lock orders opt-out against new requests.
  select * into target from public.lume_profiles where user_id=target.user_id for share;
  if not target.allow_requests then raise exception 'UNAVAILABLE';end if;
  if edge.status in('pending','accepted') then raise exception 'ALREADY_CONNECTED';end if;
  if edge.status='inactive' and edge.updated_at>now()-interval '24 hours' then raise exception 'COOLDOWN';end if;
  if (select count(*) from lume_private.friendships where (low_id=me or high_id=me) and status in('pending','accepted'))>=200 or (select count(*) from lume_private.friendships where (low_id=target.user_id or high_id=target.user_id) and status in('pending','accepted'))>=200 then raise exception 'NETWORK_LIMIT';end if;
  insert into lume_private.request_limits(owner_id,window_start,attempts) values(me,now(),1)
  on conflict(owner_id) do update set attempts=case when lume_private.request_limits.window_start<now()-interval '1 hour' then 1 else lume_private.request_limits.attempts+1 end,window_start=case when lume_private.request_limits.window_start<now()-interval '1 hour' then now() else lume_private.request_limits.window_start end returning attempts into amount;
  if amount>20 then raise exception 'RATE_LIMIT';end if;
  insert into lume_private.friendships values(lo,hi,me,'pending',now()) on conflict(low_id,high_id) do update set requester=me,status='pending',updated_at=now();
 elsif action='accept' then
  if edge.status is distinct from 'pending' or edge.requester=me then raise exception 'INVALID_TRANSITION';end if;
  update lume_private.friendships set status='accepted',updated_at=now() where low_id=lo and high_id=hi;
 elsif action='decline' then
  if edge.status is distinct from 'pending' or edge.requester=me then raise exception 'INVALID_TRANSITION';end if;
  update lume_private.friendships set status='inactive',updated_at=now() where low_id=lo and high_id=hi;
 elsif action='cancel' then
  if edge.status is distinct from 'pending' or edge.requester<>me then raise exception 'INVALID_TRANSITION';end if;
  update lume_private.friendships set status='inactive',updated_at=now() where low_id=lo and high_id=hi;
 elsif action='remove' then
  if edge.status is distinct from 'accepted' then raise exception 'INVALID_TRANSITION';end if;
  update lume_private.friendships set status='inactive',updated_at=now() where low_id=lo and high_id=hi;
 else raise exception 'INVALID_ACTION';
 end if;
 return jsonb_build_object('ok',true);
end;$$;
create or replace function public.lume_friends(p_action text,p_username text default '') returns jsonb language sql security invoker set search_path='' as $$select lume_private.friends_api(p_action,p_username);$$;
revoke all on function lume_private.friends_api(text,text),public.lume_friends(text,text) from public,anon;
grant execute on function lume_private.friends_api(text,text),public.lume_friends(text,text) to authenticated;
create or replace function lume_private.profile_projection(handle text) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare p public.lume_profiles; payload jsonb; result jsonb; weekly integer; monthly integer; workouts jsonb;
begin
 if auth.uid() is null then return null; end if;
 select * into p from public.lume_profiles where username=lower(trim(handle));
 if not found or p.audience='private' then return null; end if;
 if exists(select 1 from lume_private.blocks where (owner_id=auth.uid() and target_id=p.user_id) or(owner_id=p.user_id and target_id=auth.uid())) then return null;end if;
 if p.audience='friends' and not exists(select 1 from lume_private.friendships where low_id=least(auth.uid(),p.user_id) and high_id=greatest(auth.uid(),p.user_id) and status='accepted') then return null;end if;
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

commit;
