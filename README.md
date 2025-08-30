# Two man with your pet

## Project info

exactly what it sounds like it's a two man with your cat. [Video demo here](https://youtu.be/frbZMkXZdPI)

Please note the vid is a little confusing since I'm logging in as multiple different users to demo the auth, matching, and liking configurations. For extra context, I first logged in as myself to show the profile creation (I skipped on a pic upload bc I didn't have one on hand, but as you can see from the feed of other profiles, it is entirely functional) and sent a like to my friend Aronne (note that all profiles are entirely live and integrated into the Supabase SQL tables) to showcase the auth and the likes. I then logged in as Aronne and my other friend Michael (who I previously matched during dev to test matching features) to highlight the matching features and the messaging system (the previous messages already in their convo history are from dev testing—please ignore them we were just messing around). Hope this helps!  

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
