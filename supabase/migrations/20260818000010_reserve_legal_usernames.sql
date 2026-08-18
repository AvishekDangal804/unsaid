insert into public.reserved_usernames (username) values
  ('terms'), ('privacy'), ('guidelines'), ('safety'), ('legal'), ('about'), ('contact')
on conflict (username) do nothing;
