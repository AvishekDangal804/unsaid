alter table public.post_media
  add column media_type text not null default 'image' check (media_type in ('image', 'video')),
  add column duration_seconds int;

update storage.buckets
set file_size_limit = 157286400,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
where id = 'post-media';
