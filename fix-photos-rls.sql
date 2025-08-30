-- Fix Row Level Security policies for photos table
-- Run these commands in your Supabase SQL Editor

-- First, enable RLS on the photos table (if not already enabled)
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can insert their own photos" ON photos;
DROP POLICY IF EXISTS "Users can select their own photos" ON photos;
DROP POLICY IF EXISTS "Users can update their own photos" ON photos;
DROP POLICY IF EXISTS "Users can delete their own photos" ON photos;
DROP POLICY IF EXISTS "Users can insert pet photos" ON photos;
DROP POLICY IF EXISTS "Users can select pet photos" ON photos;
DROP POLICY IF EXISTS "Users can update pet photos" ON photos;
DROP POLICY IF EXISTS "Users can delete pet photos" ON photos;

-- Policy for users to insert their own photos
CREATE POLICY "Users can insert their own photos" ON photos
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (
      -- For human photos: owner_id must match the authenticated user
      (owner_type = 'human' AND owner_id = auth.uid()) OR
      -- For pet photos: the pet must belong to the authenticated user
      (owner_type = 'pet' AND EXISTS (
        SELECT 1 FROM pets WHERE pets.id = photos.owner_id AND pets.user_id = auth.uid()
      ))
    )
  );

-- Policy for users to select/view their own photos
CREATE POLICY "Users can select their own photos" ON photos
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    (
      -- For human photos: owner_id must match the authenticated user
      (owner_type = 'human' AND owner_id = auth.uid()) OR
      -- For pet photos: the pet must belong to the authenticated user
      (owner_type = 'pet' AND EXISTS (
        SELECT 1 FROM pets WHERE pets.id = photos.owner_id AND pets.user_id = auth.uid()
      ))
    )
  );

-- Policy for users to update their own photos
CREATE POLICY "Users can update their own photos" ON photos
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    (
      -- For human photos: owner_id must match the authenticated user
      (owner_type = 'human' AND owner_id = auth.uid()) OR
      -- For pet photos: the pet must belong to the authenticated user
      (owner_type = 'pet' AND EXISTS (
        SELECT 1 FROM pets WHERE pets.id = photos.owner_id AND pets.user_id = auth.uid()
      ))
    )
  );

-- Policy for users to delete their own photos
CREATE POLICY "Users can delete their own photos" ON photos
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND
    (
      -- For human photos: owner_id must match the authenticated user
      (owner_type = 'human' AND owner_id = auth.uid()) OR
      -- For pet photos: the pet must belong to the authenticated user
      (owner_type = 'pet' AND EXISTS (
        SELECT 1 FROM pets WHERE pets.id = photos.owner_id AND pets.user_id = auth.uid()
      ))
    )
  );

-- Also ensure storage policies exist for the photos bucket
-- Note: You may need to run these in the Storage > Policies section of Supabase dashboard

-- Allow authenticated users to upload to their own folders
-- INSERT policy for storage.objects
-- Bucket: photos
-- Policy name: Users can upload photos
-- Policy: bucket_id = 'photos' AND auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text

-- Allow authenticated users to view their own photos  
-- SELECT policy for storage.objects
-- Bucket: photos
-- Policy name: Users can view photos
-- Policy: bucket_id = 'photos' AND auth.uid() IS NOT NULL

-- Allow authenticated users to delete their own photos
-- DELETE policy for storage.objects  
-- Bucket: photos
-- Policy name: Users can delete photos
-- Policy: bucket_id = 'photos' AND auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text
