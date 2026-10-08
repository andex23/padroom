-- All mutations use narrowly scoped RPCs. No service-role credentials in the app.
create table public.profiles (
 id uuid primary key references auth.users on delete cascade,
 display_name text not null check (char_length(display_name) between 2 and 60),
 city text not null check (city in ('Lagos','Abuja','Ibadan','Port Harcourt','Benin City','Enugu','Kano','Kaduna','Abeokuta','Ilorin','Jos','Uyo','Owerri','Warri','Calabar')),
 suspended_at timestamptz,
 created_at timestamptz not null default now()
);
create table public.admin_members (user_id uuid primary key references auth.users on delete cascade);
create table public.listings (
 id uuid primary key default gen_random_uuid(), seller_id uuid not null references public.profiles,
 title text not null check (char_length(title) between 5 and 120), brand text not null default '' check (char_length(brand)<=60), model text not null default '' check (char_length(model)<=80),
 category text not null check (category in ('Consoles','Controllers','Games','Accessories')),
 condition text not null check (condition in ('New','Used','Open-box','For-parts')),
 city text not null check (city in ('Lagos','Abuja','Ibadan','Port Harcourt','Benin City','Enugu','Kano','Kaduna','Abeokuta','Ilorin','Jos','Uyo','Owerri','Warri','Calabar')),
 price_kobo bigint not null check (price_kobo between 100 and 5000000000), currency text not null default 'NGN' check (currency='NGN'),
 description text not null check (char_length(description) between 20 and 5000), defects text not null check (char_length(defects) between 2 and 1000), included_items text not null check (char_length(included_items) between 2 and 1000),
 status text not null default 'draft' check (status in ('draft','pending_review','active','rejected','sold','archived')),
 review_reason text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), published_at timestamptz,
 search_document tsvector generated always as (to_tsvector('english',title || ' ' || brand || ' ' || model || ' ' || description)) stored
);
create index listings_browse on public.listings(status,created_at desc,id);
create index listings_filters on public.listings(category,city,condition,price_kobo);
create index listings_search on public.listings using gin(search_document);
create index listings_owner on public.listings(seller_id);
create table public.listing_images (
 id uuid primary key default gen_random_uuid(), listing_id uuid not null references public.listings on delete cascade,
 storage_path text not null unique, position integer not null check(position between 0 and 7), unique(listing_id,position)
);
create table public.saved_listings (user_id uuid not null references public.profiles on delete cascade, listing_id uuid not null references public.listings on delete cascade,created_at timestamptz not null default now(),primary key(user_id,listing_id));
create table public.conversations (id uuid primary key default gen_random_uuid(),listing_id uuid not null references public.listings,buyer_id uuid not null references public.profiles,seller_id uuid not null references public.profiles,created_at timestamptz not null default now(),check(buyer_id<>seller_id),unique(listing_id,buyer_id));
create index conversations_seller on public.conversations(seller_id);
create index conversations_buyer on public.conversations(buyer_id);
create table public.messages (id uuid primary key default gen_random_uuid(),conversation_id uuid not null references public.conversations,sender_id uuid not null references public.profiles,body text not null check(char_length(body) between 1 and 2000),created_at timestamptz not null default now(),read_at timestamptz);
create index messages_conversation on public.messages(conversation_id,created_at,id);
create table public.offers (id uuid primary key default gen_random_uuid(),listing_id uuid not null references public.listings,buyer_id uuid not null references public.profiles,seller_id uuid not null references public.profiles,kind text not null check(kind in ('purchase','trade')),offered_listing_id uuid references public.listings,note text not null default '' check(char_length(note)<=2000),status text not null default 'pending' check(status in ('pending','accepted','declined','cancelled','completed')),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),check(buyer_id<>seller_id),check((kind='purchase' and offered_listing_id is null) or (kind='trade' and offered_listing_id is not null and offered_listing_id<>listing_id)));
create unique index offers_duplicate on public.offers(listing_id,buyer_id) where status in ('pending','accepted');
create unique index offers_one_accepted on public.offers(listing_id) where status='accepted';
create index offers_buyer on public.offers(buyer_id);
create index offers_seller on public.offers(seller_id);
create table public.reports (id uuid primary key default gen_random_uuid(),reporter_id uuid not null references public.profiles,listing_id uuid not null references public.listings,reason text not null check(reason in ('Fraud','Prohibited item','Misleading description','Other')),description text not null check(char_length(description) between 10 and 2000),status text not null default 'open' check(status in ('open','resolved')),created_at timestamptz not null default now());
create table public.moderation_events (id uuid primary key default gen_random_uuid(),admin_id uuid not null references auth.users,entity_id uuid not null,action text not null,notes text not null default '',created_at timestamptz not null default now());
create table public.rate_limits (user_id uuid not null references auth.users on delete cascade,action text not null,window_start timestamptz not null,hits int not null,primary key(user_id,action));

create function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.admin_members a join public.profiles p on p.id=a.user_id where a.user_id=auth.uid() and p.suspended_at is null)$$;
create function public.active_user() returns uuid language plpgsql stable security definer set search_path='' as $$begin
 if auth.uid() is null or not exists(select 1 from public.profiles where id=auth.uid() and suspended_at is null) then raise exception 'Sign in with an active account first'; end if;
 return auth.uid(); end$$;
create function public.enforce_rate(p_action text,p_limit int) returns void language plpgsql security definer set search_path='' as $$declare n int; u uuid:=public.active_user(); begin
 insert into public.rate_limits values(u,p_action,date_trunc('hour',now()),1) on conflict(user_id,action) do update set window_start=excluded.window_start,hits=case when rate_limits.window_start=excluded.window_start then rate_limits.hits+1 else 1 end returning hits into n;
 if n>p_limit then raise exception 'Too many requests. Try again in an hour.'; end if;
 end$$;
create function public.public_listing(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.listings l join public.profiles p on p.id=l.seller_id where l.id=p_id and l.status='active' and p.suspended_at is null)$$;

alter table public.profiles enable row level security;
alter table public.admin_members enable row level security;
alter table public.listings enable row level security;
alter table public.listing_images enable row level security;
alter table public.saved_listings enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.offers enable row level security;
alter table public.reports enable row level security;
alter table public.moderation_events enable row level security;
alter table public.rate_limits enable row level security;
create policy profiles_self on public.profiles for select using(id=auth.uid() or public.is_admin());
create policy listings_read on public.listings for select using(public.public_listing(id) or seller_id=auth.uid() or public.is_admin());
create policy images_read on public.listing_images for select using(exists(select 1 from public.listings l where l.id=listing_id));
create policy saved_self on public.saved_listings for select using(user_id=auth.uid());
create policy conversations_participants on public.conversations for select using(auth.uid() in (buyer_id,seller_id));
create policy messages_participants on public.messages for select using(exists(select 1 from public.conversations c where c.id=conversation_id));
create policy offers_participants on public.offers for select using(auth.uid() in (buyer_id,seller_id));
create policy reports_read on public.reports for select using(reporter_id=auth.uid() or public.is_admin());
create policy events_admin on public.moderation_events for select using(public.is_admin());
-- Explicitly deny direct table writes even if the default project privileges change.
revoke all on public.profiles,public.admin_members,public.listings,public.listing_images,public.saved_listings,public.conversations,public.messages,public.offers,public.reports,public.moderation_events,public.rate_limits from anon,authenticated;
grant select on public.profiles,public.listings,public.listing_images,public.saved_listings,public.conversations,public.messages,public.offers,public.reports,public.moderation_events to anon,authenticated;

create function public.save_profile(p_name text,p_city text) returns void language plpgsql security definer set search_path='' as $$begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 if exists(select 1 from public.profiles where id=auth.uid() and suspended_at is not null) then raise exception 'Account suspended'; end if;
 insert into public.profiles(id,display_name,city) values(auth.uid(),trim(p_name),p_city) on conflict(id) do update set display_name=excluded.display_name,city=excluded.city;
 end$$;
create function public.seller_name(p_id uuid) returns text language sql stable security definer set search_path='' as $$select display_name from public.profiles p where p.id=p_id and (p.id=auth.uid() or exists(select 1 from public.listings l where l.seller_id=p.id and public.public_listing(l.id)) or exists(select 1 from public.conversations c where auth.uid() in (c.buyer_id,c.seller_id) and p.id in (c.buyer_id,c.seller_id)))$$;
create function public.save_listing(p_id uuid,p_data jsonb) returns uuid language plpgsql security definer set search_path='' as $$declare u uuid:=public.active_user(); l public.listings; result uuid; begin
 perform public.enforce_rate('listing',30);
 if p_id is not null then
 select * into l from public.listings where id=p_id for update;
 if l.id is null or l.seller_id<>u then raise exception 'Listing not found'; end if;
 if l.status not in ('draft','rejected','active') then raise exception 'Withdraw this listing before editing'; end if;
 if exists(select 1 from public.offers where (listing_id=p_id or offered_listing_id=p_id) and status='accepted') then raise exception 'Cancel the accepted request before editing'; end if;
 update public.listings set title=trim(p_data->>'title'),brand=trim(p_data->>'brand'),model=trim(p_data->>'model'),category=p_data->>'category',condition=p_data->>'condition',city=p_data->>'city',price_kobo=(p_data->>'price_kobo')::bigint,description=trim(p_data->>'description'),defects=trim(p_data->>'defects'),included_items=trim(p_data->>'included_items'),status='draft',review_reason=null,published_at=null,updated_at=now() where id=p_id returning id into result;
 else
 insert into public.listings(seller_id,title,brand,model,category,condition,city,price_kobo,description,defects,included_items) values(u,trim(p_data->>'title'),trim(p_data->>'brand'),trim(p_data->>'model'),p_data->>'category',p_data->>'condition',p_data->>'city',(p_data->>'price_kobo')::bigint,trim(p_data->>'description'),trim(p_data->>'defects'),trim(p_data->>'included_items')) returning id into result;
 end if;
 return result; end$$;
create function public.register_image(p_listing uuid,p_path text) returns void language plpgsql security definer set search_path='' as $$declare l public.listings; n int; begin
 select * into l from public.listings where id=p_listing for update;
 if l.id is null or l.seller_id<>public.active_user() or l.status<>'draft' then raise exception 'Only your drafts can receive photos'; end if;
 if p_path not like l.seller_id::text || '/' || l.id::text || '/%.jpg' or not exists(select 1 from storage.objects where bucket_id='listing-photos' and name=p_path and owner_id=auth.uid()::text) then raise exception 'Upload not found'; end if;
 select count(*) into n from public.listing_images where listing_id=p_listing;
 if n>=8 then raise exception 'A listing can have at most eight photos'; end if;
 insert into public.listing_images(listing_id,storage_path,position) values(p_listing,p_path,(select min(s) from generate_series(0,7) s where not exists(select 1 from public.listing_images where listing_id=p_listing and position=s)));
 end$$;
create function public.remove_image(p_image uuid) returns text language plpgsql security definer set search_path='' as $$declare i public.listing_images; l public.listings; begin
 select * into i from public.listing_images where id=p_image;
 select * into l from public.listings where id=i.listing_id for update;
 if l.id is null or l.seller_id<>public.active_user() or l.status<>'draft' then raise exception 'Only your draft photos can be removed'; end if;
 delete from public.listing_images where id=p_image; return i.storage_path; end$$;
create function public.listing_state(p_id uuid,p_state text) returns void language plpgsql security definer set search_path='' as $$declare l public.listings; u uuid:=public.active_user(); begin
 select * into l from public.listings where id=p_id for update;
 if l.id is null or l.seller_id<>u then raise exception 'Listing not found'; end if;
 if exists(select 1 from public.offers where (listing_id=p_id or offered_listing_id=p_id) and status='accepted') then raise exception 'Resolve the accepted request first'; end if;
 if p_state='pending_review' and l.status in ('draft','rejected') then
 if not exists(select 1 from public.listing_images where listing_id=p_id) then raise exception 'Add at least one photo before submitting'; end if;
 elsif p_state='draft' and l.status in ('pending_review','rejected') then null;
 elsif p_state='archived' and l.status in ('draft','pending_review','active','rejected') then null;
 elsif p_state='sold' and l.status='active' then null;
 else raise exception 'Invalid listing transition'; end if;
 update public.listings set status=p_state,updated_at=now() where id=p_id;
 if p_state in ('sold','archived') then update public.offers set status='cancelled',updated_at=now() where (listing_id=p_id or offered_listing_id=p_id) and status='pending'; end if;
 end$$;
create function public.moderate_listing(p_id uuid,p_state text,p_reason text) returns void language plpgsql security definer set search_path='' as $$declare l public.listings; begin
 if not public.is_admin() then raise exception 'Administrator access required'; end if;
 select * into l from public.listings where id=p_id for update;
 if l.id is null then raise exception 'Listing not found'; end if;
 if p_state in ('active','rejected') and l.status='pending_review' then
 if p_state='active' and (not exists(select 1 from public.listing_images where listing_id=p_id) or exists(select 1 from public.profiles where id=l.seller_id and suspended_at is not null)) then raise exception 'Listing is not publishable'; end if;
 elsif p_state='archived' and l.status='active' then null;
 else raise exception 'Invalid moderation transition'; end if;
 if p_state<>'active' and coalesce(char_length(trim(p_reason)),0) not between 5 and 1000 then raise exception 'Provide a reason (5–1000 characters)'; end if;
 update public.listings set status=p_state,review_reason=case when p_state='active' then null else left(p_reason,1000) end,published_at=case when p_state='active' then now() else null end,updated_at=now() where id=p_id;
 if p_state='archived' then update public.offers set status='cancelled',updated_at=now() where (listing_id=p_id or offered_listing_id=p_id) and status in ('pending','accepted'); end if;
 insert into public.moderation_events(admin_id,entity_id,action,notes) values(auth.uid(),p_id,p_state,left(p_reason,1000)); end$$;
create function public.toggle_save(p_listing uuid) returns void language plpgsql security definer set search_path='' as $$declare u uuid:=public.active_user(); begin
 perform public.enforce_rate('save',120);
 if exists(select 1 from public.saved_listings where user_id=u and listing_id=p_listing) then delete from public.saved_listings where user_id=u and listing_id=p_listing;
 else if not public.public_listing(p_listing) then raise exception 'Listing is no longer available'; end if; insert into public.saved_listings values(u,p_listing,now()); end if; end$$;
create function public.start_conversation(p_listing uuid,p_body text) returns uuid language plpgsql security definer set search_path='' as $$declare u uuid:=public.active_user(); l public.listings; c uuid; begin
 perform public.enforce_rate('message',60);
 select * into l from public.listings where id=p_listing;
 if not public.public_listing(p_listing) or l.seller_id=u then raise exception 'Choose an available listing from another seller'; end if;
 insert into public.conversations(listing_id,buyer_id,seller_id) values(p_listing,u,l.seller_id) on conflict(listing_id,buyer_id) do update set listing_id=excluded.listing_id returning id into c;
 insert into public.messages(conversation_id,sender_id,body) values(c,u,trim(p_body)); return c; end$$;
create function public.send_message(p_conversation uuid,p_body text) returns void language plpgsql security definer set search_path='' as $$declare u uuid:=public.active_user(); c public.conversations; begin
 perform public.enforce_rate('message',60);
 select * into c from public.conversations where id=p_conversation;
 if c.id is null or u not in (c.buyer_id,c.seller_id) then raise exception 'Conversation not found'; end if;
 if exists(select 1 from public.profiles where id in (c.buyer_id,c.seller_id) and suspended_at is not null) then raise exception 'Conversation unavailable'; end if;
 insert into public.messages(conversation_id,sender_id,body) values(p_conversation,u,trim(p_body)); end$$;
create function public.read_messages(p_conversation uuid) returns void language plpgsql security definer set search_path='' as $$declare u uuid:=public.active_user(); begin
 if not exists(select 1 from public.conversations where id=p_conversation and u in (buyer_id,seller_id)) then raise exception 'Conversation not found'; end if;
 update public.messages set read_at=now() where conversation_id=p_conversation and sender_id<>u and read_at is null; end$$;
create function public.create_offer(p_listing uuid,p_kind text,p_offered uuid,p_note text) returns uuid language plpgsql security definer set search_path='' as $$declare u uuid:=public.active_user(); l public.listings; result uuid; begin
 perform public.enforce_rate('offer',20);
 -- Lock both items in UUID order, including trade reservations, to prevent races/deadlocks.
 perform 1 from public.listings where id in (p_listing,p_offered) order by id for update;
 select * into l from public.listings where id=p_listing;
 if not public.public_listing(p_listing) or l.seller_id=u then raise exception 'Choose an available listing from another seller'; end if;
 if p_kind='trade' and not exists(select 1 from public.listings where id=p_offered and seller_id=u and public.public_listing(id)) then raise exception 'Offer one of your own active listings'; end if;
 if exists(select 1 from public.offers where status='accepted' and (listing_id in (p_listing,p_offered) or offered_listing_id in (p_listing,p_offered))) then raise exception 'An item already has an accepted request'; end if;
 insert into public.offers(listing_id,buyer_id,seller_id,kind,offered_listing_id,note) values(p_listing,u,l.seller_id,p_kind,p_offered,trim(p_note)) returning id into result; return result; end$$;
create function public.offer_state(p_id uuid,p_state text) returns void language plpgsql security definer set search_path='' as $$declare u uuid:=public.active_user(); o public.offers; begin
 select * into o from public.offers where id=p_id;
 if o.id is null or u not in (o.buyer_id,o.seller_id) then raise exception 'Request not found'; end if;
 perform 1 from public.listings where id in (o.listing_id,o.offered_listing_id) order by id for update;
 select * into o from public.offers where id=p_id for update;
 if o.status='pending' and ((p_state in ('accepted','declined') and u=o.seller_id) or (p_state='cancelled' and u=o.buyer_id)) then null;
 elsif o.status='accepted' and p_state in ('cancelled','completed') then null;
 else raise exception 'Invalid request transition'; end if;
 if p_state in ('accepted','completed') then
 if not public.public_listing(o.listing_id) or (o.kind='trade' and not public.public_listing(o.offered_listing_id)) or exists(select 1 from public.profiles where id in (o.buyer_id,o.seller_id) and suspended_at is not null) then raise exception 'Item or participant is unavailable'; end if;
 if exists(select 1 from public.offers x where x.id<>o.id and x.status='accepted' and (x.listing_id in (o.listing_id,o.offered_listing_id) or x.offered_listing_id in (o.listing_id,o.offered_listing_id))) then raise exception 'An item already has an accepted request'; end if;
 end if;
 update public.offers set status=p_state,updated_at=now() where id=p_id;
 if p_state='accepted' then update public.offers set status='declined',updated_at=now() where id<>p_id and status='pending' and (listing_id in (o.listing_id,o.offered_listing_id) or offered_listing_id in (o.listing_id,o.offered_listing_id)); end if;
 if p_state='completed' then update public.listings set status='sold',updated_at=now() where id in (o.listing_id,o.offered_listing_id); update public.offers set status='cancelled',updated_at=now() where id<>p_id and status='pending' and (listing_id in (o.listing_id,o.offered_listing_id) or offered_listing_id in (o.listing_id,o.offered_listing_id)); end if;
 end$$;
create function public.report_listing(p_listing uuid,p_reason text,p_description text) returns void language plpgsql security definer set search_path='' as $$begin
 perform public.enforce_rate('report',10);
 if not public.public_listing(p_listing) then raise exception 'Listing unavailable'; end if;
 insert into public.reports(reporter_id,listing_id,reason,description) values(public.active_user(),p_listing,p_reason,trim(p_description)); end$$;
create function public.resolve_report(p_id uuid) returns void language plpgsql security definer set search_path='' as $$begin
 if not public.is_admin() then raise exception 'Administrator access required'; end if;
 update public.reports set status='resolved' where id=p_id and status='open';
 if not found then raise exception 'Open report not found'; end if;
 insert into public.moderation_events(admin_id,entity_id,action) values(auth.uid(),p_id,'resolve_report'); end$$;
create function public.suspend_account(p_user uuid,p_suspend boolean,p_reason text) returns void language plpgsql security definer set search_path='' as $$begin
 if not public.is_admin() or p_user=auth.uid() then raise exception 'Administrator access required; cannot suspend yourself'; end if;
 if coalesce(char_length(trim(p_reason)),0) not between 5 and 1000 then raise exception 'Provide a reason (5–1000 characters)'; end if;
 -- Serialize with listing and offer writes.
 perform 1 from public.listings where seller_id=p_user order by id for update;
 update public.profiles set suspended_at=case when p_suspend then now() else null end where id=p_user;
 if not found then raise exception 'Account not found'; end if;
 if p_suspend then update public.offers set status='cancelled',updated_at=now() where p_user in (buyer_id,seller_id) and status in ('pending','accepted'); end if;
 insert into public.moderation_events(admin_id,entity_id,action,notes) values(auth.uid(),p_user,case when p_suspend then 'suspend' else 'restore' end,p_reason); end$$;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('listing-photos','listing-photos',false,5242880,array['image/jpeg']);
create policy photos_read on storage.objects for select using(bucket_id='listing-photos' and exists(select 1 from public.listing_images i join public.listings l on l.id=i.listing_id where i.storage_path=name) or (bucket_id='listing-photos' and owner_id=auth.uid()::text and exists(select 1 from public.listings l where l.id::text=(storage.foldername(name))[2] and l.seller_id=auth.uid() and l.status='draft')));
create policy photos_upload on storage.objects for insert to authenticated with check(bucket_id='listing-photos' and (storage.foldername(name))[1]=public.active_user()::text and exists(select 1 from public.listings l where l.id::text=(storage.foldername(name))[2] and l.seller_id=auth.uid() and l.status='draft'));
create policy photos_delete on storage.objects for delete to authenticated using(bucket_id='listing-photos' and owner_id=auth.uid()::text and exists(select 1 from public.listings l where l.id::text=(storage.foldername(name))[2] and l.seller_id=auth.uid() and l.status='draft'));
-- Internal helpers are not callable through the API. Grant only deliberate public RPCs.
revoke execute on all functions in schema public from public,anon,authenticated;
grant execute on function public.is_admin(),public.public_listing(uuid),public.seller_name(uuid) to anon,authenticated;
grant execute on function public.active_user(),public.save_profile(text,text),public.save_listing(uuid,jsonb),public.register_image(uuid,text),public.remove_image(uuid),public.listing_state(uuid,text),public.moderate_listing(uuid,text,text),public.toggle_save(uuid),public.start_conversation(uuid,text),public.send_message(uuid,text),public.read_messages(uuid),public.create_offer(uuid,text,uuid,text),public.offer_state(uuid,text),public.report_listing(uuid,text,text),public.resolve_report(uuid),public.suspend_account(uuid,boolean,text) to authenticated;
