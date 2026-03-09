import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Send, User, MoreVertical, ArrowDown, Globe, Bot } from "lucide-react";

// --- SIMULATOR DATA ---
const RANDOM_MSGS = [
  "Wow, this is actually super helpful!",
  "Can you explain that part again?",
  "Greetings from India! 🇮🇳",
  "FocusTube is changing my study game.",
  "Is this recorded or live?",
  "Love the explanation, very clear.",
  "Python is definitely the way to go.",
  "Keep it up!",
  "Anyone else studying for finals?",
  "Does this work with React 19?"
];
const RANDOM_NAMES = ["DevKing", "Coder_01", "StudyBot", "Priya S.", "Rahul123", "TechGuru", "Alice W."];

function LiveChat() {
  const { id } = useParams();
  const [isRealChat, setIsRealChat] = useState(false); // Default to Simulator
  
  // --- SIMULATOR STATE ---
  const [messages, setMessages] = useState([
    { user: "System", text: "Welcome to the Live Chat! Keep it focused.", color: "#ff4444" }
  ]);
  const [input, setInput] = useState("");
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const chatContainerRef = useRef(null);

  // --- SIMULATOR LOGIC ---
  // 1. Auto-Scroll Logic
  useEffect(() => {
    if (isRealChat) return; // Don't run this logic if in Real mode
    
    const chat = chatContainerRef.current;
    if (!chat) return;

    const isNearBottom = chat.scrollHeight - chat.scrollTop - chat.clientHeight < 100;
    if (isNearBottom) {
      chat.scrollTo({ top: chat.scrollHeight, behavior: "smooth" });
      setShowScrollBtn(false);
    } else {
      setShowScrollBtn(true);
    }
  }, [messages, isRealChat]);

  // 2. Generate Fake Messages
  useEffect(() => {
    if (isRealChat) return; 

    const interval = setInterval(() => {
      const randomMsg = {
        user: RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)],
        text: RANDOM_MSGS[Math.floor(Math.random() * RANDOM_MSGS.length)],
        color: `hsl(${Math.random() * 360}, 70%, 70%)` 
      };
      setMessages(prev => [...prev.slice(-49), randomMsg]); 
    }, 3000); 

    return () => clearInterval(interval);
  }, [isRealChat]);

  const handleScroll = () => {
    const chat = chatContainerRef.current;
    if (!chat) return;
    const isNearBottom = chat.scrollHeight - chat.scrollTop - chat.clientHeight < 50;
    if (isNearBottom) setShowScrollBtn(false);
  };

  const scrollToBottom = () => {
    chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: "smooth" });
    setShowScrollBtn(false);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages(prev => [...prev, { user: "You", text: input, color: "white", isMe: true }]);
    setInput("");
    setTimeout(scrollToBottom, 100);
  };

  return (
    <div style={styles.container}>
      {/* HEADER WITH TOGGLE */}
      <div style={styles.header}>
        <div style={{display:"flex", alignItems:"center", gap:"8px"}}>
            <span style={{color: "#ff4444", fontSize: "10px"}}>●</span> 
            {isRealChat ? "REAL CHAT" : "TOP CHAT"}
        </div>
        
        {/* MODE TOGGLE SWITCH */}
        <button 
          onClick={() => setIsRealChat(!isRealChat)} 
          style={styles.toggleBtn}
          title={isRealChat ? "Switch to Simulator" : "Switch to Real Chat"}
        >
          {isRealChat ? <Globe size={14} color="#4caf50" /> : <Bot size={14} color="#ff9800" />}
          <span style={{fontSize: "11px", marginLeft: "5px"}}>
            {isRealChat ? "Real" : "Sim"}
          </span>
        </button>
      </div>
      
      {/* CONDITIONAL BODY */}
      {isRealChat ? (
        // --- REAL CHAT IFRAME ---
        <iframe
          title="Live Chat"
          width="100%"
          height="100%"
          src={`https://www.youtube.com/live_chat?v=${id}&embed_domain=${window.location.hostname}`}
          style={{ border: "none", flex: 1, background: "white" }}
        />
      ) : (
        // --- SIMULATOR BODY ---
        <>
          <div 
            ref={chatContainerRef} 
            onScroll={handleScroll}
            style={styles.chatArea}
          >
            {messages.map((msg, i) => (
              <div key={i} style={{...styles.message, background: msg.isMe ? "#222" : "transparent"}}>
                <span style={{...styles.user, color: msg.color}}>{msg.user}</span>
                <span style={styles.text}>{msg.text}</span>
              </div>
            ))}
          </div>

          {showScrollBtn && (
            <button onClick={scrollToBottom} style={styles.scrollBtn}>
              <ArrowDown size={14} /> New messages
            </button>
          )}

          <form onSubmit={sendMessage} style={styles.inputArea}>
            <div style={styles.inputWrapper}>
              <User size={16} color="#aaa" />
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Chat publicly..." 
                style={styles.input}
              />
              <button type="submit" style={styles.sendBtn}><Send size={16} /></button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

const styles = {
  container: { background: "#0f0f0f", borderRadius: "12px", border: "1px solid #222", height: "100%", maxHeight: "600px", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" },
  header: { padding: "10px 15px", borderBottom: "1px solid #222", fontSize: "14px", fontWeight: "bold", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#1a1a1a", color: "white" },
  toggleBtn: { background: "#333", border: "1px solid #444", borderRadius: "12px", padding: "4px 10px", display: "flex", alignItems: "center", cursor: "pointer", color: "white" },
  chatArea: { flex: 1, padding: "10px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" },
  message: { fontSize: "13px", lineHeight: "1.4", padding: "4px 8px", borderRadius: "4px" },
  user: { fontWeight: "bold", marginRight: "8px", fontSize: "12px" },
  text: { color: "#ddd" },
  inputArea: { padding: "15px", borderTop: "1px solid #222", background: "#1a1a1a" },
  inputWrapper: { display: "flex", alignItems: "center", gap: "10px", background: "#0f0f0f", padding: "8px 12px", borderRadius: "20px", border: "1px solid #333" },
  input: { background: "none", border: "none", color: "white", flex: 1, outline: "none", fontSize: "13px" },
  sendBtn: { background: "none", border: "none", color: "#666", cursor: "pointer", display: "flex" },
  scrollBtn: { position: "absolute", bottom: "70px", left: "50%", transform: "translateX(-50%)", background: "#222", color: "#fff", border: "1px solid #444", borderRadius: "20px", padding: "6px 12px", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", boxShadow: "0 4px 10px rgba(0,0,0,0.5)" }
};

export default LiveChat;
