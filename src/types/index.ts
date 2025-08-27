export type User = {
  id: string;
  displayName: string;
  age?: number;
  height?: string;
  sexuality?: string;
  bio?: string;
  photos: Photo[];
  prompts: PromptAnswer[];
};

export type Pet = {
  id: string;
  userId: string;
  name: string;
  age?: number;
  weight?: string;
  breed?: string;
  bio?: string;
  photos: Photo[];
  prompts: PromptAnswer[];
};

export type Photo = {
  id: string;
  ownerType: 'human' | 'pet';
  ownerId: string;
  path: string;
  isPrimary?: boolean;
  createdAt: string;
};

export type Prompt = {
  id: string;
  ownerType: 'human' | 'pet';
  text: string;
};

export type PromptAnswer = {
  id: string;
  ownerType: 'human' | 'pet';
  ownerId: string;
  promptId: string;
  answerText: string;
};

export type LikeRequest = {
  toUserId: string;
  targetType: 'prompt';
  targetId: string;
  message?: string;
};

export type LikeResponse = {
  ok: boolean;
  matched: boolean;
  matchId?: string;
  error?: string;
};

export type Match = {
  id: string;
  userId1: string;
  userId2: string;
  createdAt: string;
  user1: User;
  user2: User;
};

export type Like = {
  id: string;
  fromUserId: string;
  toUserId: string;
  targetType: 'prompt' | 'profile';
  targetId: string;
  message?: string;
  createdAt: string;
  fromUser: User;
};

export type ProfileWithPet = {
  user: User;
  pet: Pet;
};