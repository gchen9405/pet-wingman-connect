import { User, Pet, PromptAnswer } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuthStore } from '@/stores/useAuthStore';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getProfile = async (userId: string): Promise<{ user?: User; error?: string }> => {
  if (USE_MOCKS) {
    await delay(800);
    return {
      user: {
        id: userId,
        displayName: 'Mock User',
        age: 25,
        height: '5\'8"',
        sexuality: 'Straight',
        bio: 'Mock bio',
        photos: [],
        prompts: []
      }
    };
  }

  try {
    // Fetch the profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      return { error: profileError.message };
    }

    if (!profile) {
      return { error: 'Profile not found' };
    }

    // Fetch photos and prompt answers for the user
    const [photosResult, promptsResult] = await Promise.all([
      supabase.from('photos').select('*').eq('owner_type', 'human').eq('owner_id', userId),
      supabase.from('prompt_answers').select('*').eq('owner_type', 'human').eq('owner_id', userId)
    ]);

    const user: User = {
      id: profile.id,
      displayName: profile.display_name,
      age: profile.age,
      height: profile.height,
      sexuality: profile.sexuality,
      bio: profile.bio,
      photos: photosResult.data?.map(p => ({
        id: p.id,
        ownerType: p.owner_type as 'human' | 'pet',
        ownerId: p.owner_id,
        path: p.path,
        isPrimary: p.is_primary,
        createdAt: p.created_at
      })) || [],
      prompts: promptsResult.data?.map(pa => ({
        id: pa.id,
        ownerType: pa.owner_type as 'human' | 'pet',
        ownerId: pa.owner_id,
        promptId: pa.prompt_id,
        answerText: pa.answer_text
      })) || []
    };

    return { user };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to fetch profile' };
  }
};

export const createUserProfile = async (profileData: Omit<User, 'id' | 'photos' | 'prompts'>): Promise<{ user?: User; error?: string }> => {
  if (USE_MOCKS) {
    await delay(1000);
    return {
      user: {
        id: 'mock-user-id',
        ...profileData,
        photos: [],
        prompts: []
      }
    };
  }

  try {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
      return { error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: currentUser.id,
        display_name: profileData.displayName,
        age: profileData.age,
        height: profileData.height,
        sexuality: profileData.sexuality,
        bio: profileData.bio
      })
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    const user: User = {
      id: data.id,
      displayName: data.display_name,
      age: data.age,
      height: data.height,
      sexuality: data.sexuality,
      bio: data.bio,
      photos: [],
      prompts: []
    };

    return { user };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Profile creation failed' };
  }
};

export const createPetProfile = async (petData: Omit<Pet, 'id' | 'photos' | 'prompts'>): Promise<{ pet?: Pet; error?: string }> => {
  if (USE_MOCKS) {
    await delay(1000);
    return {
      pet: {
        id: 'mock-pet-id',
        ...petData,
        photos: [],
        prompts: []
      }
    };
  }

  try {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
      return { error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('pets')
      .insert({
        user_id: currentUser.id,
        name: petData.name,
        age: petData.age,
        weight: petData.weight,
        breed: petData.breed,
        bio: petData.bio
      })
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    const pet: Pet = {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      age: data.age,
      weight: data.weight,
      breed: data.breed,
      bio: data.bio,
      photos: [],
      prompts: []
    };

    return { pet };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Pet profile creation failed' };
  }
};

export const updateUserProfile = async (userId: string, profileData: Partial<User>): Promise<{ user?: User; error?: string }> => {
  if (USE_MOCKS) {
    await delay(800);
    return { user: profileData as User };
  }

  try {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser || currentUser.id !== userId) {
      return { error: 'Unauthorized' };
    }

    const updateData: any = {};
    if (profileData.displayName !== undefined) updateData.display_name = profileData.displayName;
    if (profileData.age !== undefined) updateData.age = profileData.age;
    if (profileData.height !== undefined) updateData.height = profileData.height;
    if (profileData.sexuality !== undefined) updateData.sexuality = profileData.sexuality;
    if (profileData.bio !== undefined) updateData.bio = profileData.bio;

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    // Fetch the complete user profile with photos and prompts
    const completeUser = await getProfile(userId);
    if (completeUser.error) {
      return { error: completeUser.error };
    }

    return { user: completeUser.user };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Profile update failed' };
  }
};

export const updatePetProfile = async (petId: string, petData: Partial<Pet>): Promise<{ pet?: Pet; error?: string }> => {
  if (USE_MOCKS) {
    await delay(800);
    return { pet: petData as Pet };
  }

  try {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
      return { error: 'User not authenticated' };
    }

    const updateData: any = {};
    if (petData.name !== undefined) updateData.name = petData.name;
    if (petData.age !== undefined) updateData.age = petData.age;
    if (petData.weight !== undefined) updateData.weight = petData.weight;
    if (petData.breed !== undefined) updateData.breed = petData.breed;
    if (petData.bio !== undefined) updateData.bio = petData.bio;

    const { data, error } = await supabase
      .from('pets')
      .update(updateData)
      .eq('id', petId)
      .eq('user_id', currentUser.id) // Ensure user owns the pet
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    // Fetch photos and prompts for the pet
    const [photosResult, promptsResult] = await Promise.all([
      supabase.from('photos').select('*').eq('owner_type', 'pet').eq('owner_id', petId),
      supabase.from('prompt_answers').select('*').eq('owner_type', 'pet').eq('owner_id', petId)
    ]);

    const pet: Pet = {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      age: data.age,
      weight: data.weight,
      breed: data.breed,
      bio: data.bio,
      photos: photosResult.data?.map(p => ({
        id: p.id,
        ownerType: p.owner_type as 'human' | 'pet',
        ownerId: p.owner_id,
        path: p.path,
        isPrimary: p.is_primary,
        createdAt: p.created_at
      })) || [],
      prompts: promptsResult.data?.map(pa => ({
        id: pa.id,
        ownerType: pa.owner_type as 'human' | 'pet',
        ownerId: pa.owner_id,
        promptId: pa.prompt_id,
        answerText: pa.answer_text
      })) || []
    };

    return { pet };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Pet profile update failed' };
  }
};

export const savePromptAnswer = async (answerData: Omit<PromptAnswer, 'id'>): Promise<{ answer?: PromptAnswer; error?: string }> => {
  if (USE_MOCKS) {
    await delay(500);
    return {
      answer: {
        id: Math.random().toString(36).substring(2),
        ...answerData
      }
    };
  }

  try {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
      return { error: 'User not authenticated' };
    }

    // Verify ownership of the owner_id
    if (answerData.ownerType === 'human' && answerData.ownerId !== currentUser.id) {
      return { error: 'Unauthorized: Cannot save prompt answer for another user' };
    }
    
    if (answerData.ownerType === 'pet') {
      const { data: pet } = await supabase
        .from('pets')
        .select('user_id')
        .eq('id', answerData.ownerId)
        .single();
      
      if (!pet || pet.user_id !== currentUser.id) {
        return { error: 'Unauthorized: Cannot save prompt answer for a pet you do not own' };
      }
    }

    // Check if answer already exists
    const { data: existing } = await supabase
      .from('prompt_answers')
      .select('id')
      .eq('owner_type', answerData.ownerType)
      .eq('owner_id', answerData.ownerId)
      .eq('prompt_id', answerData.promptId)
      .single();

    let result;
    if (existing) {
      // Update existing answer
      result = await supabase
        .from('prompt_answers')
        .update({ answer_text: answerData.answerText })
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      // Insert new answer
      result = await supabase
        .from('prompt_answers')
        .insert({
          owner_type: answerData.ownerType,
          owner_id: answerData.ownerId,
          prompt_id: answerData.promptId,
          answer_text: answerData.answerText
        })
        .select()
        .single();
    }

    const { data, error } = result;
    if (error) {
      return { error: error.message };
    }

    const answer: PromptAnswer = {
      id: data.id,
      ownerType: data.owner_type as 'human' | 'pet',
      ownerId: data.owner_id,
      promptId: data.prompt_id,
      answerText: data.answer_text
    };

    return { answer };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Prompt answer save failed' };
  }
};