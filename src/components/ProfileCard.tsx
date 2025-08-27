import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProfileWithPet } from '@/types';
import { PhotoCarousel } from './PhotoCarousel';
import { PromptList } from './PromptList';
import { Heart, MapPin, Ruler, User } from 'lucide-react';

interface ProfileCardProps {
  profile: ProfileWithPet;
  showPrompts?: boolean;
}

export const ProfileCard = ({ profile, showPrompts = true }: ProfileCardProps) => {
  const [activeSection, setActiveSection] = useState<'human' | 'pet'>('human');
  const { user, pet } = profile;

  const currentData = activeSection === 'human' ? user : pet;
  const currentPhotos = currentData.photos || [];

  return (
    <Card className="h-full overflow-hidden shadow-xl">
      <div className="relative h-2/3">
        <PhotoCarousel photos={currentPhotos} />
        
        {/* Section toggle */}
        <div className="absolute top-4 left-4 flex gap-2">
          <Badge 
            variant={activeSection === 'human' ? 'default' : 'secondary'}
            className="cursor-pointer"
            onClick={() => setActiveSection('human')}
          >
            <User className="h-3 w-3 mr-1" />
            {user.displayName}
          </Badge>
          <Badge 
            variant={activeSection === 'pet' ? 'default' : 'secondary'}
            className="cursor-pointer"
            onClick={() => setActiveSection('pet')}
          >
            <Heart className="h-3 w-3 mr-1" />
            {pet.name}
          </Badge>
        </div>
      </div>

      <CardContent className="h-1/3 p-4 overflow-y-auto">
        {activeSection === 'human' ? (
          <div className="space-y-3">
            <div>
              <h3 className="text-xl font-semibold">
                {user.displayName}{user.age && `, ${user.age}`}
              </h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                {user.height && (
                  <div className="flex items-center gap-1">
                    <Ruler className="h-3 w-3" />
                    {user.height}
                  </div>
                )}
                {user.sexuality && <Badge variant="outline">{user.sexuality}</Badge>}
              </div>
            </div>
            
            {user.bio && (
              <p className="text-sm">{user.bio}</p>
            )}

            {showPrompts && user.prompts && user.prompts.length > 0 && (
              <PromptList 
                prompts={user.prompts} 
                ownerType="human"
                ownerId={user.id}
              />
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <h3 className="text-xl font-semibold">
                {pet.name}{pet.age && `, ${pet.age} years old`}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                {pet.breed && <Badge variant="outline">{pet.breed}</Badge>}
                {pet.weight && <span>{pet.weight}</span>}
              </div>
            </div>
            
            {pet.bio && (
              <p className="text-sm">{pet.bio}</p>
            )}

            {showPrompts && pet.prompts && pet.prompts.length > 0 && (
              <PromptList 
                prompts={pet.prompts} 
                ownerType="pet"
                ownerId={pet.id}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};