
import { supabase } from "../../lib/supabase";

// types
import type {
  ProfileData,
  UpdateProfileData,
} from "../../types/user/profile";

export const getProfile = async (
  userId: string
): Promise<ProfileData> => {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      `
        id,
        first_name,
        last_name,
        subscription_plan,
        subscription_expires_at,
        created_at,
        updated_at
      `
    )
    .eq("id", userId)
    .single();

  if (error) {
    throw error;
  }

  return data as ProfileData;
};

export const updateProfile = async (
  userId: string,
  profileData: UpdateProfileData
): Promise<ProfileData> => {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      first_name: profileData.first_name,
      last_name: profileData.last_name,
    })
    .eq("id", userId)
    .select(
      `
        id,
        first_name,
        last_name,
        subscription_plan,
        subscription_expires_at,
        created_at,
        updated_at
      `
    )
    .single();

  if (error) {
    throw error;
  }

  return data as ProfileData;
};


export const deleteAccount = async () => {
  const { data, error } =
    await supabase.functions.invoke(
      "delete-account"
    );

  if (error) {
    throw error;
  }

  return data;
};