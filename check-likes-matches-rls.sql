-- Check RLS policies for likes and matches tables
-- Run this in Supabase SQL Editor

-- 1. Check if RLS is enabled on likes and matches tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('likes', 'matches');

-- 2. List all policies on likes table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'likes';

-- 3. List all policies on matches table  
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'matches';

-- 4. Check current user ID
SELECT auth.uid() as current_user_id, auth.role() as current_role;

-- 5. Test basic access to likes table
SELECT COUNT(*) as likes_count FROM likes;

-- 6. Test basic access to matches table
SELECT COUNT(*) as matches_count FROM matches;
