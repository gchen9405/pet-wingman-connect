-- Fix matches table to add missing id column
-- Run this in Supabase SQL Editor ONLY if your matches table is missing the id column

-- Check if the matches table exists and what columns it has
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'matches'
ORDER BY ordinal_position;

-- If the above query shows that there's no 'id' column, run this:
-- ALTER TABLE matches ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();

-- If you need to recreate the matches table completely, run this:
/*
DROP TABLE IF EXISTS matches;

CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_b UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure user_a < user_b to prevent duplicate matches
    CONSTRAINT ordered_users CHECK (user_a < user_b),
    
    -- Ensure unique matches between users
    UNIQUE(user_a, user_b)
);

-- Enable RLS
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
*/
