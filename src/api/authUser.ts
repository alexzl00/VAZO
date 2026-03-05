import { supabase } from "./supabaseClient";

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}