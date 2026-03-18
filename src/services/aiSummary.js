import { getAIResponse } from "./gemini";

export const summarizeFeedback = async (feedback) => {
  if (!feedback || feedback.length === 0) return "No feedback to summarize.";

  const text = feedback
    .map((f) => `Rating: ${f.rating}, Pain: ${f.pain_point}, Suggestion: ${f.suggestion}`)
    .join("\n");

  const prompt = `
  You are a product strategist.
  Analyze this feedback and give:

  1. Top 3 problems users face
  2. Top 3 feature requests
  3. What I should build NEXT (very important)
  4. One brutal truth about the product

  Keep it short and direct.

  Feedback Data:
  ${text}
  `;

  // We pass empty strings for video context as this is a general feedback summary
  return await getAIResponse("Feedback Summary", "Admin Dashboard Analytics", prompt, "");
};
