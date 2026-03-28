const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL;
const GATEWAY_KEY = import.meta.env.VITE_GATEWAY_KEY;

export const getAIResponse = async (videoTitle, videoDescription, userQuery, currentNotes, chatHistory = [], attachment = null) => {
  
  // 🧠 MEMORY BANK: Compile the past messages
  const historyTranscript = chatHistory
    .filter(msg => msg.text) 
    .map(msg => `${msg.role === 'ai' ? 'FocusAI' : 'User'}: ${msg.text}`)
    .join('\n\n');

  // 🚀 UPDATED PROMPT: Explicitly instructs AI to use HTML for note syncing
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

    - CHAT FORMATTING: Use Markdown in your normal chat replies to the user.
    - MATH: Use LaTeX ($ for inline, $$ for block) in chat.
    
    - 📝 NOTE SYNC (CRITICAL UPDATE): If the user asks you to save, write, or update their notes, you MUST output the tag [UPDATED_NOTE] followed by the content.
      HOWEVER, the notes editor uses a Rich Text WYSIWYG editor. You MUST format the text AFTER the [UPDATED_NOTE] tag using strict HTML tags, NOT Markdown!
      Use tags like <h1>, <h2>, <p>, <strong>, <em>, <ul><li>, <ol><li>.
      If you want to add an image to the notes, simply write [SEARCH_IMAGE: your search term] inside the HTML, and I will convert it for you!

    🧠 PREVIOUS CONVERSATION HISTORY:
    ${historyTranscript || "This is the start of the conversation."}

    CURRENT USER REQUEST: ${userQuery}
  `;

  try {
    const payload = {
      prompt,
      history: chatHistory
    };
    
    if (attachment && attachment.base64) {
      const parts = attachment.base64.split(",");
      const base64Data = parts.length > 1 ? parts[1] : parts[0];
      payload.attachment = {
        data: base64Data,
        mimeType: attachment.mimeType
      };
    }

    const response = await fetch(`${GATEWAY_URL}/api/gemini`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': GATEWAY_KEY
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error("Gateway request failed");
    
    const data = await response.json();
    let aiText = data.text || "No response from AI.";

    // 🛑 INTERCEPTORS: WEB & IMAGES
    // 🚀 SMART IMAGE INTERCEPTOR
    const imageRegex = /\[\s*SEARCH_IMAGE\s*:\s*(.*?)\s*\]/gi;
    const imageMatches = [...aiText.matchAll(imageRegex)];

    for (const match of imageMatches) {
      const fullTag = match[0]; 
      const query = match[1] ? match[1].trim() : ""; 
      
      if (query) {
        try {
          const searchRes = await fetch(`${GATEWAY_URL}/api/search`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': GATEWAY_KEY
            },
            body: JSON.stringify({ q: query })
          });
          const searchData = await searchRes.json();

          if (searchData.images_results && searchData.images_results.length > 0) {
            const realImageUrl = searchData.images_results[0].original; 
            
            const noteTagIndex = aiText.indexOf("[UPDATED_NOTE]");
            const isForNotes = noteTagIndex !== -1 && aiText.indexOf(fullTag) > noteTagIndex;

            if (isForNotes) {
              aiText = aiText.replace(fullTag, `<img src="${realImageUrl}" alt="${query}" width="300" style="border-radius: 8px;" />`);
            } else {
              aiText = aiText.replace(fullTag, `![${query}](${realImageUrl})`);
            }
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
          const searchRes = await fetch(`${GATEWAY_URL}/api/search`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': GATEWAY_KEY
            },
            body: JSON.stringify({ q: query })
          });
          const searchData = await searchRes.json();

          if (searchData.organic_results && searchData.organic_results.length > 0) {
            let resMd = `\n\n**🌐 Live Search Results for "${query}":**\n\n`;
            searchData.organic_results.slice(0, 3).forEach(r => {
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

    // 🎥 YOUTUBE TRANSCRIPT INTERCEPTOR
    const videoRegex = /\[\s*READ_VIDEO\s*:\s*(.*?)\s*\]/gi;
    const videoMatches = [...aiText.matchAll(videoRegex)];

    for (const match of videoMatches) {
      const fullTag = match[0];
      const videoUrl = match[1] ? match[1].trim() : ""; 
      
      if (videoUrl) {
        try {
          // 1. Tell the user we are fetching it
          aiText = aiText.replace(fullTag, `*(Cortex is watching the video...)*\n\n`);
          
          // 2. Extract the Video ID (Standard or youtu.be)
          let videoId = "";
          if (videoUrl.includes("v=")) videoId = videoUrl.split("v=")[1].split("&")[0];
          else if (videoUrl.includes("youtu.be/")) videoId = videoUrl.split("youtu.be/")[1].split("?")[0];

          if (!videoId) throw new Error("Invalid YouTube URL");

          // 3. Ping your RapidAPI backend route! (Adjust the URL to match your actual route)
          const transcriptRes = await fetch(`${GATEWAY_URL}/api/transcript?videoId=${videoId}`, {
            headers: { 'x-api-key': GATEWAY_KEY }
          });
          
          const transcriptData = await transcriptRes.json();
          
          if (transcriptData && transcriptData.transcript) {
            // 4. We got the transcript! Secretly send it BACK to Gemini to get the real answer.
            const secretPayload = {
               prompt: `I just fetched the transcript for the video. Here it is: "${transcriptData.transcript.substring(0, 15000)}...". Based on this, answer my original question: ${userQuery}`,
               history: chatHistory
            };
            
            const secondPassRes = await fetch(`${GATEWAY_URL}/api/gemini`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-api-key': GATEWAY_KEY },
              body: JSON.stringify(secretPayload)
            });
            
            const secondPassData = await secondPassRes.json();
            aiText = secondPassData.text; // Swap the temporary message with the actual brilliant summary!
          } else {
             aiText = aiText.replace(`*(Cortex is watching the video...)*\n\n`, `*(I couldn't pull the subtitles for this specific video, bro. It might not have closed captions!)*`);
          }
        } catch (err) {
          aiText = aiText.replace(`*(Cortex is watching the video...)*\n\n`, `*(Error trying to read that video URL. Make sure it's a valid YouTube link!)*`);
        }
      }
    }

    // Cleanup any accidental escaping
    return aiText.replace(/\\\[/g, '[').replace(/\\\]/g, ']');
    
  } catch (error) {
    console.error("AI Gateway Error:", error);
    return "FocusAI is currently offline. My bad!";
  }
};