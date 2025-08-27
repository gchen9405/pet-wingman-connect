import { useEffect } from 'react';
import { useFeedStore } from '@/stores/useFeedStore';
import { fetchNextCards } from '@/services/feed';
import { Button } from '@/components/ui/button';
import { Heart, X } from 'lucide-react';

const Feed = () => {
  const { cards, currentIndex, setCards } = useFeedStore();

  useEffect(() => {
    fetchNextCards().then(setCards);
  }, [setCards]);

  const currentCard = cards[currentIndex];

  if (!currentCard) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No more profiles</h2>
          <p className="text-muted-foreground">Check back later for new matches!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-sm mx-auto">
        <div className="bg-card rounded-2xl shadow-lg p-6 mb-6">
          <div className="mb-4">
            <h3 className="text-xl font-semibold">{currentCard.user.displayName}, {currentCard.user.age}</h3>
            <p className="text-muted-foreground">{currentCard.user.bio}</p>
          </div>
          
          <div className="border-t pt-4">
            <h4 className="text-lg font-medium mb-2">Meet {currentCard.pet.name}</h4>
            <p className="text-muted-foreground">{currentCard.pet.bio}</p>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <Button variant="outline" size="lg" className="rounded-full">
            <X className="h-6 w-6" />
          </Button>
          <Button size="lg" className="rounded-full">
            <Heart className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Feed;