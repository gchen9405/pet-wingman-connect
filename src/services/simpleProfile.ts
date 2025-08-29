import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export interface SimpleUser {
  id: string;
  displayName: string;
  age?: number;
  height?: string;
  sexuality?: string;
  bio?: string;
}

export const getSimpleProfile = async (userId: string): Promise<{ user?: SimpleUser; error?: string }> => {
  try {
    console.log('Fetching simple profile for:', userId);
    
    // First, test basic connection
    console.log('Testing basic connection...');
    const connectionTest = await supabase.from('profiles').select('count').limit(1);
    console.log('Connection test result:', connectionTest);
    
    // Test if we can find any profiles at all
    console.log('Testing profile table access...');
    const allProfilesTest = await supabase.from('profiles').select('id').limit(5);
    console.log('All profiles test:', allProfilesTest);
    
    // Try to fetch our specific profile with timeout
    console.log('Fetching specific profile...');
    
    const profilePromise = supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    // Add our own timeout to the query
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Query timeout after 5 seconds')), 5000);
    });
    
    const result = await Promise.race([profilePromise, timeoutPromise]);
    console.log('Profile query completed:', result);
    
    const { data: profile, error: profileError } = result as any;

    if (profileError) {
      console.error('Profile error:', profileError);
      return { error: profileError.message };
    }

    if (!profile) {
      return { error: 'Profile not found' };
    }

    const user: SimpleUser = {
      id: profile.id,
      displayName: profile.display_name,
      age: profile.age,
      height: profile.height,
      sexuality: profile.sexuality,
      bio: profile.bio,
    };

    console.log('Returning user:', user);
    return { user };
  } catch (error) {
    console.error('Unexpected error in getSimpleProfile:', error);
    return { error: `Failed to fetch profile: ${error}` };
  }
};

export const updateSimpleProfile = async (userId: string, profileData: Partial<SimpleUser>): Promise<{ user?: SimpleUser; error?: string }> => {
  try {
    console.log('Updating/creating profile for:', userId, profileData);
    
    const profileData_db: Database['public']['Tables']['profiles']['Insert'] = {
      id: userId,
      display_name: profileData.displayName || '',
      age: profileData.age,
      height: profileData.height,
      sexuality: profileData.sexuality,
      bio: profileData.bio,
    };

    // Use upsert to handle both create and update cases
    const { data: upsertedProfile, error } = await (supabase
      .from('profiles') as any)
      .upsert([profileData_db], { onConflict: 'id' })
      .select()
      .single();

    console.log('Upsert result:', { upsertedProfile, error });

    if (error) {
      return { error: error.message };
    }

    if (!upsertedProfile) {
      return { error: 'Failed to save profile' };
    }

    const user: SimpleUser = {
      id: upsertedProfile.id,
      displayName: upsertedProfile.display_name,
      age: upsertedProfile.age,
      height: upsertedProfile.height,
      sexuality: upsertedProfile.sexuality,
      bio: upsertedProfile.bio,
    };

    return { user };
  } catch (error) {
    console.error('Unexpected error in updateSimpleProfile:', error);
    return { error: 'Failed to save profile' };
  }
};
