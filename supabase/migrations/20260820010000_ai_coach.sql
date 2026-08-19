create table if not exists public.coach_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  summary_window_start date not null,
  summary_window_end date not null,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, summary_window_start, summary_window_end)
);

create table if not exists public.coach_nudges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid references public.habits(id) on delete cascade,
  title text not null,
  body text not null,
  deep_link_context jsonb not null default '{}'::jsonb,
  nudge_date date not null default current_date,
  scheduled_for timestamptz not null default now(),
  sent_at timestamptz,
  created_at timestamptz default now(),
  unique (user_id, habit_id, nudge_date)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists coach_summaries_set_updated_at on public.coach_summaries;
create trigger coach_summaries_set_updated_at
before update on public.coach_summaries
for each row execute function public.set_updated_at();

alter table public.coach_summaries enable row level security;
alter table public.coach_nudges enable row level security;

drop policy if exists "coach summaries are owned by auth user" on public.coach_summaries;
create policy "coach summaries are owned by auth user" on public.coach_summaries
  for select using (user_id = auth.uid());

drop policy if exists "coach nudges are owned by auth user" on public.coach_nudges;
create policy "coach nudges are owned by auth user" on public.coach_nudges
  for select using (user_id = auth.uid());

create index if not exists coach_summaries_user_window_idx
  on public.coach_summaries (user_id, summary_window_end desc);

create index if not exists coach_nudges_user_scheduled_idx
  on public.coach_nudges (user_id, scheduled_for desc);
