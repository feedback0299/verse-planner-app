-- Create a new public bucket for magazines
insert into storage.buckets (id, name, public)
values ('magazines', 'magazines', true);

-- Policy to allow public read access to magazines
create policy "Public Access to Magazines"
  on storage.objects for select
  using ( bucket_id = 'magazines' );

-- Policy to allow authenticated uploads to magazines (or specifically for your editor user)
-- For simplicity, allowing any authenticated user to upload. 
-- In production, you might want to restrict this to specific user IDs or roles.
create policy "Authenticated Uploads to Magazines"
  on storage.objects for insert
  with check ( bucket_id = 'magazines' AND auth.role() = 'authenticated' );

-- Policy to allow authenticated updates (overwrite)
create policy "Authenticated Updates to Magazines"
  on storage.objects for update
  using ( bucket_id = 'magazines' AND auth.role() = 'authenticated' );

-- Policy to allow authenticated deletes
create policy "Authenticated Deletes in Magazines"
  on storage.objects for delete
  using ( bucket_id = 'magazines' AND auth.role() = 'authenticated' );
