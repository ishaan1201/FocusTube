import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const SERP_API_KEY = import.meta.env.VITE_SERPAPI_KEY;

if (!API_KEY) console.error("Gemini API key missing. Check your .env file.");

const genAI = new GoogleGenerativeAI(API_KEY);

export const getAIResponse = async (videoTitle, videoDescription, userQuery, currentNotes, chatHistory = [], attachment = null) => {
  
  // 🧠 MEMORY BANK: Compile the past messages
  const historyTranscript = chatHistory
    .filter(msg => msg.text) 
    .map(msg => `${msg.role === 'ai' ? 'FocusAI' : 'User'}: ${msg.text}`)
    .join('\n\n');

  const prompt = `
    You are FocusAI, a smart, witty, and authentic study partner. 
    VIDEO TITLE: "${videoTitle}"
    VIDEO DESC & LINKS: "${videoDescription}"
    USER_NOTES: "${currentNotes || "None"}"

    PERSONALITY & RULES:
    - Be a helpful, friendly peer with a touch of wit.
    - Adapt to the user's energy.
    - Use the video description to help summarize or find resources.

    CAPABILITIES & COMMANDS:
    - MULTIMODAL: If the user uploaded an image or document, analyze it contextually.
    
    - 🖼️ IMAGES (CRITICAL): If the user asks for a picture, DO NOT write markdown. 
      * You MUST output EXACTLY: [SEARCH_IMAGE: your search term]
      
    - 🌐 WEB SEARCH (CRITICAL): If the user asks for links or live info.
      * You MUST output EXACTLY: [SEARCH_WEB: your search term]

    - FORMATTING: Use Markdown. 
    - MATH: Use LaTeX ($ for inline, $$ for block).
    - NOTE SYNC: If the user wants to save something, end the response with: [UPDATED_NOTE] content.

    🧠 PREVIOUS CONVERSATION HISTORY:
    ${historyTranscript || "This is the start of the conversation."}

    CURRENT USER REQUEST: ${userQuery}
  `;

  const models = ["gemini-2.5-flash"];

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const payload = [prompt];
      
      if (attachment && attachment.base64) {
        // Correctly extract the Base64 data part (removing data URL prefix if present)
        const parts = attachment.base64.split(",");
        const base64Data = parts.length > 1 ? parts[1] : parts[0];
        payload.push({ inlineData: { data: base64Data, mimeType: attachment.mimeType } });
      }

      const result = await model.generateContent(payload);
      let aiText = result.response.text();

      // 🛑 INTERCEPTORS: WEB & IMAGES
      if (SERP_API_KEY) {
        
        // 🚀 IMAGE INTERCEPTOR
        const imageRegex = /\[\s*SEARCH_IMAGE\s*:\s*(.*?)\s*\]/gi;
        const imageMatches = [...aiText.matchAll(imageRegex)];

        for (const match of imageMatches) {
          const fullTag = match[0]; 
          const query = match[1] ? match[1].trim() : ""; 
          
          if (query) {
            try {
              const serpUrl = `https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(query)}&api_key=${SERP_API_KEY}`;
              const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(serpUrl)}`;

              const response = await fetch(proxyUrl);
              const data = await response.json();

              if (data.images_results && data.images_results.length > 0) {
                const realImageUrl = data.images_results[0].original; 
                aiText = aiText.replace(fullTag, `![${query}](${realImageUrl})`);
              } else {
                aiText = aiText.replace(fullTag, `*(No image found for "${query}")*`);
              }
            } catch (err) {
              aiText = aiText.replace(fullTag, `*(Image search failed)*`);
            }
          }
        }

        // 🚀 WEB INTERCEPTOR
        const webRegex = /\[\s*SEARCH_WEB\s*:\s*(.*?)\s*\]/gi;
        const webMatches = [...aiText.matchAll(webRegex)];

        for (const match of webMatches) {
          const fullTag = match[0];
          const query = match[1] ? match[1].trim() : ""; 
          
          if (query) {
            try {
              // 🚀 FIX: gl=us&hl=en prevents Hindi results from appearing based on server location
              const serpUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${SERP_API_KEY}&gl=us&hl=en`;
              const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(serpUrl)}`;

              const response = await fetch(proxyUrl);
              const data = await response.json();

              if (data.organic_results && data.organic_results.length > 0) {
                let resMd = `\n\n**🌐 Live Search Results for "${query}":**\n\n`;
                data.organic_results.slice(0, 3).forEach(r => {
                  // 🚀 FIX: Convert YouTube links to FocusTube internal links
                  let link = r.link;
                  if (link.includes("youtube.com/watch?v=")) {
                    const videoId = link.split("v=")[1].split("&")[0];
                    link = `/video/${videoId}`;
                  } else if (link.includes("youtu.be/")) {
                    const videoId = link.split("youtu.be/")[1].split("?")[0];
                    link = `/video/${videoId}`;
                  }
                  
                  resMd += `* **[${r.title}](${link})**\n  *${r.snippet}*\n\n`;
                });
                aiText = aiText.replace(fullTag, resMd);
              } else {
                aiText = aiText.replace(fullTag, `*(No web results found)*`);
              }
            } catch (err) {
              aiText = aiText.replace(fullTag, `*(Web search failed)*`);
            }
          }
        }
      } else {
        aiText += "\n\n*(⚠️ Dev Note: SerpApi key not detected in .env!)*";
      }

      // Cleanup any accidental escaping
      return aiText.replace(/\\\[/g, '[').replace(/\\\]/g, ']');
      
    } catch (error) {
      console.warn(`Model ${modelName} failed:`, error.message);
    }
  }
  return "FocusAI is currently offline. My bad!";
};
