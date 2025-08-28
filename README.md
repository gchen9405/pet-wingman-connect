# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/1699687c-22b5-4433-9724-6338974367b8

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/1699687c-22b5-4433-9724-6338974367b8) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## Environment Configuration

This project supports both mock mode and real Supabase integration.

### Mock Mode (Default)

For development without setting up Supabase:

1. Copy the environment template:
```sh
cp env.example .env.local
```

2. Ensure mock mode is enabled in `.env.local`:
```env
VITE_USE_MOCKS=true
```

3. Start the development server:
```sh
npm run dev
```

The app will use mock data for all services, allowing you to develop and test the UI without a real backend.

### Supabase Integration

To connect to a real Supabase backend:

1. Set up your Supabase project:
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the SQL schema from `docs/schema.sql` in your Supabase SQL editor
   - Set up the storage bucket for photos

2. Configure environment variables in `.env.local`:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key-here
VITE_USE_MOCKS=false
```

3. Start the development server:
```sh
npm run dev
```

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

### Testing

Run the test suite:

```sh
# Run tests once
npm run test:run

# Run tests in watch mode
npm run test

# Run tests with UI
npm run test:ui
```

Tests cover the critical like/match logic to ensure proper reciprocal matching and prevent duplicate likes.

## App Features

**Pet Wingman Connect** is a Hinge-style dating app with a unique twist - each profile has two sections:

1. **Human Profile**: User's personal information, photos, and prompt responses
2. **Pet Profile**: Their pet's information, photos, and personality prompts

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

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/1699687c-22b5-4433-9724-6338974367b8) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
