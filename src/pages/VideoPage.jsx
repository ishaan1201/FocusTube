import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import YouTube from "react-youtube";
import {
  ThumbsUp, Share2, Bookmark, Check, ChevronDown, ChevronUp,
  RotateCcw, FileText, Save, Sparkles, Send, Bot, Maximize, Minimize, ArrowLeft, Trash2
} from "lucide-react";
import { fetchVideoDetails, fetchChannelDetails } from "../services/youtube";
import { toggleVault, isInVault, saveNote, getNoteForVideo } from "../utils/storage";
import { getAIResponse } from "../services/gemini";

// ✅ SAFETY: Crash-proof duration formatter
const formatDuration = (d) => {
  if (!d) return "0:00";
  if (!d.includes("PT")) return d;
  const match = d.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return "0:00";
  const h = parseInt(match[1]) || 0;
  const m = parseInt(match[2]) || 0;
  const s = parseInt(match[3]) || 0;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

function VideoPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const startTime = searchParams.get("t") || "0";

  const [video, setVideo] = useState(null);
  const [channel, setChannel] = useState(null);
  const [focusMode, setFocusMode] = useState(false);
  const [isVideoEnded, setIsVideoEnded] = useState(false);
  const [activeTab, setActiveTab] = useState("notes");

  const [noteText, setNoteText] = useState("");
  const [noteStatus, setNoteStatus] = useState("");

  // --- AI PART: REFINED LOGIC ---
  const [chatMessages, setChatMessages] = useState(() => {
    // ✅ PERSISTENCE: Ensure it loads specifically for this video ID
    const saved = localStorage.getItem(`chat_${id}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState(0);
  const chatEndRef = useRef(null);

  // 🛡️ NEW: Hold the player instance
  const playerRef = useRef(null);

  // ⏱️ NEW: THE TIME TRACKER ENGINE
  useEffect(() => {
    let interval;
    if (playerRef.current && video) {
      interval = setInterval(async () => {
        try {
          const currentTime = await playerRef.current.getCurrentTime();

          if (currentTime > 5) { // Only save if they watched at least 5 seconds
            const history = JSON.parse(localStorage.getItem("focus_history") || "[]");
            const existingIdx = history.findIndex(v => v.id === id);

            const entry = {
              id,
              title: video.snippet.title,
              thumbnail: video.snippet.thumbnails.high?.url,
              channel: video.snippet.channelTitle,
              duration: video.contentDetails?.duration || "0:00",
              timestamp: Date.now(),
              lastWatched: new Date().toISOString(),
              resumeTime: currentTime // 👈 This is the golden variable the chart needs
            };

            if (existingIdx > -1) {
              history[existingIdx] = { ...history[existingIdx], ...entry };
            } else {
              history.unshift(entry);
            }

            localStorage.setItem("focus_history", JSON.stringify(history.slice(0, 50)));
          }
        } catch (err) {
          // Ignore errors if player isn't fully ready yet
        }
      }, 3000); // Saves your spot every 3 seconds
    }
    return () => clearInterval(interval);
  }, [video, id]);

  // Auto-scroll chat without jumping the whole page
  useEffect(() => {
    if (activeTab === "ai") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [chatMessages, activeTab]);

  // Save chats on every change
  useEffect(() => {
    localStorage.setItem(`chat_${id}`, JSON.stringify(chatMessages));
  }, [chatMessages, id]);

  // Clear Chat Logic
  const clearChat = () => {
    if (window.confirm("Are you sure you want to clear your conversation?")) {
      const initialMsg = [{ role: "ai", text: "Chat cleared. How can I help you now?" }];
      setChatMessages(initialMsg);
      localStorage.removeItem(`chat_${id}`);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const now = Date.now();
    if (now - lastMessageTime < 3000) { // Reduced cooldown to 3s
      return;
    }

    setLastMessageTime(now);
    const userMsg = { role: "user", text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);

    const currentQuery = chatInput;
    setChatInput("");
    setIsTyping(true);

    // ✅ AI CONTEXT: Combination of Title + Notes
    const noteContext = noteText ? `The user has taken these study notes: "${noteText}". Refer to them if relevant.` : "";
    const fullPrompt = `${noteContext} User Question: ${currentQuery}`;

    const cleanTitle = video.snippet.title.replace(/[^\w\s]/gi, '');
    const aiText = await getAIResponse(cleanTitle, fullPrompt);

    setChatMessages(prev => [...prev, { role: "ai", text: aiText }]);
    setIsTyping(false);
  };
  // --- END AI PART ---

  const [isSaved, setIsSaved] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    const init = async () => {
      const vData = await fetchVideoDetails(id);
      setVideo(vData);

      setIsSaved(isInVault(id));
      const liked = JSON.parse(localStorage.getItem("liked_videos") || "[]");
      setIsLiked(!!liked.find(v => v.id === id));

      const existingNote = getNoteForVideo(id);
      if (existingNote) setNoteText(existingNote.text);

      if (vData?.snippet?.channelId) {
        const cData = await fetchChannelDetails(vData.snippet.channelId);
        setChannel(cData);
        const followed = JSON.parse(localStorage.getItem("focus_following") || "[]");
        setIsFollowing(!!followed.find(c => c.id === vData.snippet.channelId));
      }

      const savedChat = localStorage.getItem(`chat_${id}`);
      if (!savedChat) {
        setChatMessages([{ role: "ai", text: `Ready to analyze "${vData.snippet.title}". What's confusing you?` }]);
      }
    };
    init();
    setIsVideoEnded(false);
  }, [id]);

  const handleSaveNote = () => {
    const videoObj = { id, title: video.snippet.title, thumbnail: video.snippet.thumbnails.high?.url, channel: video.snippet.channelTitle };
    saveNote(videoObj, noteText);
    setNoteStatus("Saved! ✅");
    setTimeout(() => setNoteStatus(""), 2000);
  };

  const toggleSave = () => {
    if (!video) return;
    const videoObj = { id, title: video.snippet.title, thumbnail: video.snippet.thumbnails.high?.url, channel: video.snippet.channelTitle, duration: video.contentDetails?.duration, timestamp: Date.now() };
    setIsSaved(toggleVault(videoObj));
  };

  const toggleLike = () => {
    const liked = JSON.parse(localStorage.getItem("liked_videos") || "[]");
    const newVideo = { id, title: video.snippet.title, thumbnail: video.snippet.thumbnails.high?.url, channel: video.snippet.channelTitle, duration: video.contentDetails?.duration };
    const updated = isLiked ? liked.filter(v => v.id !== id) : [newVideo, ...liked];
    localStorage.setItem("liked_videos", JSON.stringify(updated));
    setIsLiked(!isLiked);
  };

  const toggleFollow = () => {
    if (!channel) return;
    const followed = JSON.parse(localStorage.getItem("focus_following") || "[]");
    let updated;
    if (isFollowing) {
      updated = followed.filter(c => c.id !== channel.id);
    } else {
      updated = [...followed, { id: channel.id, title: channel.snippet.title, thumbnail: channel.snippet.thumbnails.default?.url }];
    }
    localStorage.setItem("focus_following", JSON.stringify(updated));
    setIsFollowing(!isFollowing);
  };

  const opts = {
    height: '100%', width: '100%',
    playerVars: { autoplay: 1, start: parseInt(startTime), modestbranding: 1, rel: 0 },
  };

  if (!video) return <div style={{ padding: "40px", color: "white", textAlign: "center" }}>Loading Class...</div>;

  return (
    <div style={focusMode ? styles.focusContainer : styles.container}>
      {!focusMode && (
        <div style={{ width: "100%", marginBottom: "15px" }}>
          <Link to="/classroom" style={styles.backBtn}>
            <ArrowLeft size={20} /> Back to Classroom
          </Link>
        </div>
      )}

      <div style={focusMode ? styles.mainContentFocus : styles.mainContent}>
        <div style={focusMode ? styles.playerWrapperFocus : styles.playerWrapper}>
          <YouTube
            videoId={id}
            opts={opts}
            style={{ height: "100%" }}
            onReady={(e) => { playerRef.current = e.target; }} // 👈 NEW: Connects the player to the tracker
            onStateChange={(e) => { if (e.data === 0) setIsVideoEnded(true); }}
            className="youtube-player"
          />
          {isVideoEnded && !focusMode && (
            <div style={styles.endOverlay}>
              <h2>Session Complete! 🎉</h2>
              <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
                <button onClick={() => window.location.reload()} style={styles.overlayBtn}>
                  <RotateCcw size={20} /> Replay
                </button>
                <Link to="/classroom" style={{ ...styles.overlayBtn, background: "#4caf50", color: "white", textDecoration: "none" }}>
                  Next Lesson
                </Link>
              </div>
            </div>
          )}
        </div>

        {!focusMode ? (
          <>
            <div style={styles.headerRow}>
              <h1 style={styles.title}>{video.snippet.title}</h1>
              <button onClick={() => setFocusMode(true)} style={styles.focusBtn}>
                <Maximize size={18} /> Focus Mode
              </button>
            </div>

            <div style={styles.metaRow}>
              <div style={styles.leftMeta}>
                <Link to={`/channel/${video.snippet.channelId}`} style={styles.channelInfo}>
                  <img src={channel?.snippet?.thumbnails?.default?.url} style={styles.avatar} alt="Channel" />
                  <div>
                    <h3 style={styles.channelName}>{video.snippet.channelTitle}</h3>
                    <p style={styles.subCount}>
                      {channel?.statistics?.subscriberCount ? Number(channel.statistics.subscriberCount).toLocaleString() : "..."} subscribers
                    </p>
                  </div>
                </Link>
                <button onClick={toggleFollow} style={{ ...styles.followBtn, background: isFollowing ? "#333" : "white", color: isFollowing ? "white" : "black" }}>
                  {isFollowing ? "Following" : "Follow"}
                </button>
              </div>

              <div style={styles.actions}>
                <button onClick={toggleLike} style={{ ...styles.btn, background: isLiked ? "white" : "#222", color: isLiked ? "black" : "white" }}>
                  <ThumbsUp size={18} /> {isLiked ? "Liked" : "Like"}
                </button>
                <button onClick={toggleSave} style={{ ...styles.btn, background: isSaved ? "white" : "#222", color: isSaved ? "black" : "white" }}>
                  {isSaved ? <Check size={18} /> : <Bookmark size={18} />} {isSaved ? "Saved" : "Save"}
                </button>
                <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert("Copied!"); }} style={styles.btn}>
                  <Share2 size={18} /> Share
                </button>
              </div>
            </div>

            <div style={styles.descBox}>
              <p style={styles.descText}>
                {descExpanded ? video.snippet.description : video.snippet.description.slice(0, 180) + "..."}
              </p>
              <button onClick={() => setDescExpanded(!descExpanded)} style={styles.showMoreBtn}>
                {descExpanded ? "Show Less" : "Show More"} {descExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <button onClick={() => setFocusMode(false)} style={styles.exitFocusBtn}>
              <Minimize size={20} /> Exit Focus Mode
            </button>
          </div>
        )}
      </div>

      {!focusMode && (
        <div style={styles.sidePanel}>
          <div style={styles.panelCard}>
            <div style={styles.tabHeader}>
              <button
                onClick={() => setActiveTab("notes")}
                style={{ ...styles.tabBtn, borderBottom: activeTab === "notes" ? "3px solid #ff9800" : "3px solid transparent", color: activeTab === "notes" ? "white" : "#888" }}
              >
                <FileText size={16} /> My Notes
              </button>
              <button
                onClick={() => setActiveTab("ai")}
                style={{ ...styles.tabBtn, borderBottom: activeTab === "ai" ? "3px solid #2196f3" : "3px solid transparent", color: activeTab === "ai" ? "white" : "#888" }}
              >
                <Sparkles size={16} /> Focus AI
              </button>
            </div>

            <div style={styles.panelBody}>
              {activeTab === "notes" && (
                <>
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Type key takeaways here..."
                    style={styles.textArea}
                  />
                  <div style={styles.notesFooter}>
                    <span style={{ color: "#4caf50", fontSize: "13px", fontWeight: "bold" }}>{noteStatus}</span>
                    <button onClick={handleSaveNote} style={styles.saveBtn}>
                      <Save size={16} /> Save Note
                    </button>
                  </div>
                </>
              )}

              {activeTab === "ai" && (
                <div style={styles.chatContainer}>
                  {/* Added Clear Chat Header Option */}
                  <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 5px 10px" }}>
                    <button onClick={clearChat} style={styles.clearBtn}>
                      <Trash2 size={14} /> Clear History
                    </button>
                  </div>

                  <div style={styles.chatFeed}>
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} style={{ ...styles.chatBubble, alignSelf: msg.role === "user" ? "flex-end" : "flex-start", background: msg.role === "user" ? "#2196f3" : "#333" }}>
                        {msg.role === "ai" && <Bot size={14} style={{ marginRight: "6px" }} />}
                        {msg.text}
                      </div>
                    ))}
                    {isTyping && <div style={{ ...styles.chatBubble, alignSelf: "flex-start", background: "#333", fontStyle: "italic" }}>Thinking...</div>}
                    <div ref={chatEndRef} />
                  </div>

                  <div style={styles.chatInputBox}>
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Ask about this video..."
                      style={styles.chatInput}
                    />
                    <button onClick={handleSendMessage} style={styles.sendBtn}>
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { display: "flex", gap: "24px", padding: "24px", maxWidth: "1600px", margin: "0 auto", color: "white", flexWrap: "wrap", alignContent: "flex-start" },
  focusContainer: { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "black", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center" },
  mainContentFocus: { width: "90%", maxWidth: "1200px", height: "80%" },
  playerWrapperFocus: { width: "100%", height: "100%", borderRadius: "12px", overflow: "hidden", boxShadow: "0 0 50px rgba(0,0,0,0.5)" },
  exitFocusBtn: { background: "#333", border: "1px solid #555", color: "white", padding: "10px 20px", borderRadius: "30px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px", fontWeight: "bold" },
  mainContent: { flex: 3, minWidth: "600px" },
  playerWrapper: { position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: "16px", overflow: "hidden", background: "black" },
  endOverlay: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.9)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 10 },
  overlayBtn: { display: "flex", alignItems: "center", gap: "10px", padding: "12px 24px", borderRadius: "30px", border: "none", cursor: "pointer", background: "white", color: "black", fontWeight: "bold" },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "start", marginTop: "16px", marginBottom: "12px" },
  title: { fontSize: "20px", fontWeight: "700", margin: 0, flex: 1 },
  focusBtn: { background: "#222", color: "#ddd", border: "1px solid #444", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "bold", marginLeft: "15px" },
  backBtn: { display: "inline-flex", alignItems: "center", gap: "8px", color: "#aaa", textDecoration: "none", fontSize: "14px" },
  metaRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "15px" },
  leftMeta: { display: "flex", alignItems: "center", gap: "12px" },
  channelInfo: { display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", color: "white" },
  avatar: { width: "45px", height: "45px", borderRadius: "50%" },
  channelName: { fontSize: "16px", fontWeight: "600", margin: 0 },
  subCount: { fontSize: "12px", color: "#aaa", margin: 0 },
  actions: { display: "flex", gap: "10px", flexWrap: "wrap" },
  btn: { display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "20px", border: "none", fontWeight: "600", cursor: "pointer" },
  followBtn: { padding: "8px 16px", borderRadius: "20px", border: "none", fontWeight: "bold", marginLeft: "12px", cursor: "pointer" },
  descBox: { background: "#1a1a1a", padding: "15px", borderRadius: "12px", marginTop: "15px" },
  descText: { margin: 0, whiteSpace: "pre-wrap", fontSize: "14px", lineHeight: "1.5" },
  showMoreBtn: { background: "none", border: "none", color: "white", marginTop: "10px", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: "5px" },
  sidePanel: { flex: 1.2, minWidth: "300px" },
  panelCard: { background: "#1a1a1a", borderRadius: "16px", height: "550px", display: "flex", flexDirection: "column", overflow: "hidden" },
  tabHeader: { display: "flex", borderBottom: "1px solid #333", background: "#111" },
  tabBtn: { flex: 1, padding: "15px", background: "transparent", border: "none", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "14px" },
  panelBody: { padding: "20px", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  textArea: { width: "100%", flex: 1, background: "#111", border: "1px solid #333", borderRadius: "12px", padding: "15px", color: "white", fontSize: "14px", resize: "none", outline: "none", fontFamily: "sans-serif" },
  notesFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "15px" },
  saveBtn: { background: "#ff9800", color: "black", padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px" },
  chatContainer: { display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" },
  chatFeed: { flex: 1, overflowY: "auto", padding: "10px", display: "flex", flexDirection: "column", gap: "10px", scrollBehavior: "smooth" },
  chatBubble: { maxWidth: "85%", padding: "10px 14px", borderRadius: "12px", fontSize: "13px", lineHeight: "1.4", display: "flex", alignItems: "start" },
  chatInputBox: { display: "flex", gap: "10px", marginTop: "10px", borderTop: "1px solid #333", paddingTop: "10px" },
  chatInput: { flex: 1, background: "#111", border: "1px solid #333", padding: "10px", borderRadius: "8px", color: "white", outline: "none" },
  sendBtn: { background: "#2196f3", border: "none", color: "white", width: "40px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  clearBtn: { background: "none", border: "none", color: "#ff4444", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", opacity: 0.8 }
};

export default VideoPage;
