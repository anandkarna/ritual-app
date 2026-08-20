alter table public.profiles
  add column if not exists age integer,
  add column if not exists city text,
  add column if not exists mobile text,
  add column if not exists country_code text default '+91',
  add column if not exists profile_complete boolean default false,
  add column if not exists profile_setup_skipped boolean default false;

do $$
begin
  alter table public.profiles
    add constraint profiles_age_reasonable_chk
    check (age is null or (age between 13 and 120));
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.profiles
    add constraint profiles_mobile_international_chk
    check (mobile is null or mobile ~ '^\+[0-9]{11,15}$');
exception
  when duplicate_object then null;
end $$;

update public.profiles
set profile_complete = true
where profile_complete is false
  and name is not null
  and nullif(trim(name), '') is not null
  and age between 13 and 120
  and nullif(trim(city), '') is not null
  and mobile ~ '^\+[0-9]{11,15}$';

create index if not exists profiles_profile_complete_idx
  on public.profiles (id, profile_complete);
