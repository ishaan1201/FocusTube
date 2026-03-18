import { useState, useRef, useEffect } from "react";
import { Send, Trash2, Paperclip, X, Download, Mic, MicOff, Loader2 } from "lucide-react";
import { getAIResponse } from "../../services/gemini";
import { useAuth } from "../../context/AuthContext";
import { saveDocument, fetchDocuments } from "../../services/userData";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default function VideoAIChat({ id, video, noteText, setNoteText }) {
  const { user } = useAuth();
  const [chatMessages, setChatMessages] = useState([]);
  const [isLoadingChat, setIsLoadingChat] = useState(true);

  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [attachment, setAttachment] = useState(null); 
  const [expandedImage, setExpandedImage] = useState(null); 
  const [lastMessageTime, setLastMessageTime] = useState(0);

  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // 1. Fetch Chat History on Load
  useEffect(() => {
    const loadChatHistory = async () => {
      setIsLoadingChat(true);
      const allInsights = await fetchDocuments(user, 'ai_insight');
      const existingChat = allInsights.find(doc => doc.videoId === id);
      
      if (existingChat && existingChat.content) {
        try {
          setChatMessages(JSON.parse(existingChat.content));
        } catch(e) {
          setChatMessages([{ role: "ai", text: "Chat history corrupted. Starting fresh!" }]);
        }
      } else {
        setChatMessages([{ role: "ai", text: `Ready to analyze "${video?.snippet?.title || 'this video'}". What's confusing you?` }]);
      }
      setIsLoadingChat(false);
    };
    loadChatHistory();
  }, [id, user, video]);

  // 2. Auto-Save & Auto-Scroll when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    
    if (!isLoadingChat && chatMessages.length > 0) {
      // Fire and forget: saves to Supabase Bucket or LocalStorage depending on user status
      saveDocument(user, JSON.stringify(chatMessages), 'ai_insight', id).catch(console.error);
    }
  }, [chatMessages, id, user, isLoadingChat]);

  const clearChat = async () => {
    if (window.confirm("Are you sure you want to clear your conversation?")) {
      const freshStart = [{ role: "ai", text: "Chat cleared. How can I help you now?" }];
      setChatMessages(freshStart);
      // Overwrite the DB/Storage with the cleared state
      await saveDocument(user, JSON.stringify(freshStart), 'ai_insight', id);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Browser not supported");
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e) => setChatInput(Array.from(e.results).map(res => res[0].transcript).join(''));
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.start();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setAttachment({ file, base64: reader.result, mimeType: file.type, name: file.name });
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() && !attachment) return;
    const now = Date.now();
    if (now - lastMessageTime < 2000) return;
    setLastMessageTime(now);

    const userMsg = { role: "user", text: chatInput, attachment: attachment ? { base64: attachment.base64, mimeType: attachment.mimeType, name: attachment.name } : null };
    setChatMessages(prev => [...prev, userMsg]);
    
    const currentQuery = chatInput;
    const currentAttachment = attachment;
    
    setChatInput("");
    setAttachment(null);
    setIsTyping(true);

    try {
      const aiText = await getAIResponse(video.snippet.title, video.snippet.description, currentQuery, noteText, chatMessages, currentAttachment);

      if (aiText.includes("[UPDATED_NOTE]")) {
        const parts = aiText.split("[UPDATED_NOTE]");
        setNoteText(parts[1].trim());
        setChatMessages(prev => [...prev, { role: "ai", text: parts[0] + "\n\n✅ *Action: I've updated your notes panel.*" }]);
      } else {
        setChatMessages(prev => [...prev, { role: "ai", text: aiText }]);
      }
    } catch (e) {
      setChatMessages(prev => [...prev, { role: "ai", text: "Connection failed." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div style={styles.chatContainer}>
      <div style={{ display: "flex", justifyContent: "flex-end", paddingBottom: "10px" }}>
        <button onClick={clearChat} style={styles.clearBtn}><Trash2 size={14} /> Clear</button>
      </div>
      
      <div style={styles.chatFeed}>
        {isLoadingChat && (
          <div className="flex items-center justify-center py-4 text-zinc-500 gap-2">
            <Loader2 size={14} className="animate-spin" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Loading History...</span>
          </div>
        )}
        {chatMessages.map((msg, idx) => (
          <div key={idx} style={{ ...styles.chatBubble, ...(msg.role === "user" ? styles.userBubble : styles.aiBubble) }}>
            {msg.role === "ai" && <div style={{ color: "#2196f3", fontSize: "11px", fontWeight: "900", marginBottom: "6px" }}>FOCUS AI</div>}
            {msg.attachment && (
              <div style={{ marginBottom: "8px" }}>
                {msg.attachment.mimeType.startsWith("image/") ? (
                  <img src={msg.attachment.base64} alt="upload" style={{ width: "100%", borderRadius: "8px" }} />
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px", background: "rgba(0,0,0,0.2)", borderRadius: "8px" }}>
                    <Paperclip size={14} /> <span style={{ fontSize: "12px", wordBreak: "break-all" }}>{msg.attachment.name}</span>
                  </div>
                )}
              </div>
            )}
            <div className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}
                components={{ img: ({ src, alt }) => (<img src={src} alt={alt} onClick={() => setExpandedImage(src)} style={{ width: "220px", height: "140px", objectFit: "cover", borderRadius: "12px", cursor: "zoom-in", border: "1px solid #333" }}/>) }}
              >
                {msg.text}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        {isTyping && <div style={{...styles.chatBubble, ...styles.aiBubble, opacity: 0.5}}>Synthesizing...</div>}
        <div ref={chatEndRef} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
        {attachment && (
          <div style={styles.attachmentPreview}>
            <span style={{ fontSize: "12px", color: "#ddd", truncate: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>📎 {attachment.name}</span>
            <button onClick={() => setAttachment(null)} style={{ background: "none", border: "none", color: "#ff4444", cursor: "pointer" }}><X size={14} /></button>
          </div>
        )}
        <div style={styles.chatInputBox}>
          <button onClick={() => fileInputRef.current.click()} style={{ background: "none", border: "none", color: "#888", cursor: "pointer" }}><Paperclip size={20} /></button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} accept="image/*,.pdf,.txt" />
          <button onClick={toggleListening} style={{ background: "none", border: "none", color: isListening ? "#ff4444" : "#888", cursor: "pointer" }}>
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} style={styles.chatInput} placeholder="Ask FocusAI anything..." />
          <button onClick={handleSendMessage} style={styles.sendBtn}><Send size={18}/></button>
        </div>
      </div>

      {expandedImage && (
        <div style={styles.imageModal} onClick={() => setExpandedImage(null)}>
          <button style={styles.closeModalBtn}><X size={32} /></button>
          <img src={expandedImage} style={styles.expandedImg} alt="Expanded view" />
        </div>
      )}
    </div>
  );
}

const styles = {
  chatContainer: { display: "flex", flexDirection: "column", height: "100%" },
  chatFeed: { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" },
  chatBubble: { maxWidth: "88%", padding: "14px 18px", fontSize: "14.5px", lineHeight: "1.6", color: "#fff", wordBreak: "break-word" },
  userBubble: { alignSelf: "flex-end", background: "#2196f3", borderRadius: "22px 22px 4px 22px" },
  aiBubble: { alignSelf: "flex-start", background: "#1a1a1a", borderRadius: "22px 22px 22px 4px", border: "1px solid #222" },
  attachmentPreview: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#222", padding: "8px 12px", borderRadius: "10px", border: "1px solid #333" },
  chatInputBox: { display: "flex", gap: "12px", padding: "10px", background: "#0d0d0d", borderRadius: "18px", border: "1px solid #1a1a1a", alignItems: "center" },
  chatInput: { flex: 1, background: "transparent", border: "none", padding: "8px", color: "white", outline: "none", fontSize: "14px" },
  sendBtn: { background: "#2196f3", border: "none", color: "white", width: "44px", height: "44px", borderRadius: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  clearBtn: { background: "rgba(255, 68, 68, 0.1)", border: "none", color: "#ff4444", padding: "6px 12px", borderRadius: "10px", cursor: "pointer", fontWeight: "700" },
  imageModal: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" },
  closeModalBtn: { position: "absolute", top: "30px", right: "40px", background: "none", border: "none", color: "white", cursor: "pointer" },
  expandedImg: { maxWidth: "90%", maxHeight: "80vh", borderRadius: "16px", objectFit: "contain" }
};