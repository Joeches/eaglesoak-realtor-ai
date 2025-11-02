
/**
 * 🦅 eaglesoak-realty-ai | supabaseClient.ts
 * ------------------------------------------
 * Centralized Supabase client for the entire React + Netlify Functions stack.
 * Uses environment variables for secure connection.
 */

import { createClient } from "@supabase/supabase-js";

// 🧭 Load environment variables (Vite uses import.meta.env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("🚨 Missing Supabase environment variables!");
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: "eaglesoak-auth",
  },
});

// Helper: get user session
export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// Helper: sign in with email/password
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data;
}

// Helper: sign out
export async function signOut() {
  await supabase.auth.signOut();
}

export default supabase;
