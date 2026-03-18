import { supabase } from "./supabase";

/**
 * Creates a new project
 * @param {string} name - Project name
 * @param {string} ownerId - Owner user ID
 */
export const createProject = async (name, ownerId) => {
  const { data, error } = await supabase
    .from("projects")
    .insert([{ name, owner: ownerId }])
    .select()
    .single();

  return { data, error };
};

/**
 * Gets all projects for a user
 * @param {string} userId - User ID
 */
export const getUserProjects = async (userId) => {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("owner", userId);

  return { data, error };
};

/**
 * Links feedback to a project
 * @param {string} feedbackId - Feedback ID
 * @param {string} projectId - Project ID
 */
export const linkFeedbackToProject = async (feedbackId, projectId) => {
  const { error } = await supabase
    .from("feedback")
    .update({ project_id: projectId })
    .eq("id", feedbackId);

  return { error };
};
