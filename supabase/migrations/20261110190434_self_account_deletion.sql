-- Issue #54. The caller can delete only its own account after a recent password login.
begin;
create or replace function lume_private.delete_own_account(p_confirmation text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare owner_id uuid=auth.uid();claims jsonb=auth.jwt();fresh_password boolean=false;session_uuid uuid;
begin
 if owner_id is null then raise exception 'AUTH_REQUIRED' using errcode='42501';end if;
 if p_confirmation is distinct from 'EXCLUIR' then raise exception 'CONFIRMATION_REQUIRED' using errcode='23514';end if;
 if coalesce(claims->>'session_id','') !~ '^[a-fA-F0-9-]{36}$' then raise exception 'REAUTH_REQUIRED' using errcode='42501';end if;
 session_uuid=(claims->>'session_id')::uuid;
 if not exists(select 1 from auth.sessions where id=session_uuid and user_id=owner_id and created_at>=now()-interval '5 minutes') then raise exception 'REAUTH_REQUIRED' using errcode='42501';end if;
 select exists(select 1 from jsonb_array_elements(case when jsonb_typeof(claims->'amr')='array' then claims->'amr' else '[]'::jsonb end) item
 where item->>'method'='password' and case when item->>'timestamp' ~ '^\d{1,12}$' then (item->>'timestamp')::numeric between extract(epoch from now())-300 and extract(epoch from now())+30 else false end) into fresh_password;
 if not fresh_password then raise exception 'REAUTH_REQUIRED' using errcode='42501';end if;
 if exists(select 1 from auth.mfa_factors where user_id=owner_id and status='verified') and coalesce(claims->>'aal','aal1')<>'aal2' then raise exception 'MFA_REQUIRED' using errcode='42501';end if;
 -- Use the same owner lock as synchronization; account deletion and writes are serialized.
 perform pg_advisory_xact_lock(hashtextextended('lume-document:'||owner_id::text,0));
 delete from auth.sessions where user_id=owner_id;
 delete from auth.users where id=owner_id;
 if not found then raise exception 'AUTH_REQUIRED' using errcode='42501';end if;
 return jsonb_build_object('deleted',true);
end;$$;
create or replace function public.lume_delete_own_account(p_confirmation text) returns jsonb
language sql security invoker set search_path='' as $$select lume_private.delete_own_account(p_confirmation);$$;
revoke all on function lume_private.delete_own_account(text),public.lume_delete_own_account(text) from public,anon;
grant execute on function lume_private.delete_own_account(text),public.lume_delete_own_account(text) to authenticated;
commit;
