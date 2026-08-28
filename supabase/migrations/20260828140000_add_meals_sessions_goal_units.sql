alter table public.habits
  drop constraint if exists habits_goal_unit_chk;

alter table public.habits
  add constraint habits_goal_unit_chk
  check (goal_unit is null or goal_unit in ('liters', 'minutes', 'hours', 'pages', 'reps', 'glasses', 'meals', 'sessions'));
