alter table public.profiles
  add column if not exists username text,
  add column if not exists email text;

alter table public.habits
  add column if not exists palette_key text check (palette_key in ('reading', 'food', 'focus', 'water'));

create unique index if not exists profiles_username_unique_idx
  on public.profiles (lower(username))
  where username is not null and username <> '';

create unique index if not exists profiles_email_unique_idx
  on public.profiles (lower(email))
  where email is not null and email <> '';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_name text;
  profile_username text;
begin
  profile_name := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'username',
    split_part(new.email, '@', 1),
    'Rituals user'
  );

  profile_username := lower(
    regexp_replace(
      coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1), new.id::text),
      '[^a-zA-Z0-9_]+',
      '_',
      'g'
    )
  );

  insert into public.profiles (id, name, username, email, avatar_emoji)
  values (new.id, profile_name, profile_username, lower(new.email), '🙂')
  on conflict (id) do update
    set name = excluded.name,
        username = excluded.username,
        email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.email_for_username(lookup_username text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select email
  from public.profiles
  where lower(username) = lower(trim(lookup_username))
  limit 1;
$$;

grant execute on function public.email_for_username(text) to anon, authenticated;

create index if not exists habits_user_palette_idx
  on public.habits (user_id, palette_key);
