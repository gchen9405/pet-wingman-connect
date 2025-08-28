import { describe, it, expect, vi, beforeEach } from 'vitest';
import { like, pass } from '@/services/likes';
import { LikeRequest } from '@/types';

// Mock the Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn()
          }))
        }))
      }))
    }))
  }
}));

// Mock the auth store
vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({
      user: { id: 'test-user-1' }
    }))
  }
}));

// Set mock mode
vi.stubEnv('VITE_USE_MOCKS', 'false');

describe('Likes Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('like function', () => {
    const mockLikeRequest: LikeRequest = {
      toUserId: 'test-user-2',
      targetType: 'prompt',
      targetId: 'prompt-1',
      message: 'Great answer!'
    };

    it('should prevent self-likes', async () => {
      // Mock user trying to like themselves
      const { useAuthStore } = await import('@/stores/useAuthStore');
      vi.mocked(useAuthStore.getState).mockReturnValue({
        user: { id: 'test-user-1' }
      } as any);

      const result = await like({
        ...mockLikeRequest,
        toUserId: 'test-user-1' // Same as current user
      });

      expect(result.ok).toBe(false);
      expect(result.matched).toBe(false);
      expect(result.error).toBe('Cannot like yourself');
    });

    it('should handle duplicate likes', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Mock duplicate key error
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockRejectedValue({
            code: '23505',
            message: 'duplicate key value violates unique constraint'
          })
        })
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert
      } as any);

      const result = await like(mockLikeRequest);

      expect(result.ok).toBe(false);
      expect(result.matched).toBe(false);
      expect(result.error).toBe('You have already liked this');
    });

    it('should create a like without match when no reciprocal like exists', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Mock successful like insertion
      const mockLikeData = {
        id: 'like-1',
        from_user_id: 'test-user-1',
        to_user_id: 'test-user-2',
        target_type: 'prompt',
        target_id: 'prompt-1',
        message: 'Great answer!'
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockLikeData,
            error: null
          })
        })
      });

      // Mock no reciprocal like found
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockRejectedValue({
              code: 'PGRST116', // No rows found
              message: 'No rows found'
            })
          })
        })
      });

      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'likes') {
          return {
            insert: mockInsert,
            select: mockSelect
          } as any;
        }
        return {} as any;
      });

      const result = await like(mockLikeRequest);

      expect(result.ok).toBe(true);
      expect(result.matched).toBe(false);
      expect(result.matchId).toBeUndefined();
    });

    it('should create a match when reciprocal like exists', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Mock successful like insertion
      const mockLikeData = {
        id: 'like-1',
        from_user_id: 'test-user-1',
        to_user_id: 'test-user-2',
        target_type: 'prompt',
        target_id: 'prompt-1',
        message: 'Great answer!'
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockLikeData,
            error: null
          })
        })
      });

      // Mock reciprocal like found
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'reciprocal-like-1' },
              error: null
            })
          })
        })
      });

      // Mock match creation
      const mockMatchData = {
        id: 'match-1',
        user_a: 'test-user-1',
        user_b: 'test-user-2'
      };

      const mockMatchInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockMatchData,
            error: null
          })
        })
      });

      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'likes') {
          return {
            insert: mockInsert,
            select: mockSelect
          } as any;
        } else if (table === 'matches') {
          return {
            insert: mockMatchInsert
          } as any;
        }
        return {} as any;
      });

      const result = await like(mockLikeRequest);

      expect(result.ok).toBe(true);
      expect(result.matched).toBe(true);
      expect(result.matchId).toBe('match-1');
    });

    it('should handle existing matches gracefully', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Mock successful like insertion
      const mockLikeData = {
        id: 'like-1',
        from_user_id: 'test-user-1',
        to_user_id: 'test-user-2',
        target_type: 'prompt',
        target_id: 'prompt-1',
        message: 'Great answer!'
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockLikeData,
            error: null
          })
        })
      });

      // Mock reciprocal like found
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'reciprocal-like-1' },
              error: null
            })
          })
        })
      });

      // Mock duplicate match error, then successful existing match query
      const mockMatchInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockRejectedValue({
            code: '23505', // Duplicate key
            message: 'duplicate key value violates unique constraint'
          })
        })
      });

      const mockExistingMatchSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'existing-match-1' },
              error: null
            })
          })
        })
      });

      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'likes') {
          return {
            insert: mockInsert,
            select: mockSelect
          } as any;
        } else if (table === 'matches') {
          return {
            insert: mockMatchInsert,
            select: mockExistingMatchSelect
          } as any;
        }
        return {} as any;
      });

      const result = await like(mockLikeRequest);

      expect(result.ok).toBe(true);
      expect(result.matched).toBe(true);
      expect(result.matchId).toBe('existing-match-1');
    });

    it('should handle user ordering correctly for matches', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Test with user IDs that need reordering (user_a should be < user_b)
      const { useAuthStore } = await import('@/stores/useAuthStore');
      vi.mocked(useAuthStore.getState).mockReturnValue({
        user: { id: 'test-user-z' } // Alphabetically after test-user-2
      } as any);

      const mockLikeData = {
        id: 'like-1',
        from_user_id: 'test-user-z',
        to_user_id: 'test-user-2',
        target_type: 'prompt',
        target_id: 'prompt-1'
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockLikeData,
            error: null
          })
        })
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'reciprocal-like-1' },
              error: null
            })
          })
        })
      });

      let capturedMatchData: any;
      const mockMatchInsert = vi.fn().mockImplementation((data) => {
        capturedMatchData = data;
        return {
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'match-1', ...data },
              error: null
            })
          })
        };
      });

      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'likes') {
          return {
            insert: mockInsert,
            select: mockSelect
          } as any;
        } else if (table === 'matches') {
          return {
            insert: mockMatchInsert
          } as any;
        }
        return {} as any;
      });

      await like(mockLikeRequest);

      // Verify that user_a < user_b in the match data
      expect(capturedMatchData.user_a).toBe('test-user-2');
      expect(capturedMatchData.user_b).toBe('test-user-z');
      expect(capturedMatchData.user_a < capturedMatchData.user_b).toBe(true);
    });
  });

  describe('pass function', () => {
    it('should succeed for authenticated users', async () => {
      const result = await pass('test-user-2');

      expect(result.ok).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should fail for unauthenticated users', async () => {
      const { useAuthStore } = await import('@/stores/useAuthStore');
      vi.mocked(useAuthStore.getState).mockReturnValue({
        user: null
      } as any);

      const result = await pass('test-user-2');

      expect(result.ok).toBe(false);
      expect(result.error).toBe('User not authenticated');
    });
  });

  describe('Mock mode', () => {
    it('should work in mock mode', async () => {
      // Temporarily enable mock mode
      vi.stubEnv('VITE_USE_MOCKS', 'true');

      const result = await like({
        toUserId: 'test-user-2',
        targetType: 'prompt',
        targetId: 'prompt-1'
      });

      expect(result.ok).toBe(true);
      expect(typeof result.matched).toBe('boolean');
      
      // Reset to non-mock mode
      vi.stubEnv('VITE_USE_MOCKS', 'false');
    });
  });
});


