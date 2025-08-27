import { useState } from 'react';
import { PromptAnswer } from '@/types';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { LikeWithReplyModal } from './LikeWithReplyModal';

interface PromptListProps {
  prompts: PromptAnswer[];
  ownerType: 'human' | 'pet';
  ownerId: string;
}

export const PromptList = ({ prompts, ownerType, ownerId }: PromptListProps) => {
  const [selectedPrompt, setSelectedPrompt] = useState<PromptAnswer | null>(null);

  return (
    <div className="space-y-3">
      {prompts.map((prompt) => (
        <div 
          key={prompt.id}
          className="bg-muted/50 rounded-lg p-3 hover:bg-muted/70 transition-colors"
        >
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {/* In a real app, you'd fetch the prompt text */}
                Prompt Question
              </p>
              <p className="text-sm">{prompt.answerText}</p>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedPrompt(prompt)}
              className="p-2 hover:text-red-500 transition-colors"
            >
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}

      {selectedPrompt && (
        <LikeWithReplyModal
          prompt={selectedPrompt}
          isOpen={!!selectedPrompt}
          onClose={() => setSelectedPrompt(null)}
          toUserId={ownerId}
        />
      )}
    </div>
  );
};