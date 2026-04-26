create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.habit_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_key text not null,
  completed_on date not null,
  created_at timestamptz not null default now(),
  unique (user_id, habit_key, completed_on)
);

create table if not exists public.quran_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  surah integer not null check (surah between 1 and 114),
  ayah integer not null check (ayah > 0),
  page integer check (page between 1 and 604),
  pages_read_today integer not null default 0 check (pages_read_today >= 0),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create type public.fast_type as enum ('qadha', 'sunnah', 'ramadan', 'other');
create type public.fast_status as enum ('planned', 'completed', 'missed');

create table if not exists public.fasting_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fasted_on date not null,
  fast_type public.fast_type not null,
  status public.fast_status not null default 'planned',
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, fasted_on, fast_type)
);

create table if not exists public.cycle_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_on date not null,
  phase text,
  flow text,
  mood text,
  symptoms text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, entry_on)
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  daily_quran_goal_pages integer not null default 5 check (daily_quran_goal_pages > 0),
  qadha_days_remaining integer not null default 0 check (qadha_days_remaining >= 0),
  reminder_settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.habit_completions enable row level security;
alter table public.quran_progress enable row level security;
alter table public.fasting_days enable row level security;
alter table public.cycle_entries enable row level security;
alter table public.user_settings enable row level security;

create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Profiles are editable by owner"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Habit completions are owned by user"
  on public.habit_completions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Quran progress is owned by user"
  on public.quran_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Fasting days are owned by user"
  on public.fasting_days for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Cycle entries are owned by user"
  on public.cycle_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Settings are owned by user"
  on public.user_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'avatar_url');

  insert into public.user_settings (user_id)
  values (new.id);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
