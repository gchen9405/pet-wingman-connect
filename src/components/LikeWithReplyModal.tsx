import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PromptAnswer } from '@/types';
import { like } from '@/services/likes';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

interface LikeWithReplyModalProps {
  prompt: PromptAnswer;
  isOpen: boolean;
  onClose: () => void;
  toUserId: string;
}

export const LikeWithReplyModal = ({ prompt, isOpen, onClose, toUserId }: LikeWithReplyModalProps) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const { toast } = useToast();

  const maxLength = 200;
  const remainingChars = maxLength - message.length;

  const handleSubmit = async () => {
    if (message.trim().length === 0) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await like({
        toUserId,
        targetType: 'prompt',
        targetId: prompt.id,
        message: message.trim(),
      });

      if (response.ok) {
        // Show heart animation
        setShowHeartAnimation(true);
        
        setTimeout(() => {
          if (response.matched) {
            toast({
              title: 'It\'s a Match! 🎉',
              description: 'You liked each other!',
            });
          } else {
            toast({
              title: 'Like sent! 💕',
              description: 'Your message has been sent',
            });
          }
          
          onClose();
          setShowHeartAnimation(false);
          setMessage('');
        }, 1000);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Something went wrong',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send a like with a message</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Their answer:
            </p>
            <p className="text-sm">{prompt.answerText}</p>
          </div>

          <div>
            <Textarea
              placeholder="Write a thoughtful message..."
              value={message}
              onChange={(e) => {
                if (e.target.value.length <= maxLength) {
                  setMessage(e.target.value);
                }
              }}
              rows={4}
              className="resize-none"
            />
            <div className="flex justify-between items-center mt-2">
              <span className={`text-xs ${remainingChars < 20 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {remainingChars} characters remaining
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || message.trim().length === 0}
              className="flex-1"
            >
              {loading ? 'Sending...' : 'Send Like'}
            </Button>
          </div>
        </div>

        {/* Heart burst animation */}
        {showHeartAnimation && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: [0, 1.2, 1], rotate: 0 }}
              transition={{ duration: 0.6, ease: "backOut" }}
            >
              <Heart className="h-16 w-16 text-red-500 fill-current" />
            </motion.div>
            
            {/* Particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                initial={{ scale: 0, x: 0, y: 0 }}
                animate={{ 
                  scale: [0, 1, 0], 
                  x: Math.cos(i * 60 * Math.PI / 180) * 80,
                  y: Math.sin(i * 60 * Math.PI / 180) * 80,
                }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <Heart className="h-4 w-4 text-red-400 fill-current" />
              </motion.div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};