-- Drop previous restrictive policies to avoid conflicts
drop policy if exists "Authenticated Uploads to Magazines" on storage.objects;
drop policy if exists "Authenticated Updates to Magazines" on storage.objects;
drop policy if exists "Authenticated Deletes in Magazines" on storage.objects;

-- Create permissive policies for the 'magazines' bucket
-- These allow anyone (anon) to upload/update if they target the 'magazines' bucket.
-- Security is handled by the client-side 'Special Auth' in MagazineAdmin.

create policy "Universal Uploads to Magazines"
  on storage.objects for insert
  with check ( bucket_id = 'magazines' );

create policy "Universal Updates to Magazines"
  on storage.objects for update
  using ( bucket_id = 'magazines' );

create policy "Universal Deletes in Magazines"
  on storage.objects for delete
  using ( bucket_id = 'magazines' );
