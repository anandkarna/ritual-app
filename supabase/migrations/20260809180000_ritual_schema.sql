create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  avatar_emoji text default 'Flame',
  plan text default 'free' check (plan in ('free', 'premium')),
  dark_theme boolean default false,
  haptics_enabled boolean default true,
  push_enabled boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text not null,
  color text not null check (color in ('coral', 'dark', 'amber', 'violet', 'sky')),
  frequency text not null check (frequency in ('daily', 'weekdays', '3x_week')),
  reminder_time time,
  is_archived boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  completed_at timestamptz default now(),
  freeze_used boolean default false,
  unique (habit_id, log_date)
);

create table if not exists public.weekly_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  summary_text text,
  strongest_habit_id uuid references public.habits(id),
  weakest_habit_id uuid references public.habits(id),
  suggestion text,
  created_at timestamptz default now(),
  unique (user_id, week_start)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('streak_milestone', 'insight_ready', 'reminder')),
  title text not null,
  body text,
  read boolean default false,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.weekly_insights enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "profiles are owned by auth user" on public.profiles;
create policy "profiles are owned by auth user" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "habits are owned by auth user" on public.habits;
create policy "habits are owned by auth user" on public.habits
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "habit logs are owned by auth user" on public.habit_logs;
create policy "habit logs are owned by auth user" on public.habit_logs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "weekly insights are owned by auth user" on public.weekly_insights;
create policy "weekly insights are owned by auth user" on public.weekly_insights
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "notifications are owned by auth user" on public.notifications;
create policy "notifications are owned by auth user" on public.notifications
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create index if not exists habits_user_id_created_at_idx on public.habits (user_id, created_at desc);
create index if not exists habit_logs_user_id_log_date_idx on public.habit_logs (user_id, log_date desc);
create index if not exists notifications_user_id_created_at_idx on public.notifications (user_id, created_at desc);
