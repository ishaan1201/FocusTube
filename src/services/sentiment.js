import { getAIResponse } from "./gemini";

/**
 * Analyzes the sentiment of feedback items.
 * @param {Array} feedback - Array of feedback objects with 'pain_point' or 'suggestion'
 * @returns {Promise<Object>} - Sentiment analysis results { positive: number, neutral: number, negative: number }
 */
export const analyzeSentiment = async (feedback) => {
  if (!feedback || feedback.length === 0) {
    return { positive: 0, neutral: 0, negative: 0 };
  }

  const text = feedback
    .map((f, index) => `${index + 1}. ${f.pain_point || ""} ${f.suggestion || ""} ${f.liked || ""}`)
    .join("\n");

  const prompt = `
  Analyze the following feedback items and classify each as Positive, Neutral, or Negative based on tone and content.
  
  Feedback:
  ${text}

  Return ONLY a valid JSON object with the count of each category:
  { "positive": number, "neutral": number, "negative": number }
  `;

  try {
    const res = await getAIResponse("", "", prompt);
    // Extract JSON if AI wraps it in code blocks
    const jsonMatch = res.match(/\{[\s\S]*\}/);
    const cleanJson = jsonMatch ? jsonMatch[0] : res;
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Sentiment analysis error:", error);
    return { positive: 0, neutral: 0, negative: 0 };
  }
};
