do $$
begin
  create type public.flo_tone as enum ('gentle', 'direct', 'coach');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.checkin_category as enum ('aligned_tradeoff', 'circumstantial', 'drift', 'pattern');
exception
  when duplicate_object then null;
end $$;

alter table public.habits
  add column if not exists why text;

alter table public.profiles
  add column if not exists flo_tone public.flo_tone not null default 'gentle';

create table if not exists public.ritual_checkins (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  ritual_id uuid references public.habits(id) on delete cascade,
  habit_id uuid references public.habits(id) on delete cascade,
  checkin_date date not null,
  scheduled_window text not null,
  user_reason_raw text not null,
  category public.checkin_category not null,
  flo_message text not null,
  streak_protected boolean not null default false,
  suggested_action text,
  created_at timestamptz not null default now()
);

create index if not exists ritual_checkins_user_date_idx
  on public.ritual_checkins (user_id, checkin_date desc);

alter table public.ritual_checkins enable row level security;

drop policy if exists "Users can read own ritual checkins" on public.ritual_checkins;
create policy "Users can read own ritual checkins"
  on public.ritual_checkins
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own ritual checkins" on public.ritual_checkins;
create policy "Users can insert own ritual checkins"
  on public.ritual_checkins
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own ritual checkins" on public.ritual_checkins;
create policy "Users can update own ritual checkins"
  on public.ritual_checkins
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
