import { ProfileWithPet, User, Pet } from '@/types';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

// Mock data
const mockProfiles: ProfileWithPet[] = [
  {
    user: {
      id: '1',
      displayName: 'Sarah',
      age: 26,
      height: '5\'6"',
      sexuality: 'Straight',
      bio: 'Dog mom, hiking enthusiast, and coffee lover ☕',
      photos: [
        { id: '1', ownerType: 'human', ownerId: '1', path: '/api/placeholder/400/600', isPrimary: true, createdAt: new Date().toISOString() }
      ],
      prompts: [
        { id: '1', ownerType: 'human', ownerId: '1', promptId: '1', answerText: 'My perfect Sunday involves hiking with my dog and brunch afterward' }
      ]
    },
    pet: {
      id: '1',
      userId: '1',
      name: 'Max',
      age: 3,
      weight: '65 lbs',
      breed: 'Golden Retriever',
      bio: 'Loves fetch, belly rubs, and making new friends!',
      photos: [
        { id: '2', ownerType: 'pet', ownerId: '1', path: '/api/placeholder/400/400', isPrimary: true, createdAt: new Date().toISOString() }
      ],
      prompts: [
        { id: '2', ownerType: 'pet', ownerId: '1', promptId: '2', answerText: 'I once stole an entire pizza off the counter' }
      ]
    }
  },
  {
    user: {
      id: '2',
      displayName: 'Emma',
      age: 24,
      height: '5\'4"',
      sexuality: 'Straight',
      bio: 'Cat lady in training 🐱 Love reading and yoga',
      photos: [
        { id: '3', ownerType: 'human', ownerId: '2', path: '/api/placeholder/400/600', isPrimary: true, createdAt: new Date().toISOString() }
      ],
      prompts: [
        { id: '3', ownerType: 'human', ownerId: '2', promptId: '1', answerText: 'You should NOT go out with me if you are allergic to cats' }
      ]
    },
    pet: {
      id: '2',
      userId: '2',
      name: 'Luna',
      age: 2,
      weight: '8 lbs',
      breed: 'Persian Cat',
      bio: 'Princess who demands treats and attention',
      photos: [
        { id: '4', ownerType: 'pet', ownerId: '2', path: '/api/placeholder/400/400', isPrimary: true, createdAt: new Date().toISOString() }
      ],
      prompts: [
        { id: '4', ownerType: 'pet', ownerId: '2', promptId: '2', answerText: 'My owner thinks I can\'t open doors, but I totally can' }
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

  // TODO: Implement Supabase query to fetch profiles with pets
  // const { data, error } = await supabase
  //   .from('profiles')
  //   .select(`
  //     *,
  //     pets(*),
  //     photos(*),
  //     prompt_answers(*)
  //   `)
  //   .range(page * limit, (page + 1) * limit - 1);

  return [];
};