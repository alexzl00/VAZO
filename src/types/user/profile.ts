import type { SubscriptionPlan } from "./subscription";

export type ProfileData = {
  id: string;

  first_name: string | null;
  last_name: string | null;

  subscription_plan: SubscriptionPlan;

  subscription_expires_at: string | null;

  created_at: string;
  updated_at: string;
};

export type UpdateProfileData = {
  first_name: string;
  last_name: string;
};