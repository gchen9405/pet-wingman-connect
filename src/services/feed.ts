import { ProfileWithPet, User, Pet } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

// Mock data
const mockProfiles: ProfileWithPet[] = [
  {
    user: {
      id: '1',
      displayName: 'test',
      age: 26,
      height: '5\'6"',
      sexuality: 'Straight',
      bio: 'test',
      photos: [
        { id: '1', ownerType: 'human', ownerId: '1', path: '/api/placeholder/400/600', isPrimary: true, createdAt: new Date().toISOString() }
      ],
      prompts: [
        { id: '1', ownerType: 'human', ownerId: '1', promptId: '1', answerText: 'test' }
      ]
    },
    pet: {
      id: '1',
      userId: '1',
      name: 'test pet',
      age: 3,
      weight: '65 lbs',
      breed: 'Golden Retriever',
      bio: 'test',
      photos: [
        { id: '2', ownerType: 'pet', ownerId: '1', path: '/api/placeholder/400/400', isPrimary: true, createdAt: new Date().toISOString() }
      ],
      prompts: [
        { id: '2', ownerType: 'pet', ownerId: '1', promptId: '2', answerText: 'test' }
      ]
    }
  },
  {
    user: {
      id: '2',
      displayName: 'test2',
      age: 24,
      height: 'test',
      sexuality: 'test',
      bio: 'test',
      photos: [
        { id: '3', ownerType: 'human', ownerId: '2', path: '/api/placeholder/400/600', isPrimary: true, createdAt: new Date().toISOString() }
      ],
      prompts: [
        { id: '3', ownerType: 'human', ownerId: '2', promptId: '1', answerText: 'test' }
      ]
    },
    pet: {
      id: '2',
      userId: '2',
      name: 'test pet 2',
      age: 2,
      weight: 'test',
      breed: 'test',
      bio: 'test',
      photos: [
        { id: '4', ownerType: 'pet', ownerId: '2', path: '/api/placeholder/400/400', isPrimary: true, createdAt: new Date().toISOString() }
      ],
      prompts: [
        { id: '4', ownerType: 'pet', ownerId: '2', promptId: '2', answerText: 'test' }
      ]
    }
  }
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchNextCards = async (page = 0, limit = 10): Promise<ProfileWithPet[]> => {
  if (USE_MOCKS) {
    await delay(1000);
    // Return mock data with some variation
    return mockProfiles.map((profile, index) => ({
      ...profile,
      user: {
        ...profile.user,
        id: `${profile.user.id}-${page}-${index}`,
        displayName: `${profile.user.displayName} ${page + 1}-${index + 1}`
      },
      pet: {
        ...profile.pet,
        id: `${profile.pet.id}-${page}-${index}`,
        userId: `${profile.user.id}-${page}-${index}`
      }
    }));
  }

  try {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Fetch profiles with their pets, photos, and prompt answers
    // Exclude the current user from the feed
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        display_name,
        age,
        height,
        sexuality,
        bio,
        created_at
      `)
      .neq('id', currentUser.id)
      .range(page * limit, (page + 1) * limit - 1);

    if (profilesError) {
      throw profilesError;
    }

    if (!profiles || profiles.length === 0) {
      return [];
    }

    // Fetch related data for each profile
    const profileIds = profiles.map(p => p.id);
    
    // Fetch pets for these profiles
    const { data: pets, error: petsError } = await supabase
      .from('pets')
      .select('*')
      .in('user_id', profileIds);

    if (petsError) {
      throw petsError;
    }

    // Fetch photos for profiles and pets
    const petIds = pets?.map(p => p.id) || [];
    const allOwnerIds = [...profileIds, ...petIds];
    
    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('*')
      .in('owner_id', allOwnerIds);

    if (photosError) {
      throw photosError;
    }

    // Fetch prompt answers for profiles and pets
    const { data: promptAnswers, error: promptAnswersError } = await supabase
      .from('prompt_answers')
      .select(`
        id,
        owner_type,
        owner_id,
        prompt_id,
        answer_text,
        prompts(text)
      `)
      .in('owner_id', allOwnerIds);

    if (promptAnswersError) {
      throw promptAnswersError;
    }

    // Transform the data into the expected format
    const profilesWithPets: ProfileWithPet[] = profiles.map(profile => {
      const userPhotos = photos?.filter(
        p => p.owner_type === 'human' && p.owner_id === profile.id
      ) || [];
      
      const userPrompts = promptAnswers?.filter(
        pa => pa.owner_type === 'human' && pa.owner_id === profile.id
      ) || [];

      const userPet = pets?.find(p => p.user_id === profile.id);
      
      const user: User = {
        id: profile.id,
        displayName: profile.display_name,
        age: profile.age,
        height: profile.height,
        sexuality: profile.sexuality,
        bio: profile.bio,
        photos: userPhotos.map(p => ({
          id: p.id,
          ownerType: p.owner_type as 'human' | 'pet',
          ownerId: p.owner_id,
          path: p.path,
          isPrimary: p.is_primary,
          createdAt: p.created_at
        })),
        prompts: userPrompts.map(pa => ({
          id: pa.id,
          ownerType: pa.owner_type as 'human' | 'pet',
          ownerId: pa.owner_id,
          promptId: pa.prompt_id,
          answerText: pa.answer_text
        }))
      };

      let pet: Pet;
      if (userPet) {
        const petPhotos = photos?.filter(
          p => p.owner_type === 'pet' && p.owner_id === userPet.id
        ) || [];
        
        const petPrompts = promptAnswers?.filter(
          pa => pa.owner_type === 'pet' && pa.owner_id === userPet.id
        ) || [];

        pet = {
          id: userPet.id,
          userId: userPet.user_id,
          name: userPet.name,
          age: userPet.age,
          weight: userPet.weight,
          breed: userPet.breed,
          bio: userPet.bio,
          photos: petPhotos.map(p => ({
            id: p.id,
            ownerType: p.owner_type as 'human' | 'pet',
            ownerId: p.owner_id,
            path: p.path,
            isPrimary: p.is_primary,
            createdAt: p.created_at
          })),
          prompts: petPrompts.map(pa => ({
            id: pa.id,
            ownerType: pa.owner_type as 'human' | 'pet',
            ownerId: pa.owner_id,
            promptId: pa.prompt_id,
            answerText: pa.answer_text
          }))
        };
      } else {
        // Create a placeholder pet if none exists
        pet = {
          id: `placeholder-${profile.id}`,
          userId: profile.id,
          name: 'No pet yet',
          bio: 'This user hasn\'t added their pet profile yet.',
          photos: [],
          prompts: []
        };
      }

      return { user, pet };
    });

    return profilesWithPets;
  } catch (error) {
    console.error('Error fetching feed cards:', error);
    return [];
  }
};