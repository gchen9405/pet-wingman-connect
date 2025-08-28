-- ============================================================================
-- Pet Wingman Connect Database Schema
-- ============================================================================

-- Create custom types
CREATE TYPE owner_type_enum AS ENUM ('human', 'pet');
CREATE TYPE target_type_enum AS ENUM ('prompt', 'profile');

-- ============================================================================
-- TABLES
-- ============================================================================

-- Profiles table for user information
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    age INTEGER,
    height TEXT,
    sexuality TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pets table for pet information
CREATE TABLE pets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age INTEGER,
    weight TEXT,
    breed TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prompts table for standard prompts
CREATE TABLE prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_type owner_type_enum NOT NULL,
    text TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prompt answers table for user/pet responses
CREATE TABLE prompt_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_type owner_type_enum NOT NULL,
    owner_id UUID NOT NULL,
    prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    answer_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure owner_id references the correct table based on owner_type
    CONSTRAINT valid_owner_reference CHECK (
        (owner_type = 'human' AND owner_id IN (SELECT id FROM profiles)) OR
        (owner_type = 'pet' AND owner_id IN (SELECT id FROM pets))
    )
);

-- Photos table for user and pet photos
CREATE TABLE photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_type owner_type_enum NOT NULL,
    owner_id UUID NOT NULL,
    path TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure owner_id references the correct table based on owner_type
    CONSTRAINT valid_photo_owner_reference CHECK (
        (owner_type = 'human' AND owner_id IN (SELECT id FROM profiles)) OR
        (owner_type = 'pet' AND owner_id IN (SELECT id FROM pets))
    )
);

-- Likes table for user interactions
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_type target_type_enum NOT NULL,
    target_id UUID NOT NULL,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent users from liking themselves
    CONSTRAINT no_self_like CHECK (from_user_id != to_user_id),
    
    -- Prevent duplicate likes on the same target
    UNIQUE(from_user_id, to_user_id, target_type, target_id)
);

-- Matches table for mutual likes
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

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Performance indexes
CREATE INDEX idx_pets_user_id ON pets(user_id);
CREATE INDEX idx_prompt_answers_owner ON prompt_answers(owner_type, owner_id);
CREATE INDEX idx_photos_owner ON photos(owner_type, owner_id);
CREATE INDEX idx_photos_primary ON photos(owner_type, owner_id, is_primary) WHERE is_primary = true;
CREATE INDEX idx_likes_from_user ON likes(from_user_id);
CREATE INDEX idx_likes_to_user ON likes(to_user_id);
CREATE INDEX idx_likes_target ON likes(target_type, target_id);
CREATE INDEX idx_matches_users ON matches(user_a, user_b);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Pets policies
CREATE POLICY "Public pets are viewable by everyone" ON pets
    FOR SELECT USING (true);

CREATE POLICY "Users can insert pets for themselves" ON pets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pets" ON pets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pets" ON pets
    FOR DELETE USING (auth.uid() = user_id);

-- Prompts policies (read-only for most users)
CREATE POLICY "Prompts are viewable by everyone" ON prompts
    FOR SELECT USING (true);

-- Prompt answers policies
CREATE POLICY "Public prompt answers are viewable by everyone" ON prompt_answers
    FOR SELECT USING (true);

CREATE POLICY "Users can insert prompt answers for their own profiles/pets" ON prompt_answers
    FOR INSERT WITH CHECK (
        (owner_type = 'human' AND owner_id = auth.uid()) OR
        (owner_type = 'pet' AND owner_id IN (SELECT id FROM pets WHERE user_id = auth.uid()))
    );

CREATE POLICY "Users can update their own prompt answers" ON prompt_answers
    FOR UPDATE USING (
        (owner_type = 'human' AND owner_id = auth.uid()) OR
        (owner_type = 'pet' AND owner_id IN (SELECT id FROM pets WHERE user_id = auth.uid()))
    );

CREATE POLICY "Users can delete their own prompt answers" ON prompt_answers
    FOR DELETE USING (
        (owner_type = 'human' AND owner_id = auth.uid()) OR
        (owner_type = 'pet' AND owner_id IN (SELECT id FROM pets WHERE user_id = auth.uid()))
    );

-- Photos policies
CREATE POLICY "Public photos are viewable by everyone" ON photos
    FOR SELECT USING (true);

CREATE POLICY "Users can insert photos for their own profiles/pets" ON photos
    FOR INSERT WITH CHECK (
        (owner_type = 'human' AND owner_id = auth.uid()) OR
        (owner_type = 'pet' AND owner_id IN (SELECT id FROM pets WHERE user_id = auth.uid()))
    );

CREATE POLICY "Users can update their own photos" ON photos
    FOR UPDATE USING (
        (owner_type = 'human' AND owner_id = auth.uid()) OR
        (owner_type = 'pet' AND owner_id IN (SELECT id FROM pets WHERE user_id = auth.uid()))
    );

CREATE POLICY "Users can delete their own photos" ON photos
    FOR DELETE USING (
        (owner_type = 'human' AND owner_id = auth.uid()) OR
        (owner_type = 'pet' AND owner_id IN (SELECT id FROM pets WHERE user_id = auth.uid()))
    );

-- Likes policies
CREATE POLICY "Users can view all likes" ON likes
    FOR SELECT USING (true);

CREATE POLICY "Users can only create likes from themselves" ON likes
    FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- Matches policies
CREATE POLICY "Users can view matches they are part of" ON matches
    FOR SELECT USING (auth.uid() IN (user_a, user_b));

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON pets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prompt_answers_updated_at BEFORE UPDATE ON prompt_answers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to ensure only one primary photo per owner
CREATE OR REPLACE FUNCTION ensure_single_primary_photo()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting a photo as primary, unset all other primary photos for the same owner
    IF NEW.is_primary = true THEN
        UPDATE photos 
        SET is_primary = false 
        WHERE owner_type = NEW.owner_type 
        AND owner_id = NEW.owner_id 
        AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER ensure_single_primary_photo_trigger BEFORE INSERT OR UPDATE ON photos
    FOR EACH ROW EXECUTE FUNCTION ensure_single_primary_photo();

-- ============================================================================
-- STORAGE BUCKETS
-- ============================================================================

-- Create photos bucket for file uploads (this needs to be run in Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);

-- ============================================================================
-- SAMPLE DATA (for development)
-- ============================================================================

-- Insert some sample prompts
INSERT INTO prompts (owner_type, text) VALUES
    ('human', 'My perfect Sunday involves...'),
    ('human', 'You should NOT go out with me if...'),
    ('human', 'My most irrational fear is...'),
    ('human', 'The way to my heart is...'),
    ('pet', 'My most embarrassing moment was...'),
    ('pet', 'My favorite toy is...'),
    ('pet', 'I once got in trouble for...'),
    ('pet', 'My superpower would be...');


