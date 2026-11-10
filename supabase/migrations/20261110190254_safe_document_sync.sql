-- Issue #53. Protect a document once a current client saves it through the CAS RPC.
begin;
alter table public.user_data add column if not exists protected_sync boolean not null default false;
alter table public.user_data add column if not exists last_write_id uuid;
create or replace function lume_private.document_stamp() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if TG_OP='UPDATE' then
  new.updated_at=greatest(clock_timestamp(),old.updated_at+interval '1 microsecond');
  new.protected_sync=old.protected_sync or new.protected_sync;
 else new.updated_at=clock_timestamp();end if;
 return new;
end;$$;
revoke all on function lume_private.document_stamp() from public,anon,authenticated;
drop trigger if exists lume_document_stamp on public.user_data;
create trigger lume_document_stamp before insert or update on public.user_data for each row execute function lume_private.document_stamp();
drop policy if exists "Lume user insert" on public.user_data;
drop policy if exists "Lume user update" on public.user_data;
create policy "Lume user insert" on public.user_data for insert to authenticated
with check ((select auth.uid())=user_id and not protected_sync and last_write_id is null);
create policy "Lume user update" on public.user_data for update to authenticated
using ((select auth.uid())=user_id and not protected_sync)
with check ((select auth.uid())=user_id and not protected_sync and last_write_id is null);
-- Protected documents may not be deleted/recreated by a stale client.
drop policy if exists "Lume user delete" on public.user_data;
create policy "Lume user delete" on public.user_data for delete to authenticated
using ((select auth.uid())=user_id and not protected_sync);

create or replace function lume_private.sync_document(p_expected timestamptz,p_data jsonb,p_mutation uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare owner_id uuid=auth.uid(); row_data public.user_data; stamp timestamptz;
begin
 if owner_id is null or not exists(select 1 from auth.users where id=owner_id) then raise exception 'AUTH_REQUIRED' using errcode='42501';end if;
 if p_mutation is null or jsonb_typeof(p_data) is distinct from 'object'
  or jsonb_typeof(p_data->'profile') is distinct from 'object'
  or jsonb_typeof(p_data->'routines') is distinct from 'array'
  or jsonb_typeof(p_data->'sessions') is distinct from 'array' then raise exception 'INVALID_DOCUMENT' using errcode='23514';end if;
 perform pg_advisory_xact_lock(hashtextextended('lume-document:'||owner_id::text,0));
 select * into row_data from public.user_data where user_id=owner_id for update;
 if found then
  if row_data.last_write_id=p_mutation then
   if row_data.data<>p_data then raise exception 'MUTATION_REUSED' using errcode='23514';end if;
   return jsonb_build_object('updated_at',row_data.updated_at,'replayed',true);
  end if;
  if p_expected is distinct from row_data.updated_at then return jsonb_build_object('conflict',true);end if;
  update public.user_data set data=p_data,protected_sync=true,last_write_id=p_mutation where user_id=owner_id returning updated_at into stamp;
 else
  if p_expected is not null then return jsonb_build_object('conflict',true);end if;
  insert into public.user_data(user_id,data,protected_sync,last_write_id) values(owner_id,p_data,true,p_mutation) returning updated_at into stamp;
 end if;
 return jsonb_build_object('updated_at',stamp,'replayed',false);
end;$$;
create or replace function public.lume_sync_document(p_expected timestamptz,p_data jsonb,p_mutation uuid)
returns jsonb language sql security invoker set search_path='' as $$select lume_private.sync_document(p_expected,p_data,p_mutation);$$;
revoke all on function lume_private.sync_document(timestamptz,jsonb,uuid),public.lume_sync_document(timestamptz,jsonb,uuid) from public,anon;
grant execute on function lume_private.sync_document(timestamptz,jsonb,uuid),public.lume_sync_document(timestamptz,jsonb,uuid) to authenticated;
commit;
