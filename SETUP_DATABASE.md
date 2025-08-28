# Database Setup Instructions

## Apply Database Schema to Supabase

You need to execute the database schema in your Supabase project to create the necessary tables for the auth system to work properly.

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/gxghhevwlwfpjvlcuspq
2. Navigate to the "SQL Editor" in the left sidebar
3. Create a new query
4. Copy the entire content from `docs/schema.sql` 
5. Paste it into the SQL editor
6. Click "Run" to execute the schema

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Navigate to your project directory
cd /Users/gc/pet-wingman-connect

# Apply the schema
supabase db reset --linked
# OR
supabase db push
```

### What the Schema Creates

The schema will create these essential tables:
- `profiles` - User profile information (linked to auth.users)
- `pets` - Pet information for each user
- `prompts` - Standard prompts for the app
- `prompt_answers` - User/pet responses to prompts
- `photos` - User and pet photos
- `likes` - User interactions (likes)
- `matches` - Mutual likes between users

### Row Level Security (RLS)

The schema also sets up Row Level Security policies that ensure:
- Users can only edit their own profiles and pets
- Users can view all public profiles and content
- Proper access control for likes and matches

### After Schema Application

Once you've applied the schema:
1. Your auth system will automatically create profile records when users sign up
2. Tables will appear in your Supabase dashboard
3. You can test the full flow: sign up → email confirmation → profile creation

### Troubleshooting

If you see errors when applying the schema:
1. **"cannot use subquery in check constraint"** - This has been fixed by replacing CHECK constraints with triggers
2. **Missing tables** - Verify the schema was applied successfully in Supabase dashboard → Database → Tables
3. **RLS errors** - Check that all tables listed above are present and RLS policies are enabled (shield icons next to table names)

### Schema Changes Made

The schema has been updated to work with PostgreSQL constraints:
- ✅ Removed problematic CHECK constraints that used subqueries
- ✅ Replaced with validation triggers for data integrity
- ✅ Changed `IN (SELECT...)` to `EXISTS (SELECT 1...)` in RLS policies for better performance
- ✅ Added proper trigger-based validation for owner_id references

### Sample Data

The schema includes sample prompts. After applying the schema, you should see prompts like:
- "My perfect Sunday involves..."
- "The way to my heart is..."
- etc.

These will be used in the app's prompt system for user and pet profiles.
