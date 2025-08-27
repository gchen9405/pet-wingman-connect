import { useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Match } from '@/types';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MatchModalProps {
  match: Match | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MatchModal = ({ match, isOpen, onClose }: MatchModalProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      // Auto-close after 10 seconds
      const timer = setTimeout(onClose, 10000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!match) return null;

  const handleSayHi = () => {
    onClose();
    navigate('/messages');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-gradient-to-br from-pink-500 via-purple-500 to-pink-600 text-white border-none">
        <div className="relative p-8 text-center">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Confetti animation */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-yellow-300 rounded-full"
                initial={{
                  x: '50%',
                  y: '50%',
                  scale: 0,
                }}
                animate={{
                  x: `${50 + (Math.random() - 0.5) * 200}%`,
                  y: `${50 + (Math.random() - 0.5) * 200}%`,
                  scale: [0, 1, 0],
                  rotate: Math.random() * 360,
                }}
                transition={{
                  duration: 2,
                  delay: Math.random() * 0.5,
                  repeat: Infinity,
                  repeatDelay: 3,
                }}
              />
            ))}
          </div>

          {/* Main content */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "backOut" }}
          >
            <div className="mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4"
              >
                <Heart className="h-10 w-10 text-white fill-current" />
              </motion.div>
              
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-3xl font-bold mb-2"
              >
                It's a Match! 🎉
              </motion.h2>
              
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-white/90"
              >
                You and {match.user2.displayName} liked each other
              </motion.p>
            </div>

            {/* User photos */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex justify-center items-center gap-4 mb-8"
            >
              <div className="relative">
                <img
                  src={match.user1.photos[0]?.path || '/api/placeholder/80/80'}
                  alt={match.user1.displayName}
                  className="w-20 h-20 rounded-full border-4 border-white object-cover"
                />
              </div>
              
              <Heart className="h-6 w-6 text-white fill-current animate-pulse" />
              
              <div className="relative">
                <img
                  src={match.user2.photos[0]?.path || '/api/placeholder/80/80'}
                  alt={match.user2.displayName}
                  className="w-20 h-20 rounded-full border-4 border-white object-cover"
                />
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1 }}
              className="flex gap-3"
            >
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                Keep Swiping
              </Button>
              <Button
                onClick={handleSayHi}
                className="flex-1 bg-white text-purple-600 hover:bg-white/90"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Say Hi
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};