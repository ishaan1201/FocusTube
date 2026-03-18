import { supabase } from "./supabase";

export const getFeedback = async () => {
  const { data, error } = await supabase
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false });

  return { data, error };
};
