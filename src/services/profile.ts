import { User, Pet, PromptAnswer } from '@/types';
import { supabase } from '@/integrations/supabase/client';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
    // TODO: Implement Supabase insert
    return { error: 'Not implemented' };
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
    // TODO: Implement Supabase insert
    return { error: 'Not implemented' };
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
    // TODO: Implement Supabase update
    return { error: 'Not implemented' };
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
    // TODO: Implement Supabase update
    return { error: 'Not implemented' };
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
    // TODO: Implement Supabase insert
    return { error: 'Not implemented' };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Prompt answer save failed' };
  }
};