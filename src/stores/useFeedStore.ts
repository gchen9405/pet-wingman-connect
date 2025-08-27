import { create } from 'zustand';
import { ProfileWithPet } from '@/types';

interface FeedState {
  cards: ProfileWithPet[];
  currentIndex: number;
  lastAction: {
    type: 'like' | 'pass';
    cardIndex: number;
    card: ProfileWithPet;
  } | null;
  setCards: (cards: ProfileWithPet[]) => void;
  nextCard: () => void;
  addCards: (cards: ProfileWithPet[]) => void;
  setLastAction: (action: { type: 'like' | 'pass'; cardIndex: number; card: ProfileWithPet }) => void;
  undoLastAction: () => void;
  clearLastAction: () => void;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  cards: [],
  currentIndex: 0,
  lastAction: null,
  setCards: (cards) => set({ cards, currentIndex: 0 }),
  nextCard: () => set((state) => ({ currentIndex: state.currentIndex + 1 })),
  addCards: (cards) => set((state) => ({ 
    cards: [...state.cards, ...cards] 
  })),
  setLastAction: (action) => set({ lastAction: action }),
  undoLastAction: () => {
    const { lastAction, cards, currentIndex } = get();
    if (lastAction) {
      // Restore the card by inserting it back at the current position
      const newCards = [...cards];
      newCards.splice(currentIndex, 0, lastAction.card);
      set({ 
        cards: newCards,
        lastAction: null
      });
    }
  },
  clearLastAction: () => set({ lastAction: null }),
}));