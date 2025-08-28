import { describe, it, expect } from 'vitest';

// Test the match logic decision function
export const shouldCreateMatch = (
  currentUserId: string,
  targetUserId: string,
  reciprocalLikeExists: boolean
): { shouldMatch: boolean; userA: string; userB: string } => {
  if (!reciprocalLikeExists) {
    return {
      shouldMatch: false,
      userA: '',
      userB: ''
    };
  }

  // Ensure consistent ordering for the unique constraint
  const userA = currentUserId < targetUserId ? currentUserId : targetUserId;
  const userB = currentUserId < targetUserId ? targetUserId : currentUserId;

  return {
    shouldMatch: true,
    userA,
    userB
  };
};

describe('Match Logic', () => {
  describe('shouldCreateMatch', () => {
    it('should not create match when no reciprocal like exists', () => {
      const result = shouldCreateMatch('user1', 'user2', false);
      
      expect(result.shouldMatch).toBe(false);
      expect(result.userA).toBe('');
      expect(result.userB).toBe('');
    });

    it('should create match when reciprocal like exists', () => {
      const result = shouldCreateMatch('user1', 'user2', true);
      
      expect(result.shouldMatch).toBe(true);
      expect(result.userA).toBe('user1');
      expect(result.userB).toBe('user2');
    });

    it('should order users correctly (userA < userB)', () => {
      // Test with users in alphabetical order
      const result1 = shouldCreateMatch('alice', 'bob', true);
      expect(result1.userA).toBe('alice');
      expect(result1.userB).toBe('bob');

      // Test with users in reverse alphabetical order
      const result2 = shouldCreateMatch('bob', 'alice', true);
      expect(result2.userA).toBe('alice');
      expect(result2.userB).toBe('bob');

      // Test with UUIDs
      const uuid1 = '123e4567-e89b-12d3-a456-426614174000';
      const uuid2 = '987fcdeb-51a2-43d1-9f01-234567890abc';
      
      const result3 = shouldCreateMatch(uuid1, uuid2, true);
      expect(result3.userA).toBe(uuid1); // uuid1 < uuid2
      expect(result3.userB).toBe(uuid2);

      const result4 = shouldCreateMatch(uuid2, uuid1, true);
      expect(result4.userA).toBe(uuid1); // Still uuid1 < uuid2
      expect(result4.userB).toBe(uuid2);
    });

    it('should handle identical user IDs (edge case)', () => {
      // This shouldn't happen in practice due to self-like prevention
      const result = shouldCreateMatch('user1', 'user1', true);
      
      expect(result.shouldMatch).toBe(true);
      expect(result.userA).toBe('user1');
      expect(result.userB).toBe('user1');
    });

    it('should be deterministic regardless of call order', () => {
      const user1 = 'test-user-alpha';
      const user2 = 'test-user-beta';

      const result1 = shouldCreateMatch(user1, user2, true);
      const result2 = shouldCreateMatch(user2, user1, true);

      expect(result1.userA).toBe(result2.userA);
      expect(result1.userB).toBe(result2.userB);
      expect(result1.shouldMatch).toBe(result2.shouldMatch);
    });
  });

  describe('Match prevention scenarios', () => {
    it('should prevent duplicate likes on same target', () => {
      // This is tested at the database level via unique constraints
      // Here we test the logical prevention
      const existingLikes = [
        {
          fromUserId: 'user1',
          toUserId: 'user2',
          targetType: 'prompt',
          targetId: 'prompt123'
        }
      ];

      const newLike = {
        fromUserId: 'user1',
        toUserId: 'user2',
        targetType: 'prompt',
        targetId: 'prompt123'
      };

      const isDuplicate = existingLikes.some(like => 
        like.fromUserId === newLike.fromUserId &&
        like.toUserId === newLike.toUserId &&
        like.targetType === newLike.targetType &&
        like.targetId === newLike.targetId
      );

      expect(isDuplicate).toBe(true);
    });

    it('should allow different target types for same users', () => {
      const existingLikes = [
        {
          fromUserId: 'user1',
          toUserId: 'user2',
          targetType: 'prompt',
          targetId: 'prompt123'
        }
      ];

      const newLike = {
        fromUserId: 'user1',
        toUserId: 'user2',
        targetType: 'profile', // Different target type
        targetId: 'profile456'
      };

      const isDuplicate = existingLikes.some(like => 
        like.fromUserId === newLike.fromUserId &&
        like.toUserId === newLike.toUserId &&
        like.targetType === newLike.targetType &&
        like.targetId === newLike.targetId
      );

      expect(isDuplicate).toBe(false);
    });

    it('should allow same target for different users', () => {
      const existingLikes = [
        {
          fromUserId: 'user1',
          toUserId: 'user2',
          targetType: 'prompt',
          targetId: 'prompt123'
        }
      ];

      const newLike = {
        fromUserId: 'user3', // Different user
        toUserId: 'user2',
        targetType: 'prompt',
        targetId: 'prompt123'
      };

      const isDuplicate = existingLikes.some(like => 
        like.fromUserId === newLike.fromUserId &&
        like.toUserId === newLike.toUserId &&
        like.targetType === newLike.targetType &&
        like.targetId === newLike.targetId
      );

      expect(isDuplicate).toBe(false);
    });
  });

  describe('Match uniqueness', () => {
    it('should prevent duplicate matches between same users', () => {
      const existingMatches = [
        { userA: 'alice', userB: 'bob' }
      ];

      const newMatchAttempt = { userA: 'alice', userB: 'bob' };
      
      const isDuplicateMatch = existingMatches.some(match =>
        match.userA === newMatchAttempt.userA &&
        match.userB === newMatchAttempt.userB
      );

      expect(isDuplicateMatch).toBe(true);
    });

    it('should detect reverse matches as duplicates', () => {
      const existingMatches = [
        { userA: 'alice', userB: 'bob' }
      ];

      // This should be normalized to alice/bob order before checking
      const newMatchAttempt = shouldCreateMatch('bob', 'alice', true);
      
      const isDuplicateMatch = existingMatches.some(match =>
        match.userA === newMatchAttempt.userA &&
        match.userB === newMatchAttempt.userB
      );

      expect(isDuplicateMatch).toBe(true);
    });
  });
});


