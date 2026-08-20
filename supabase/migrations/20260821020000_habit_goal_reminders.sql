alter table public.habits
  add column if not exists goal_amount numeric,
  add column if not exists goal_unit text,
  add column if not exists reminder_time time;

alter table public.habits
  drop constraint if exists habits_palette_key_check;

alter table public.habits
  add constraint habits_palette_key_check
  check (
    palette_key is null or palette_key in (
      'water',
      'running',
      'gym',
      'meditate',
      'reading',
      'focus',
      'work',
      'food',
      'sleep',
      'journal',
      'creative',
      'music',
      'cycling',
      'skincare',
      'noPhone'
    )
  );

do $$
begin
  alter table public.habits
    add constraint habits_goal_amount_positive_chk
    check (goal_amount is null or goal_amount > 0);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.habits
    add constraint habits_goal_unit_chk
    check (goal_unit is null or goal_unit in ('liters', 'minutes', 'pages', 'reps', 'glasses'));
exception
  when duplicate_object then null;
end $$;

create index if not exists habits_user_reminder_idx
  on public.habits (user_id, reminder_time)
  where reminder_time is not null;
