import { useState, useRef } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { Heart, X } from 'lucide-react';
import { ProfileWithPet } from '@/types';
import { ProfileCard } from './ProfileCard';
import { useFeedStore } from '@/stores/useFeedStore';
import { like, pass } from '@/services/likes';
import { useToast } from '@/hooks/use-toast';

interface SwipeDeckProps {
  cards: ProfileWithPet[];
  currentIndex: number;
  onLike: (profile: ProfileWithPet) => void;
  onPass: (profile: ProfileWithPet) => void;
}

export const SwipeDeck = ({ cards, currentIndex, onLike, onPass }: SwipeDeckProps) => {
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null);
  const { nextCard, setLastAction } = useFeedStore();
  const { toast } = useToast();
  const constraintsRef = useRef(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const currentCard = cards[currentIndex];
  const nextCardData = cards[currentIndex + 1];

  if (!currentCard) return null;

  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x > threshold) {
      setDragDirection('right');
    } else if (info.offset.x < -threshold) {
      setDragDirection('left');
    } else {
      setDragDirection(null);
    }
  };

  const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    const velocity = info.velocity.x;
    const offset = info.offset.x;

    if (Math.abs(velocity) >= 500 || Math.abs(offset) >= threshold) {
      const direction = velocity > 0 || offset > 0 ? 'right' : 'left';
      
      if (direction === 'right') {
        handleLike();
      } else {
        handlePass();
      }
    } else {
      // Reset position
      x.set(0);
      setDragDirection(null);
    }
  };

  const handleLike = async () => {
    try {
      setLastAction({ type: 'like', cardIndex: currentIndex, card: currentCard });
      nextCard();

      const response = await like({
        toUserId: currentCard.user.id,
        targetType: 'prompt',
        targetId: currentCard.user.id, // Simplified for demo
      });

      if (response.ok) {
        if (response.matched) {
          toast({
            title: 'It\'s a Match! 🎉',
            description: `You and ${currentCard.user.displayName} liked each other!`,
          });
        } else {
          toast({
            title: 'Like sent! 💕',
            description: `You liked ${currentCard.user.displayName}`,
          });
        }
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Something went wrong',
          variant: 'destructive',
        });
      }

      onLike(currentCard);
    } catch (error) {
      // Error handling - could restore card here
      toast({
        title: 'Error',
        description: 'Something went wrong',
        variant: 'destructive',
      });
    }
  };

  const handlePass = async () => {
    try {
      setLastAction({ type: 'pass', cardIndex: currentIndex, card: currentCard });
      nextCard();

      await pass(currentCard.user.id);
      onPass(currentCard);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong',
        variant: 'destructive',
      });
    }
  };

  const handleDoubleClick = () => {
    handleLike();
  };

  return (
    <div ref={constraintsRef} className="relative h-[600px] w-full max-w-sm mx-auto">
      {/* Next card (background) */}
      {nextCardData && (
        <div className="absolute inset-0 scale-95 opacity-50">
          <ProfileCard profile={nextCardData} />
        </div>
      )}

      {/* Current card */}
      <motion.div
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        style={{ x, rotate, opacity }}
        drag="x"
        dragConstraints={constraintsRef}
        dragElastic={0.2}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        onDoubleClick={handleDoubleClick}
        whileTap={{ scale: 1.05 }}
      >
        <ProfileCard profile={currentCard} />
        
        {/* Drag indicators */}
        {dragDirection === 'right' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-4 right-4 bg-green-500 text-white rounded-full p-3 shadow-lg"
          >
            <Heart className="h-6 w-6" />
          </motion.div>
        )}
        
        {dragDirection === 'left' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-4 left-4 bg-red-500 text-white rounded-full p-3 shadow-lg"
          >
            <X className="h-6 w-6" />
          </motion.div>
        )}
      </motion.div>

      {/* Action buttons */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handlePass}
          className="bg-red-500 text-white rounded-full p-4 shadow-lg"
        >
          <X className="h-6 w-6" />
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleLike}
          className="bg-green-500 text-white rounded-full p-4 shadow-lg"
        >
          <Heart className="h-6 w-6" />
        </motion.button>
      </div>
    </div>
  );
};