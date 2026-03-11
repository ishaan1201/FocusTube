import { useState, useRef, useEffect } from "react";
// 🚀 Added Mic, Volume2 (for AI voice toggle), and VolumeX
import { Sparkles, X, Send, Paperclip, Trash2, Mic, Volume2, VolumeX } from "lucide-react";
import { getAIResponse } from "../services/gemini";
import { fetchSearchVideos } from "../services/youtube"; 
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { useLocation, useNavigate } from "react-router-dom";
import 'katex/dist/katex.min.css';

function GlobalAIChat({ onClose }) {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("global_chat_history");
    return saved ? JSON.parse(saved) : [{ role: "ai", text: "Hi! I'm FocusAI. I can navigate the app, play videos, or control your Focus Timer. What's up?" }];
  });
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [attachment, setAttachment] = useState(null);
  
  // 🚀 Voice State
  const [isListening, setIsListening] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false); // Controls if AI speaks back

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    localStorage.setItem("global_chat_history", JSON.stringify(messages));
  }, [messages]);

  // 🚀 AI Text-to-Speech Function
  const speakAIText = (text) => {
    if (!voiceMode) return;
    window.speechSynthesis.cancel(); // Stop current speech
    
    // Clean text: Remove markdown characters, emojis, and raw command tags [LIKE_THIS]
    const cleanText = text
      .replace(/\[.*?\]/g, '') // Removes tags
      .replace(/[*_#]/g, '')   // Removes markdown symbols
      .replace(/(?:https?|ftp):\/\/[\n\S]+/g, '') // Removes URLs
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05; // Slightly faster, sounds smarter
    window.speechSynthesis.speak(utterance);
  };

  // 🚀 User Speech-to-Text Function
  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Voice typing is not supported in this browser.");

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true; // Shows words as you speak

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e) => {
      const transcript = Array.from(e.results).map(res => res.transcript).join('');
      setInput(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    
    recognition.start();
  };

  const handleFileChange = (e) => {
    const file = e.target.files;
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setAttachment({ file, base64: reader.result, mimeType: file.type, name: file.name });
    reader.readAsDataURL(file);
  };

  const handleSend = async () => {
    if (!input.trim() && !attachment) return;

    const userMsg = { role: "user", text: input, attachment: attachment ? { base64: attachment.base64, mimeType: attachment.mimeType, name: attachment.name } : null, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    
    const currentInput = input;
    const currentAttachment = attachment;
    setInput("");
    setAttachment(null);
    setIsTyping(true);

    const path = location.pathname;
    let currentPageName = "Unknown Page";
    if (path === "/") currentPageName = "Home Page";
    else if (path.startsWith("/video/")) currentPageName = "Video Player";
    else if (path === "/focus") currentPageName = "Focus Mode Dashboard";
    else {
      const cleanPath = path.substring(1).replace("-", " ");
      if (cleanPath) currentPageName = cleanPath.charAt(0).toUpperCase() + cleanPath.slice(1) + " Page";
    }

    const systemInstruction = `
      CRITICAL OVERRIDE: You are FocusAI, the global app controller for FocusTube.
      You are internally aware that the user is currently on the: ${currentPageName}.
      
      BEHAVIOR RULE: DO NOT mention the current page name in your response unless explicitly asked.
      KEEP RESPONSES BRIEF AND CONVERSATIONAL (1-2 sentences) if the user gives a command.
      
      APP CONTROL COMMANDS:
      You MUST output one of these exact tags to control the app. You can use multiple tags at once.
      
      1. Navigate: [NAVIGATE: /path] (Paths: / for Home, /saved, /history, /notes, /settings, /classroom, /focus)
      2. Play Video INSTANTLY: [PLAY: search query]
      3. Set Timer: [TIMER: minutes]
      4. Toggle Timer: [TIMER_TOGGLE: play] or [TIMER_TOGGLE: pause]
      5. Play Relaxing Music: [MUSIC: track name] (Options: Chillhop, Lofi Girl, White Noise, Mozart, Forest, Silence)
      6. Add To-Do: [ADD_TASK: task name]

      NOTE: If the user asks you to set a timer or add a task, and you are NOT currently on the "Focus Mode Dashboard", you MUST include the [NAVIGATE: /focus] tag first!
      HOWEVER, Music ([MUSIC: track name]) is GLOBAL. You can play music from ANY page.
      
      Do NOT use Markdown formatting around the tags.
    `;

    try {
      let aiText = await getAIResponse(`Current App Location: ${currentPageName}`, systemInstruction, currentInput, "", messages, currentAttachment);

      if (aiText) aiText = aiText.replace(/\\\[/g, '[').replace(/\\\]/g, ']'); // Scrub Gemini escape bugs

      const extractTag = (regex, callback) => {
        try {
          const match = aiText.match(regex);
          if (match) {
            callback(match ? match.trim() : match); 
            aiText = aiText.replace(match, "").trim();
            return true;
          }
        } catch (e) { console.error(`Tag Extraction Error:`, e); }
        return false;
      };

      if (extractTag(/\[NAVIGATE:\s*(.*?)\]/i, (val) => { 
        let route = val.startsWith('/') ? val : `/${val}`;
        navigate(route); aiText += `\n\n*(🚀 Navigating to ${route}...)*`; 
      })) {}
      if (extractTag(/\[TIMER:\s*.*?(\d+).*?\]/i, (val) => { 
        window.dispatchEvent(new CustomEvent('focus-timer-set', { detail: { minutes: parseInt(val) } })); aiText += `\n\n*(⏳ Focus timer set to ${val} minutes!)*`; 
      })) {}
      if (extractTag(/\[TIMER_TOGGLE:\s*(play|pause)\]/i, (val) => { 
        window.dispatchEvent(new CustomEvent('focus-timer-toggle', { detail: { action: val.toLowerCase() } })); aiText += `\n\n*(⏯️ Timer ${val.toLowerCase()}ed!)*`; 
      })) {}
      if (extractTag(/\[MUSIC:\s*(.*?)\]/i, (val) => { 
        window.dispatchEvent(new CustomEvent('focus-music', { detail: { track: val } })); aiText += `\n\n*(🎵 Ambience changed to: ${val})*`; 
      })) {}
      if (extractTag(/\[ADD_TASK:\s*(.*?)\]/i, (val) => { 
        window.dispatchEvent(new CustomEvent('focus-add-task', { detail: { task: val } })); aiText += `\n\n*(✅ Added task: "${val}")*`; 
      })) {}

      const playMatch = aiText.match(/\[PLAY:\s*(.*?)\]/i);
      if (playMatch) {
        const query = playMatch.trim();
        aiText = aiText.replace(playMatch, "").trim();
        try {
          const results = await fetchSearchVideos(query);
          if (results.items && results.items.length > 0) {
            const videoId = typeof results.items.id === 'object' ? results.items.id.videoId : results.items.id;
            navigate(`/video/${videoId}`);
            aiText += `\n\n*(▶️ Playing: "${results.items.snippet.title}")*`;
          } else aiText += `\n\n*(❌ Couldn't find a video for "${query}").*`;
        } catch (e) {
          navigate(`/?s=${encodeURIComponent(query)}`);
          aiText += `\n\n*(▶️ Searching for: "${query}")...*`;
        }
      }

      // 🚀 Trigger AI Voice!
      speakAIText(aiText);
      setMessages(prev => [...prev, { role: "ai", text: aiText, timestamp: Date.now() }]);

    } catch (err) {
      console.error("🔥 GLOBAL CHAT FULL CRASH:", err);
      setMessages(prev => [...prev, { role: "ai", text: `⚠️ Error triggered: ${err.message}`, timestamp: Date.now() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => { if (window.confirm("Clear global chat history?")) setMessages([{ role: "ai", text: "Memory wiped. Where to next?" }]); };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerTitle}>
          <div style={styles.aiIcon}><Sparkles size={16} color="#fff" /></div>
          <div>
            <h3 style={styles.titleText}>FocusAI</h3>
            <span style={styles.statusText}>Always Active</span>
          </div>
        </div>
        <div style={styles.headerActions}>
          {/* 🚀 ADDED: Voice Mode Toggle */}
          <button 
            onClick={() => {
              setVoiceMode(!voiceMode);
              if (voiceMode) window.speechSynthesis.cancel(); 
            }} 
            style={{...styles.iconBtn, color: voiceMode ? "#4caf50" : "#aaa"}} 
            title={voiceMode ? "Voice Output On" : "Voice Output Off"}
          >
            {voiceMode ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button onClick={clearChat} style={styles.iconBtn} title="Clear Chat"><Trash2 size={18} /></button>
          <button onClick={() => { window.speechSynthesis.cancel(); onClose(); }} style={styles.iconBtn}><X size={20} /></button>
        </div>
      </div>

      <div style={styles.chatFeed}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ ...styles.messageWrapper, alignSelf: msg.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ ...styles.bubble, ...(msg.role === "user" ? styles.userBubble : styles.aiBubble) }}>
              {msg.attachment && (
                <div style={styles.attachmentPreview}>
                  {msg.attachment.mimeType.startsWith("image/") ? <img src={msg.attachment.base64} alt="upload" style={styles.attachedImg} /> : <div style={styles.fileIcon}><Paperclip size={14} /> <span>{msg.attachment.name}</span></div>}
                </div>
              )}
              <div className="markdown-body">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}
                  components={{
                    a: ({ children, href }) => {
                      if (href.startsWith("/")) return <button onClick={() => navigate(href)} style={{ background: "none", border: "none", color: "#8ab4f8", padding: 0, textDecoration: "underline", cursor: "pointer", fontSize: "inherit", fontFamily: "inherit" }}>{children}</button>;
                      return <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "#8ab4f8" }}>{children}</a>;
                    },
                    img: ({ src, alt }) => <img src={src} alt={alt} referrerPolicy="no-referrer" style={styles.markdownImg} />
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div style={styles.typingIndicator}>
            <div style={styles.aiIconSmall}><Sparkles size={12} color="#fff" /></div>
            <span>FocusAI is thinking...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div style={styles.inputArea}>
        {attachment && (
          <div style={styles.previewContainer}>
            <div style={styles.previewBadge}>
              <Paperclip size={12} /> <span style={styles.previewName}>{attachment.name}</span>
              <button onClick={() => setAttachment(null)} style={styles.removeBtn}><X size={12} /></button>
            </div>
          </div>
        )}
        <div style={styles.inputBox}>
          <button onClick={() => fileInputRef.current.click()} style={styles.actionBtn}><Paperclip size={20} /></button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} />
          
          {/* 🚀 ADDED: Voice Input Button */}
          <button 
            onClick={handleVoiceInput} 
            style={{...styles.actionBtn, color: isListening ? "#ff4444" : "#aaa"}}
            title="Hold to Speak"
          >
            {isListening ? <span style={styles.recordingDot} /> : <Mic size={20} />}
          </button>

          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder={isListening ? "Listening..." : "Search videos or navigate the app..."} style={styles.input} />
          <button onClick={handleSend} style={{ ...styles.sendBtn, opacity: (input.trim() || attachment) ? 1 : 0.5 }}><Send size={18} /></button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { position: "fixed", top: "80px", right: "24px", width: "400px", height: "calc(100vh - 120px)", background: "#1e1e1e", borderRadius: "24px", boxShadow: "0 12px 40px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", zIndex: 2000, border: "1px solid #333", overflow: "hidden", animation: "slideIn 0.3s ease-out" },
  header: { padding: "16px 20px", background: "#252525", borderBottom: "1px solid #333", display: "flex", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { display: "flex", alignItems: "center", gap: "12px" },
  aiIcon: { width: "32px", height: "32px", borderRadius: "10px", background: "linear-gradient(135deg, #4285f4, #9b72cb)", display: "flex", alignItems: "center", justifyContent: "center" },
  aiIconSmall: { width: "20px", height: "20px", borderRadius: "6px", background: "linear-gradient(135deg, #4285f4, #9b72cb)", display: "flex", alignItems: "center", justifyContent: "center" },
  titleText: { margin: 0, fontSize: "15px", fontWeight: "700", color: "#fff" },
  statusText: { fontSize: "11px", color: "#4caf50", fontWeight: "600" },
  headerActions: { display: "flex", gap: "8px" },
  iconBtn: { background: "none", border: "none", color: "#aaa", cursor: "pointer", padding: "4px", borderRadius: "6px", transition: "0.2s" },
  chatFeed: { flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" },
  messageWrapper: { maxWidth: "85%", display: "flex", flexDirection: "column" },
  bubble: { padding: "12px 16px", borderRadius: "18px", fontSize: "14px", lineHeight: "1.5" },
  userBubble: { background: "#303134", color: "#fff", borderRadius: "18px 18px 4px 18px" },
  aiBubble: { background: "transparent", color: "#e8eaed", padding: "0" },
  typingIndicator: { display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#aaa" },
  inputArea: { padding: "16px", background: "#1e1e1e" },
  previewContainer: { marginBottom: "8px" },
  previewBadge: { display: "inline-flex", alignItems: "center", gap: "8px", background: "#333", padding: "4px 10px", borderRadius: "8px", fontSize: "12px", color: "#fff" },
  previewName: { maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  removeBtn: { background: "none", border: "none", color: "#ff4444", cursor: "pointer", padding: 0 },
  inputBox: { display: "flex", alignItems: "center", gap: "10px", background: "#303134", padding: "8px 12px", borderRadius: "24px", border: "1px solid #444" },
  input: { flex: 1, background: "transparent", border: "none", color: "#fff", outline: "none", fontSize: "14px" },
  actionBtn: { background: "none", border: "none", color: "#aaa", cursor: "pointer", display: "flex", alignItems: "center" },
  sendBtn: { background: "#8ab4f8", border: "none", color: "#202124", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  recordingDot: { width: "10px", height: "10px", backgroundColor: "#ff4444", borderRadius: "50%", animation: "pulse 1.5s infinite" },
  attachedImg: { maxWidth: "100%", borderRadius: "12px", marginBottom: "8px" },
  markdownImg: { maxWidth: "100%", borderRadius: "12px", marginTop: "8px" },
  fileIcon: { display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.1)", padding: "6px 10px", borderRadius: "8px", marginBottom: "8px" }
};

export default GlobalAIChat;