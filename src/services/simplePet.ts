import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export interface SimplePet {
  id: string;
  userId: string;
  name: string;
  age?: number;
  weight?: string;
  breed?: string;
  bio?: string;
}

export const getUserPets = async (userId: string): Promise<{ pets?: SimplePet[]; error?: string }> => {
  try {
    console.log('Fetching pets for user:', userId);
    
    // Add timeout to prevent hanging
    const petsPromise = supabase
      .from('pets')
      .select('*')
      .eq('user_id', userId);
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Query timeout after 3 seconds')), 3000);
    });
    
    const result = await Promise.race([petsPromise, timeoutPromise]);
    console.log('Pets query result:', result);
    
    const { data: pets, error } = result as any;

    if (error) {
      console.error('Pets error:', error);
      return { error: error.message };
    }

    const simplePets: SimplePet[] = (pets || []).map((pet: any) => ({
      id: pet.id,
      userId: pet.user_id,
      name: pet.name,
      age: pet.age,
      weight: pet.weight,
      breed: pet.breed,
      bio: pet.bio,
    }));

    console.log('Returning pets:', simplePets);
    return { pets: simplePets };
  } catch (error) {
    console.error('Unexpected error in getUserPets:', error);
    return { error: `Failed to fetch pets: ${error}` };
  }
};

export const createPet = async (userId: string, petData: Omit<SimplePet, 'id' | 'userId'>): Promise<{ pet?: SimplePet; error?: string }> => {
  try {
    console.log('Creating pet for user:', userId, petData);
    
    const petData_db: Database['public']['Tables']['pets']['Insert'] = {
      user_id: userId,
      name: petData.name,
      age: petData.age,
      weight: petData.weight,
      breed: petData.breed,
      bio: petData.bio,
    };

    const { data: createdPet, error } = await (supabase
      .from('pets') as any)
      .insert([petData_db])
      .select()
      .single();

    console.log('Create pet result:', { createdPet, error });

    if (error) {
      return { error: error.message };
    }

    if (!createdPet) {
      return { error: 'Failed to create pet' };
    }

    const pet: SimplePet = {
      id: createdPet.id,
      userId: createdPet.user_id,
      name: createdPet.name,
      age: createdPet.age,
      weight: createdPet.weight,
      breed: createdPet.breed,
      bio: createdPet.bio,
    };

    return { pet };
  } catch (error) {
    console.error('Unexpected error in createPet:', error);
    return { error: 'Failed to create pet' };
  }
};

export const updatePet = async (petId: string, petData: Partial<Omit<SimplePet, 'id' | 'userId'>>): Promise<{ pet?: SimplePet; error?: string }> => {
  try {
    console.log('Updating pet:', petId, petData);
    
    const updateData: Database['public']['Tables']['pets']['Update'] = {};
    
    if (petData.name !== undefined) updateData.name = petData.name;
    if (petData.age !== undefined) updateData.age = petData.age;
    if (petData.weight !== undefined) updateData.weight = petData.weight;
    if (petData.breed !== undefined) updateData.breed = petData.breed;
    if (petData.bio !== undefined) updateData.bio = petData.bio;

    const { data: updatedPet, error } = await (supabase
      .from('pets') as any)
      .update(updateData)
      .eq('id', petId)
      .select()
      .single();

    console.log('Update pet result:', { updatedPet, error });

    if (error) {
      return { error: error.message };
    }

    if (!updatedPet) {
      return { error: 'Failed to update pet' };
    }

    const pet: SimplePet = {
      id: updatedPet.id,
      userId: updatedPet.user_id,
      name: updatedPet.name,
      age: updatedPet.age,
      weight: updatedPet.weight,
      breed: updatedPet.breed,
      bio: updatedPet.bio,
    };

    return { pet };
  } catch (error) {
    console.error('Unexpected error in updatePet:', error);
    return { error: 'Failed to update pet' };
  }
};

export const deletePet = async (petId: string): Promise<{ error?: string }> => {
  try {
    console.log('Deleting pet:', petId);
    
    const { error } = await supabase
      .from('pets')
      .delete()
      .eq('id', petId);

    if (error) {
      return { error: error.message };
    }

    return {};
  } catch (error) {
    console.error('Unexpected error in deletePet:', error);
    return { error: 'Failed to delete pet' };
  }
};
