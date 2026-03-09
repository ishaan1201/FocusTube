import { GoogleGenerativeAI } from "@google/generative-ai";

// ⚠️ PASTE YOUR API KEY HERE
const API_KEY = "AIzaSyBw3TPR6p_HA77s67bUA9Ehzp6bZH-DYI4";

const genAI = new GoogleGenerativeAI(API_KEY);

export const getAIResponse = async (videoTitle, userQuery) => {
    try {
        // ⚡ FIX: Use this specific stable model string
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
      You are a helpful study assistant named FocusAI.
      The user is currently watching an educational video titled: "${videoTitle}".
      User's Question: "${userQuery}"
      
      Answer clearly and concisely (under 3 sentences).
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();

    } catch (error) {
        console.error("AI Error:", error);
        // Fallback: If 1.5-flash fails, try gemini-pro automatically
        try {
            const fallbackModel = genAI.getGenerativeModel({ model: "gemini-pro" });
            const result = await fallbackModel.generateContent(prompt);
            return result.response.text();
        } catch (fallbackError) {
            return "FocusAI is having trouble connecting. Please check your internet connection.";
        }
    }
};