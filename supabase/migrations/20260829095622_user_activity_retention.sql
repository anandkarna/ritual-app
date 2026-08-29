alter table public.habit_logs
  add column if not exists activity_date date,
  add column if not exists completed boolean not null default true,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

update public.habit_logs
set activity_date = log_date
where activity_date is null;

alter table public.habit_logs
  alter column activity_date set not null;

create or replace function public.sync_habit_log_activity_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.activity_date := coalesce(new.activity_date, new.log_date, current_date);
  new.log_date := coalesce(new.log_date, new.activity_date);
  new.completed := coalesce(new.completed, true);

  if new.completed and new.completed_at is null then
    new.completed_at := now();
  end if;

  if tg_op = 'INSERT' and new.created_at is null then
    new.created_at := now();
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists habit_logs_sync_activity_fields on public.habit_logs;
create trigger habit_logs_sync_activity_fields
before insert or update on public.habit_logs
for each row execute function public.sync_habit_log_activity_fields();

create unique index if not exists habits_id_user_id_unique_idx
  on public.habits (id, user_id);

create unique index if not exists habit_logs_user_habit_activity_date_key
  on public.habit_logs (user_id, habit_id, activity_date);

create index if not exists habit_logs_user_activity_date_idx
  on public.habit_logs (user_id, activity_date desc);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'habit_logs_habit_owner_fk'
      and conrelid = 'public.habit_logs'::regclass
  ) then
    alter table public.habit_logs
      add constraint habit_logs_habit_owner_fk
      foreign key (habit_id, user_id)
      references public.habits (id, user_id)
      on delete cascade
      not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ritual_checkins_ritual_owner_fk'
      and conrelid = 'public.ritual_checkins'::regclass
  ) then
    alter table public.ritual_checkins
      add constraint ritual_checkins_ritual_owner_fk
      foreign key (ritual_id, user_id)
      references public.habits (id, user_id)
      on delete cascade
      not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ritual_checkins_habit_owner_fk'
      and conrelid = 'public.ritual_checkins'::regclass
  ) then
    alter table public.ritual_checkins
      add constraint ritual_checkins_habit_owner_fk
      foreign key (habit_id, user_id)
      references public.habits (id, user_id)
      on delete cascade
      not valid;
  end if;
end $$;

create table if not exists public.activity_monthly_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  month_start date not null,
  total_days integer not null default 0,
  completed_days integer not null default 0,
  completion_percentage numeric(5,2) not null default 0,
  best_streak integer not null default 0,
  missed_days integer not null default 0,
  first_activity_date date,
  last_activity_date date,
  last_aggregated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, habit_id, month_start),
  check (total_days >= 0),
  check (completed_days >= 0),
  check (best_streak >= 0),
  check (missed_days >= 0)
);

drop trigger if exists activity_monthly_stats_set_updated_at on public.activity_monthly_stats;
create trigger activity_monthly_stats_set_updated_at
before update on public.activity_monthly_stats
for each row execute function public.set_updated_at();

create index if not exists activity_monthly_stats_user_month_idx
  on public.activity_monthly_stats (user_id, month_start desc);

alter table public.activity_monthly_stats enable row level security;

create or replace function public.cleanup_old_activity(retention_days integer default 30)
returns table(cutoff_date date, deleted_count bigint, aggregated_months bigint)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  safe_retention integer := least(greatest(coalesce(retention_days, 30), 1), 3650);
  archive_cutoff date := current_date - safe_retention;
  archived_months bigint := 0;
  removed_rows bigint := 0;
begin
  drop table if exists pg_temp.activity_archive_rollup;

  create temp table pg_temp.activity_archive_rollup on commit drop as
  with old_rows as (
    select user_id, habit_id, activity_date, completed
    from public.habit_logs
    where activity_date < archive_cutoff
  ),
  completed_runs as (
    select
      user_id,
      habit_id,
      date_trunc('month', activity_date)::date as month_start,
      activity_date - (row_number() over (
        partition by user_id, habit_id, date_trunc('month', activity_date)::date
        order by activity_date
      ))::integer as streak_group
    from old_rows
    where completed is true
  ),
  best_runs as (
    select user_id, habit_id, month_start, max(run_length)::integer as best_streak
    from (
      select user_id, habit_id, month_start, streak_group, count(*)::integer as run_length
      from completed_runs
      group by user_id, habit_id, month_start, streak_group
    ) runs
    group by user_id, habit_id, month_start
  )
  select
    old_rows.user_id,
    old_rows.habit_id,
    date_trunc('month', old_rows.activity_date)::date as month_start,
    count(*)::integer as total_days,
    count(*) filter (where old_rows.completed is true)::integer as completed_days,
    coalesce(max(best_runs.best_streak), 0)::integer as best_streak,
    count(*) filter (where old_rows.completed is not true)::integer as missed_days,
    min(old_rows.activity_date) as first_activity_date,
    max(old_rows.activity_date) as last_activity_date
  from old_rows
  left join best_runs
    on best_runs.user_id = old_rows.user_id
   and best_runs.habit_id = old_rows.habit_id
   and best_runs.month_start = date_trunc('month', old_rows.activity_date)::date
  group by old_rows.user_id, old_rows.habit_id, date_trunc('month', old_rows.activity_date)::date;

  insert into public.activity_monthly_stats (
    user_id,
    habit_id,
    month_start,
    total_days,
    completed_days,
    completion_percentage,
    best_streak,
    missed_days,
    first_activity_date,
    last_activity_date,
    last_aggregated_at
  )
  select
    user_id,
    habit_id,
    month_start,
    total_days,
    completed_days,
    round((completed_days::numeric / greatest(total_days, 1)) * 100, 2),
    best_streak,
    missed_days,
    first_activity_date,
    last_activity_date,
    now()
  from pg_temp.activity_archive_rollup
  on conflict (user_id, habit_id, month_start) do update
    set total_days = public.activity_monthly_stats.total_days + excluded.total_days,
        completed_days = public.activity_monthly_stats.completed_days + excluded.completed_days,
        completion_percentage = round(
          ((public.activity_monthly_stats.completed_days + excluded.completed_days)::numeric
            / greatest(public.activity_monthly_stats.total_days + excluded.total_days, 1)) * 100,
          2
        ),
        best_streak = greatest(public.activity_monthly_stats.best_streak, excluded.best_streak),
        missed_days = public.activity_monthly_stats.missed_days + excluded.missed_days,
        first_activity_date = least(
          coalesce(public.activity_monthly_stats.first_activity_date, excluded.first_activity_date),
          excluded.first_activity_date
        ),
        last_activity_date = greatest(
          coalesce(public.activity_monthly_stats.last_activity_date, excluded.last_activity_date),
          excluded.last_activity_date
        ),
        last_aggregated_at = now(),
        updated_at = now();

  select count(*) into archived_months
  from pg_temp.activity_archive_rollup;

  delete from public.habit_logs
  where activity_date < archive_cutoff;

  get diagnostics removed_rows = row_count;

  return query select archive_cutoff, removed_rows, archived_months;
end;
$$;

alter table public.profiles enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.ritual_checkins enable row level security;
alter table public.coach_summaries enable row level security;
alter table public.coach_nudges enable row level security;
alter table public.weekly_insights enable row level security;
alter table public.notifications enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.habits from anon, authenticated;
revoke all on table public.habit_logs from anon, authenticated;
revoke all on table public.ritual_checkins from anon, authenticated;
revoke all on table public.activity_monthly_stats from anon, authenticated;

grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.habits to authenticated;
grant select, insert, update, delete on table public.habit_logs to authenticated;
grant select, insert, update on table public.ritual_checkins to authenticated;
grant select on table public.activity_monthly_stats to authenticated;
grant select, insert, update, delete on table public.activity_monthly_stats to service_role;

drop policy if exists "profiles are owned by auth user" on public.profiles;
drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_delete_own on public.profiles;

create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy profiles_insert_own
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy profiles_delete_own
  on public.profiles
  for delete
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "habits are owned by auth user" on public.habits;
drop policy if exists habits_select_own on public.habits;
drop policy if exists habits_insert_own on public.habits;
drop policy if exists habits_update_own on public.habits;
drop policy if exists habits_delete_own on public.habits;

create policy habits_select_own
  on public.habits
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy habits_insert_own
  on public.habits
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy habits_update_own
  on public.habits
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy habits_delete_own
  on public.habits
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "habit logs are owned by auth user" on public.habit_logs;
drop policy if exists habit_logs_select_own on public.habit_logs;
drop policy if exists habit_logs_insert_own on public.habit_logs;
drop policy if exists habit_logs_update_own on public.habit_logs;
drop policy if exists habit_logs_delete_own on public.habit_logs;

create policy habit_logs_select_own
  on public.habit_logs
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy habit_logs_insert_own
  on public.habit_logs
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy habit_logs_update_own
  on public.habit_logs
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy habit_logs_delete_own
  on public.habit_logs
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can read own ritual checkins" on public.ritual_checkins;
drop policy if exists "Users can insert own ritual checkins" on public.ritual_checkins;
drop policy if exists "Users can update own ritual checkins" on public.ritual_checkins;
drop policy if exists ritual_checkins_select_own on public.ritual_checkins;
drop policy if exists ritual_checkins_insert_own on public.ritual_checkins;
drop policy if exists ritual_checkins_update_own on public.ritual_checkins;

create policy ritual_checkins_select_own
  on public.ritual_checkins
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy ritual_checkins_insert_own
  on public.ritual_checkins
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy ritual_checkins_update_own
  on public.ritual_checkins
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists activity_monthly_stats_select_own on public.activity_monthly_stats;

create policy activity_monthly_stats_select_own
  on public.activity_monthly_stats
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.sync_habit_log_activity_fields() from public, anon, authenticated;
revoke execute on function public.cleanup_old_activity(integer) from public, anon, authenticated;
grant execute on function public.cleanup_old_activity(integer) to service_role;

create or replace function public.email_for_username(lookup_username text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select email
  from public.profiles
  where lower(username) = lower(trim(lookup_username))
  limit 1;
$$;

grant execute on function public.email_for_username(text) to anon, authenticated;
