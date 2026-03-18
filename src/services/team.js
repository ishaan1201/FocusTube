import { supabase } from "./supabase";

/**
 * Invites a new team member
 * @param {string} email - Teammate email
 * @param {string} role - Assigned role (user, moderator, admin)
 */
export const inviteTeammate = async (email, role) => {
  const { data, error } = await supabase
    .from("invites")
    .insert([{ email, role }])
    .select()
    .single();

  return { data, error };
};

/**
 * Gets the profile of the current user with roles and permissions
 * @param {string} userId - User ID
 */
export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  return { data, error };
};

/**
 * Updates user permissions
 * @param {string} userId - User ID
 * @param {Object} permissions - JSON permissions object
 */
export const updatePermissions = async (userId, permissions) => {
  const { error } = await supabase
    .from("profiles")
    .update({ permissions })
    .eq("id", userId);

  return { error };
};
