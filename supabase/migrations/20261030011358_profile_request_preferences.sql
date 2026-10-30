-- Issue #44: atomically save profile identity, sharing and request preference.
-- The old RPC remains compatible and preserves the previous allow_requests value.
begin;
create or replace function public.lume_save_profile_settings(
 p_username text,p_display_name text,p_bio text,p_photo text,p_audience text,
 p_share_photo boolean,p_share_bio boolean,p_share_weekly boolean,p_share_monthly boolean,p_share_workouts boolean,
 p_allow_requests boolean
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare result public.lume_profiles;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501';end if;
 if p_allow_requests is null then raise exception 'Request preference required' using errcode='23514';end if;
 perform public.lume_save_profile(p_username,p_display_name,p_bio,p_photo,p_audience,p_share_photo,p_share_bio,p_share_weekly,p_share_monthly,p_share_workouts);
 update public.lume_profiles set allow_requests=p_allow_requests,updated_at=now() where user_id=auth.uid() returning * into result;
 if not found then raise exception 'Profile unavailable' using errcode='42501';end if;
 return to_jsonb(result);
end;$$;
revoke all on function public.lume_save_profile_settings(text,text,text,text,text,boolean,boolean,boolean,boolean,boolean,boolean) from public,anon;
grant execute on function public.lume_save_profile_settings(text,text,text,text,text,boolean,boolean,boolean,boolean,boolean,boolean) to authenticated;
commit;
