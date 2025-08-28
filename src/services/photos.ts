import { supabase } from '@/integrations/supabase/client';
import { Photo } from '@/types';
import { useAuthStore } from '@/stores/useAuthStore';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const upload = async (file: File, { ownerType, ownerId }: { ownerType: 'human' | 'pet'; ownerId: string }): Promise<{ path?: string; error?: string }> => {
  if (USE_MOCKS) {
    await delay(2000); // Simulate upload time
    return { path: `/mock/photos/${file.name}` };
  }

  try {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
      return { error: 'User not authenticated' };
    }

    // Verify ownership
    if (ownerType === 'human' && ownerId !== currentUser.id) {
      return { error: 'Unauthorized: Cannot upload photos for another user' };
    }
    
    if (ownerType === 'pet') {
      const { data: pet } = await supabase
        .from('pets')
        .select('user_id')
        .eq('id', ownerId)
        .single();
      
      if (!pet || pet.user_id !== currentUser.id) {
        return { error: 'Unauthorized: Cannot upload photos for a pet you do not own' };
      }
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${currentUser.id}/${ownerType}/${ownerId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    if (error) {
      return { error: error.message };
    }

    return { path: data.path };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Upload failed' };
  }
};

export const save = async (photoData: {
  ownerType: 'human' | 'pet';
  ownerId: string;
  path: string;
  isPrimary?: boolean;
}): Promise<{ photo?: Photo; error?: string }> => {
  if (USE_MOCKS) {
    await delay(500);
    return {
      photo: {
        id: Math.random().toString(36).substring(2),
        ...photoData,
        createdAt: new Date().toISOString()
      }
    };
  }

  try {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
      return { error: 'User not authenticated' };
    }

    // Verify ownership
    if (photoData.ownerType === 'human' && photoData.ownerId !== currentUser.id) {
      return { error: 'Unauthorized: Cannot save photos for another user' };
    }
    
    if (photoData.ownerType === 'pet') {
      const { data: pet } = await supabase
        .from('pets')
        .select('user_id')
        .eq('id', photoData.ownerId)
        .single();
      
      if (!pet || pet.user_id !== currentUser.id) {
        return { error: 'Unauthorized: Cannot save photos for a pet you do not own' };
      }
    }

    // If setting as primary, unset other primary photos for the same owner
    if (photoData.isPrimary) {
      await supabase
        .from('photos')
        .update({ is_primary: false })
        .eq('owner_type', photoData.ownerType)
        .eq('owner_id', photoData.ownerId);
    }

    const { data, error } = await supabase
      .from('photos')
      .insert({
        owner_type: photoData.ownerType,
        owner_id: photoData.ownerId,
        path: photoData.path,
        is_primary: photoData.isPrimary || false
      })
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    const photo: Photo = {
      id: data.id,
      ownerType: data.owner_type as 'human' | 'pet',
      ownerId: data.owner_id,
      path: data.path,
      isPrimary: data.is_primary,
      createdAt: data.created_at
    };

    return { photo };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Save failed' };
  }
};

export const deletePhoto = async (photoId: string): Promise<{ error?: string }> => {
  if (USE_MOCKS) {
    await delay(500);
    return {};
  }

  try {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
      return { error: 'User not authenticated' };
    }

    // First, get the photo to verify ownership and get the storage path
    const { data: photo, error: fetchError } = await supabase
      .from('photos')
      .select(`
        *,
        pets!owner_id(user_id)
      `)
      .eq('id', photoId)
      .single();

    if (fetchError) {
      return { error: fetchError.message };
    }

    if (!photo) {
      return { error: 'Photo not found' };
    }

    // Verify ownership
    const isOwner = 
      (photo.owner_type === 'human' && photo.owner_id === currentUser.id) ||
      (photo.owner_type === 'pet' && photo.pets && photo.pets.user_id === currentUser.id);

    if (!isOwner) {
      return { error: 'Unauthorized: Cannot delete a photo you do not own' };
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('photos')
      .remove([photo.path]);

    if (storageError) {
      console.warn('Failed to delete file from storage:', storageError.message);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('photos')
      .delete()
      .eq('id', photoId);

    if (deleteError) {
      return { error: deleteError.message };
    }

    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Delete failed' };
  }
};

export const getPublicUrl = (path: string): string => {
  if (USE_MOCKS) {
    return `/api/placeholder/400/400?text=${encodeURIComponent(path)}`;
  }

  const { data } = supabase.storage.from('photos').getPublicUrl(path);
  return data.publicUrl;
};