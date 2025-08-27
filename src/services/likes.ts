import { LikeRequest, LikeResponse, Like } from '@/types';
import { supabase } from '@/integrations/supabase/client';

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
    // TODO: Implement Supabase logic
    // 1. Insert like into likes table
    // 2. Check if reciprocal like exists
    // 3. If yes, create match and return matched: true
    
    return { ok: true, matched: false };
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
    // TODO: Implement pass logic (optional - may just not store passes)
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

  // TODO: Implement Supabase query
  return [];
};

export const fetchOutgoingLikes = async (): Promise<Like[]> => {
  if (USE_MOCKS) {
    await delay(1000);
    return []; // Mock empty for now
  }

  // TODO: Implement Supabase query
  return [];
};