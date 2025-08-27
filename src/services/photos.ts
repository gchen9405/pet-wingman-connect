import { supabase } from '@/integrations/supabase/client';
import { Photo } from '@/types';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const upload = async (file: File): Promise<{ path?: string; error?: string }> => {
  if (USE_MOCKS) {
    await delay(2000); // Simulate upload time
    return { path: `/mock/photos/${file.name}` };
  }

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = fileName;

    const { data, error } = await supabase.storage
      .from('photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
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
    // TODO: Implement Supabase insert
    // const { data, error } = await supabase
    //   .from('photos')
    //   .insert(photoData)
    //   .select()
    //   .single();

    return { photo: undefined, error: 'Not implemented' };
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
    // TODO: Implement Supabase delete
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