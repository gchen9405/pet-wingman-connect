import { useEffect, useState } from 'react';
import { useFeedStore } from '@/stores/useFeedStore';
import { fetchNextCards } from '@/services/feed';
import { SwipeDeck } from '@/components/SwipeDeck';
import { MatchModal } from '@/components/MatchModal';
import { BottomTabBar } from '@/components/BottomTabBar';
import { Button } from '@/components/ui/button';
import { ProfileWithPet, Match } from '@/types';
import { Undo2, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { signOut } from '@/services/auth';
import { useAuthStore } from '@/stores/useAuthStore';

const Feed = () => {
  const { cards, currentIndex, setCards, lastAction, undoLastAction, clearLastAction } = useFeedStore();
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const { toast } = useToast();
  const { clearAuth } = useAuthStore();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      clearAuth();
      toast({
        title: 'Signed out',
        description: 'You have been signed out successfully',
      });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to sign out',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (cards.length === 0) {
      fetchNextCards().then(setCards);
    }
  }, [cards.length, setCards]);

  // Load more cards when running low
  useEffect(() => {
    if (cards.length - currentIndex <= 2) {
      fetchNextCards(Math.floor(currentIndex / 10) + 1).then(newCards => {
        if (newCards.length > 0) {
          setCards([...cards, ...newCards]);
        }
      });
    }
  }, [currentIndex, cards, setCards]);

  const handleLike = (profile: ProfileWithPet) => {
    // Mock match logic - in real app, this would come from the API
    const isMatch = Math.random() < 0.2; // 20% chance
    if (isMatch) {
      const match: Match = {
        id: 'match-' + Date.now(),
        userId1: 'current-user',
        userId2: profile.user.id,
        createdAt: new Date().toISOString(),
        user1: profile.user, // In real app, get current user
        user2: profile.user,
      };
      setCurrentMatch(match);
    }
  };

  const handlePass = (profile: ProfileWithPet) => {
    // Handle pass action if needed
  };

  const handleUndo = () => {
    undoLastAction();
    toast({
      title: 'Undone',
      description: `Undid your ${lastAction?.type}`,
    });
    clearLastAction();
  };

  const currentCard = cards[currentIndex];

  if (!currentCard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No more profiles</h2>
          <p className="text-muted-foreground">Check back later for new matches!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="max-w-sm mx-auto space-y-4 p-4">
        {/* Header with undo and sign out buttons */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Discover</h1>
          <div className="flex gap-2">
            {lastAction && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                className="gap-2"
              >
                <Undo2 className="h-4 w-4" />
                Undo {lastAction.type}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Swipe deck */}
        <SwipeDeck
          cards={cards}
          currentIndex={currentIndex}
          onLike={handleLike}
          onPass={handlePass}
        />

        {/* Match modal */}
        <MatchModal
          match={currentMatch}
          isOpen={!!currentMatch}
          onClose={() => setCurrentMatch(null)}
        />
      </div>

      <BottomTabBar />
    </div>
  );
};

export default Feed;