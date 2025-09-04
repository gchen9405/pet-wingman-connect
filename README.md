# Two man with your pet

## Project info

exactly what it sounds like it's a two man with your cat. Basically, this is a Hinge-style dating app where the main differentiator is that each profile has a section for you and also a section for your pet. It has the same liking, matching, and messaging capabilities that Hinge does. Has working auth and is hooked up to Supabase backend for data storage. I spent around 5 hours developing this project. pls ignore my bald spot in the video also i was talking kinda fast so lmk if theres anything yall didnt catch [Video demo here](https://youtu.be/Ebxj7s_Yr7s)

### Database Schema

The complete database schema with tables, RLS policies, and functions is available in `docs/schema.sql`. This includes:

- **profiles**: User profile information
- **pets**: Pet profile information  
- **photos**: User and pet photos with storage integration
- **prompts**: Standard prompts for profiles
- **prompt_answers**: User/pet responses to prompts
- **likes**: User interactions and reciprocal like tracking
- **matches**: Matched users from mutual likes

All tables include Row Level Security (RLS) policies to ensure users can only access their own data and public profiles.

## App Features

### Key Features

- **Dual Profiles**: Both user and pet profiles on each card
- **Smart Matching**: Reciprocal likes create matches automatically  
- **Photo Management**: Upload and manage photos for both user and pet
- **Prompt System**: Answer prompts for both user and pet personalities
- **Real-time Feed**: Browse other users and their pets
- **Like System**: Like specific prompts or profiles
- **Match Management**: View and manage mutual matches

### Architecture

- **Frontend**: React + TypeScript + Tailwind CSS
- **State Management**: Zustand stores for auth and feed state
- **Backend**: Supabase with PostgreSQL and real-time subscriptions
- **Storage**: Supabase Storage for photo uploads
- **Authentication**: Supabase Auth with email/password
- **Testing**: Vitest for unit and integration tests

## Tools

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
