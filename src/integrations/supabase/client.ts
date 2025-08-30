import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL!;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// Simple, reliable Supabase client - no fancy configuration
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Explicitly typed client for better type inference
export type SupabaseClient = typeof supabase;