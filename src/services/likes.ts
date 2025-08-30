import { LikeRequest, LikeResponse, Like } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuthStore } from '@/stores/useAuthStore';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const like = async (data: LikeRequest): Promise<LikeResponse> => {
  if (USE_MOCKS) {
    await delay(800);
    // Simulate random match chance (20%)
    const matched = Math.random() < 0.2;
    return {
      ok: true,
      matched,
      matchId: matched ? 'mock-match-id' : undefined
    };
  }

  try {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
      return { ok: false, matched: false, error: 'User not authenticated' };
    }

    // Prevent self-likes
    if (currentUser.id === data.toUserId) {
      return { ok: false, matched: false, error: 'Cannot like yourself' };
    }

    // Insert the like
    console.log('🔥 Attempting to insert like:', {
      from_user_id: currentUser.id,
      to_user_id: data.toUserId,
      target_type: data.targetType,
      target_id: data.targetId,
      message: data.message
    });
    
    const { data: likeData, error: likeError } = await (supabase
      .from('likes') as any)
      .insert({
        from_user_id: currentUser.id,
        to_user_id: data.toUserId,
        target_type: data.targetType,
        target_id: data.targetId,
        message: data.message
      })
      .select()
      .single() as {
        data: Database['public']['Tables']['likes']['Row'] | null;
        error: any;
      };

    console.log('🔥 Like insert result:', { likeData, likeError });

    if (likeError) {
      // Handle duplicate like error
      if (likeError.code === '23505') {
        return { ok: false, matched: false, error: 'You have already liked this' };
      }
      return { ok: false, matched: false, error: likeError.message };
    }

    // Check for reciprocal like
    const { data: reciprocalLike, error: reciprocalError } = await supabase
      .from('likes')
      .select('id')
      .eq('from_user_id', data.toUserId)
      .eq('to_user_id', currentUser.id)
      .single() as {
        data: Database['public']['Tables']['likes']['Row'] | null;
        error: any;
      };

    if (reciprocalError && reciprocalError.code !== 'PGRST116') {
      // Error other than "no rows found"
      return { ok: false, matched: false, error: reciprocalError.message };
    }

    let matchId: string | undefined;
    let matched = false;

    if (reciprocalLike) {
      // Create a match!
      matched = true;
      
      // Ensure user_a < user_b for the unique constraint
      const userA = currentUser.id < data.toUserId ? currentUser.id : data.toUserId;
      const userB = currentUser.id < data.toUserId ? data.toUserId : currentUser.id;

      const { data: matchData, error: matchError } = await (supabase
        .from('matches') as any)
        .insert({
          user_a: userA,
          user_b: userB
        })
        .select()
        .single() as {
          data: Database['public']['Tables']['matches']['Row'] | null;
          error: any;
        };

      if (matchError) {
        // If the match already exists, that's fine
        if (matchError.code !== '23505') {
          console.error('Error creating match:', matchError);
        }
        // Still return that we found a match
        const { data: existingMatch } = await supabase
          .from('matches')
          .select('id')
          .eq('user_a', userA)
          .eq('user_b', userB)
          .single() as {
            data: Database['public']['Tables']['matches']['Row'] | null;
            error: any;
          };
        
        matchId = existingMatch?.id;
      } else {
        matchId = matchData.id;
      }
    }

    return {
      ok: true,
      matched,
      matchId
    };
  } catch (error) {
    return { ok: false, matched: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const pass = async (toUserId: string): Promise<{ ok: boolean; error?: string }> => {
  if (USE_MOCKS) {
    await delay(500);
    return { ok: true };
  }

  try {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
      return { ok: false, error: 'User not authenticated' };
    }

    // For now, we don't store passes - just return success
    // This could be implemented later for analytics or preventing re-showing passed profiles
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const fetchIncomingLikes = async (): Promise<Like[]> => {
  if (USE_MOCKS) {
    await delay(1000);
    return []; // Mock empty for now
  }

  try {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('likes')
      .select(`
        id,
        from_user_id,
        to_user_id,
        target_type,
        target_id,
        message,
        created_at,
        fromUser:profiles!from_user_id(
          id,
          display_name,
          age,
          height,
          sexuality,
          bio
        )
      `)
      .eq('to_user_id', currentUser.id)
      .order('created_at', { ascending: false }) as {
        data: any[] | null;
        error: any;
      };

    if (error) {
      throw error;
    }

    // Transform the data to match our Like type
    const likes: Like[] = data.map(like => ({
      id: like.id,
      fromUserId: like.from_user_id,
      toUserId: like.to_user_id,
      targetType: like.target_type as 'prompt' | 'profile',
      targetId: like.target_id,
      message: like.message,
      createdAt: like.created_at,
      fromUser: {
        id: like.fromUser.id,
        displayName: like.fromUser.display_name,
        age: like.fromUser.age,
        height: like.fromUser.height,
        sexuality: like.fromUser.sexuality,
        bio: like.fromUser.bio,
        photos: [], // We can fetch these separately if needed
        prompts: [] // We can fetch these separately if needed
      }
    }));

    return likes;
  } catch (error) {
    console.error('Error fetching incoming likes:', error);
    return [];
  }
};

export const fetchOutgoingLikes = async (): Promise<Like[]> => {
  if (USE_MOCKS) {
    await delay(1000);
    return []; // Mock empty for now
  }

  try {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('likes')
      .select(`
        id,
        from_user_id,
        to_user_id,
        target_type,
        target_id,
        message,
        created_at,
        toUser:profiles!to_user_id(
          id,
          display_name,
          age,
          height,
          sexuality,
          bio
        )
      `)
      .eq('from_user_id', currentUser.id)
      .order('created_at', { ascending: false }) as {
        data: any[] | null;
        error: any;
      };

    if (error) {
      throw error;
    }

    // Transform the data to match our Like type
    const likes: Like[] = data.map(like => ({
      id: like.id,
      fromUserId: like.from_user_id,
      toUserId: like.to_user_id,
      targetType: like.target_type as 'prompt' | 'profile',
      targetId: like.target_id,
      message: like.message,
      createdAt: like.created_at,
      fromUser: {
        id: like.toUser.id,
        displayName: like.toUser.display_name,
        age: like.toUser.age,
        height: like.toUser.height,
        sexuality: like.toUser.sexuality,
        bio: like.toUser.bio,
        photos: [], // We can fetch these separately if needed
        prompts: [] // We can fetch these separately if needed
      }
    }));

    return likes;
  } catch (error) {
    console.error('Error fetching outgoing likes:', error);
    return [];
  }
};