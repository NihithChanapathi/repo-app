-- Repo database schema. Paste into Supabase > SQL Editor > Run.
-- Safe to run once on a fresh project.

-- ---------- Campuses (add a row to open a new school) ----------
create table public.campuses (
  id           text primary key,
  name         text not null,
  email_domain text not null unique
);
insert into public.campuses (id, name, email_domain) values
  ('ncsu', 'NC State',        'ncsu.edu'),
  ('unc',  'UNC Chapel Hill', 'unc.edu'),
  ('duke', 'Duke',            'duke.edu');

-- ---------- Profiles ----------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  campus_id    text not null references public.campuses (id),
  display_name text not null,
  created_at   timestamptz not null default now()
);

-- Only .edu emails from a known campus can sign up; profile is created automatically.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  dom text := lower(split_part(new.email, '@', 2));
  cid text;
begin
  select id into cid from public.campuses
   where dom = email_domain or dom like '%.' || email_domain
   limit 1;
  if cid is null then
    raise exception 'Repo is for verified students. Use your campus .edu email.';
  end if;
  insert into public.profiles (id, campus_id, display_name)
  values (new.id, cid, 'Student ' || substr(new.id::text, 1, 4));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper used by row-level security (security definer avoids policy recursion).
create or replace function public.my_campus()
returns text language sql stable security definer set search_path = public as $$
  select campus_id from public.profiles where id = auth.uid()
$$;

-- ---------- Listings ----------
create type public.listing_category as enum
  ('dorm', 'clothes', 'parking', 'tickets', 'sublease', 'other');
create type public.listing_status as enum ('active', 'sold', 'removed');

create table public.listings (
  id          uuid primary key default gen_random_uuid(),
  seller_id   uuid not null references public.profiles (id) on delete cascade,
  campus_id   text not null references public.campuses (id),
  category    public.listing_category not null,
  title       text not null check (char_length(title) between 3 and 100),
  description text not null default '' check (char_length(description) <= 2000),
  price_cents integer not null check (price_cents >= 0 and price_cents <= 1000000),
  condition   text,
  location    text,
  event_date  date,   -- game / event / parking date
  lease_start date,   -- subleases
  lease_end   date,
  images      text[] not null default '{}',
  status      public.listing_status not null default 'active',
  created_at  timestamptz not null default now()
);
create index listings_feed_idx on public.listings (campus_id, status, created_at desc);

-- ---------- Messaging ----------
create table public.conversations (
  id         uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  buyer_id   uuid not null references public.profiles (id) on delete cascade,
  seller_id  uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (listing_id, buyer_id)
);

create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id       uuid not null references public.profiles (id) on delete cascade,
  body            text not null check (char_length(body) between 1 and 2000),
  created_at      timestamptz not null default now()
);
create index messages_conv_idx on public.messages (conversation_id, created_at);

-- ---------- Reports (moderation queue) ----------
create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  listing_id  uuid not null references public.listings (id) on delete cascade,
  reason      text not null check (char_length(reason) between 3 and 500),
  created_at  timestamptz not null default now()
);

-- ---------- Row-level security ----------
alter table public.campuses      enable row level security;
alter table public.profiles      enable row level security;
alter table public.listings      enable row level security;
alter table public.conversations enable row level security;
alter table public.messages      enable row level security;
alter table public.reports       enable row level security;

create policy "campuses readable" on public.campuses for select using (true);

create policy "profiles readable by members" on public.profiles
  for select to authenticated using (true);
create policy "update own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Students only see listings from their own campus.
create policy "listings: same campus" on public.listings
  for select to authenticated
  using (campus_id = public.my_campus() and (status = 'active' or seller_id = auth.uid()));
create policy "listings: insert own" on public.listings
  for insert to authenticated
  with check (seller_id = auth.uid() and campus_id = public.my_campus());
create policy "listings: update own" on public.listings
  for update to authenticated
  using (seller_id = auth.uid())
  with check (seller_id = auth.uid() and campus_id = public.my_campus());
create policy "listings: delete own" on public.listings
  for delete to authenticated using (seller_id = auth.uid());

create policy "conversations: participants read" on public.conversations
  for select to authenticated using (auth.uid() in (buyer_id, seller_id));
create policy "conversations: buyer starts" on public.conversations
  for insert to authenticated
  with check (
    buyer_id = auth.uid()
    and seller_id <> auth.uid()
    and seller_id = (select l.seller_id from public.listings l where l.id = listing_id)
  );

create policy "messages: participants read" on public.messages
  for select to authenticated
  using (exists (select 1 from public.conversations c
                 where c.id = conversation_id and auth.uid() in (c.buyer_id, c.seller_id)));
create policy "messages: participants send" on public.messages
  for insert to authenticated
  with check (sender_id = auth.uid()
    and exists (select 1 from public.conversations c
                where c.id = conversation_id and auth.uid() in (c.buyer_id, c.seller_id)));

create policy "reports: insert own" on public.reports
  for insert to authenticated with check (reporter_id = auth.uid());
-- No select policy: only you (service role / dashboard) can read reports.

-- ---------- Realtime chat ----------
alter publication supabase_realtime add table public.messages;

-- ---------- Photo storage ----------
insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

create policy "listing images: public read" on storage.objects
  for select using (bucket_id = 'listing-images');
create policy "listing images: upload to own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'listing-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "listing images: delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'listing-images' and (storage.foldername(name))[1] = auth.uid()::text);
