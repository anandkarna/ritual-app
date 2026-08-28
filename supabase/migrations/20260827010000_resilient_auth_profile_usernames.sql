create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_name text;
  username_base text;
  profile_username text;
begin
  profile_name := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'username',
    split_part(new.email, '@', 1),
    'Rituals user'
  );

  username_base := lower(
    regexp_replace(
      coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1), new.id::text),
      '[^a-zA-Z0-9_]+',
      '_',
      'g'
    )
  );

  username_base := trim(both '_' from username_base);
  if username_base = '' then
    username_base := 'user';
  end if;

  profile_username := username_base;
  if exists (
    select 1
    from public.profiles
    where lower(username) = profile_username
      and id <> new.id
  ) then
    profile_username := username_base || '_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;

  insert into public.profiles (id, name, username, email, avatar_emoji)
  values (new.id, profile_name, profile_username, lower(new.email), '🙂')
  on conflict (id) do update
    set name = excluded.name,
        email = excluded.email,
        username = coalesce(public.profiles.username, excluded.username);

  return new;
end;
$$;
