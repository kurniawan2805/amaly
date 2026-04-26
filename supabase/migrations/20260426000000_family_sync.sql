do $$
begin
  create type public.partner_role as enum ('husband', 'wife');
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.partner_event_type as enum ('quran_goal', 'nudge');
exception
  when duplicate_object then null;
end;
$$;

alter table public.quran_progress
  add column if not exists daily_goal integer not null default 5 check (daily_goal > 0),
  add column if not exists last_page_read integer not null default 0 check (last_page_read between 0 and 604),
  add column if not exists goal_completed_today boolean not null default false,
  add column if not exists completed_juzs jsonb not null default '[]'::jsonb,
  add column if not exists logs jsonb not null default '[]'::jsonb;

create table if not exists public.partner_invites (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[0-9]{6}$'),
  created_by uuid not null references auth.users(id) on delete cascade,
  creator_role public.partner_role not null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.partnerships (
  id uuid primary key default gen_random_uuid(),
  husband_id uuid not null references auth.users(id) on delete cascade,
  wife_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (husband_id <> wife_id),
  unique (husband_id, wife_id)
);

create unique index if not exists partnerships_husband_unique
  on public.partnerships (husband_id);

create unique index if not exists partnerships_wife_unique
  on public.partnerships (wife_id);

create table if not exists public.partner_events (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  event_type public.partner_event_type not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  check (sender_id <> receiver_id)
);

do $$
begin
  alter publication supabase_realtime add table public.partner_events;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;

alter table public.partner_invites enable row level security;
alter table public.partnerships enable row level security;
alter table public.partner_events enable row level security;

create or replace function public.partner_user_ids(p_current_user uuid default auth.uid())
returns table(user_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select wife_id as user_id
  from public.partnerships
  where husband_id = p_current_user
  union
  select husband_id as user_id
  from public.partnerships
  where wife_id = p_current_user
$$;

create or replace function public.are_partners(target_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.partner_user_ids(auth.uid()) partners
    where partners.user_id = target_user
  )
$$;

create or replace function public.accept_partner_invite(invite_code text, accepter_role public.partner_role)
returns public.partnerships
language plpgsql
security definer
set search_path = public
as $$
declare
  invite public.partner_invites;
  created public.partnerships;
  husband uuid;
  wife uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select *
  into invite
  from public.partner_invites
  where code = invite_code
    and accepted_at is null
    and expires_at > now()
  limit 1;

  if invite.id is null then
    raise exception 'invite_not_found';
  end if;

  if invite.created_by = auth.uid() then
    raise exception 'cannot_accept_own_invite';
  end if;

  if invite.creator_role = accepter_role then
    raise exception 'roles_must_be_complementary';
  end if;

  husband := case when invite.creator_role = 'husband' then invite.created_by else auth.uid() end;
  wife := case when invite.creator_role = 'wife' then invite.created_by else auth.uid() end;

  insert into public.partnerships (husband_id, wife_id)
  values (husband, wife)
  returning * into created;

  update public.partner_invites
  set accepted_at = now()
  where id = invite.id;

  return created;
end;
$$;

drop policy if exists "Profiles are viewable by partner" on public.profiles;
create policy "Profiles are viewable by partner"
  on public.profiles for select
  using (public.are_partners(id));

drop policy if exists "Quran progress is viewable by partner" on public.quran_progress;
create policy "Quran progress is viewable by partner"
  on public.quran_progress for select
  using (public.are_partners(user_id));

drop policy if exists "Fasting days are viewable by partner" on public.fasting_days;
create policy "Fasting days are viewable by partner"
  on public.fasting_days for select
  using (public.are_partners(user_id));

drop policy if exists "Partner invites are creatable by owner" on public.partner_invites;
create policy "Partner invites are creatable by owner"
  on public.partner_invites for insert
  with check (auth.uid() = created_by);

drop policy if exists "Partner invites are readable by owner or active accepter" on public.partner_invites;
create policy "Partner invites are readable by owner or active accepter"
  on public.partner_invites for select
  using (auth.uid() = created_by or (accepted_at is null and expires_at > now()));

drop policy if exists "Partnerships are readable by partners" on public.partnerships;
create policy "Partnerships are readable by partners"
  on public.partnerships for select
  using (auth.uid() = husband_id or auth.uid() = wife_id);

drop policy if exists "Partner events are readable by receiver" on public.partner_events;
create policy "Partner events are readable by receiver"
  on public.partner_events for select
  using (auth.uid() = receiver_id);

drop policy if exists "Partner events are insertable by partner sender" on public.partner_events;
create policy "Partner events are insertable by partner sender"
  on public.partner_events for insert
  with check (auth.uid() = sender_id and public.are_partners(receiver_id));

drop policy if exists "Partner events are markable by receiver" on public.partner_events;
create policy "Partner events are markable by receiver"
  on public.partner_events for update
  using (auth.uid() = receiver_id)
  with check (auth.uid() = receiver_id);
