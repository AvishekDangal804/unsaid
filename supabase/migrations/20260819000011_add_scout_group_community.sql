insert into public.communities (slug, name, description, emoji) values
  ('scout-group', 'Scout Group', 'For scouts, troops, and everything scouting.', '🏕️')
on conflict (slug) do nothing;
