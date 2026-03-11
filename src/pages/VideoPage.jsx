import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import YouTube from "react-youtube";
import {
  ThumbsUp, Share2, Bookmark, Check, ChevronDown, ChevronUp,
  RotateCcw, FileText, Save, Sparkles, Send, Bot, Maximize, Minimize, ArrowLeft, Trash2, Paperclip, X, Download
} from "lucide-react";
import { fetchVideoDetails, fetchChannelDetails } from "../services/youtube";
import { toggleVault, isInVault, saveNote, getNoteForVideo, logWatchTime } from "../utils/storage";
import { getAIResponse } from "../services/gemini";

// 🚀 IMPORT THE PRO RENDERERS
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css'; // Don't forget the CSS for Math!

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
  const [descExpanded, setDescExpanded] = useState(false);

  const [chatMessages, setChatMessages] = useState(() => {
    const saved = localStorage.getItem(`chat_${id}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState(0);
  
  // 🚀 NEW: File Attachment State
  const [attachment, setAttachment] = useState(null); 
  // 🚀 NEW: State to hold the image when clicked
  const [expandedImage, setExpandedImage] = useState(null); 
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    let interval;
    if (video) {
      interval = setInterval(async () => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          try {
            const playerState = await playerRef.current.getPlayerState();
            if (playerState === 1) { logWatchTime(3); }
            const currentTime = await playerRef.current.getCurrentTime();
            if (currentTime > 5) {
              const history = JSON.parse(localStorage.getItem("focus_history") || "[]");
              const existingIdx = history.findIndex(v => v.id === id);
              const entry = {
                id, title: video.snippet.title, thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url,
                channel: video.snippet.channelTitle, duration: video.contentDetails?.duration || "0:00",
                timestamp: Date.now(), lastWatched: new Date().toISOString(), resumeTime: currentTime 
              };
              if (existingIdx > -1) { history[existingIdx] = { ...history[existingIdx], ...entry }; } 
              else { history.unshift(entry); }
              
              // Prevent LocalStorage Quota Exceeded by limiting history
              try { localStorage.setItem("focus_history", JSON.stringify(history.slice(0, 50))); } catch(e) {}
            }
          } catch (err) {}
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [video, id]);

  // 🚀 EMPIRE INDEXER: Auto-save chat and add to the global AI Insights list
  useEffect(() => {
    if (activeTab === "ai") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    try {
      // 1. Save the actual chat messages for this video
      localStorage.setItem(`chat_${id}`, JSON.stringify(chatMessages));

      // 2. If a real conversation has started (more than just the AI greeting), index it!
      // We check if video exists so we can grab the title and thumbnail for the Vault card.
      if (video && chatMessages.length > 1) {
        const chatIndex = JSON.parse(localStorage.getItem("focus_chat_index") || "[]");

        // If this video isn't in the index yet, add it to the very top
        if (!chatIndex.find(v => v.id === id)) {
          chatIndex.unshift({
            id,
            title: video.snippet.title,
            thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url,
            channel: video.snippet.channelTitle,
            timestamp: Date.now()
          });
          localStorage.setItem("focus_chat_index", JSON.stringify(chatIndex));
        } else {
          // Optional: Update the timestamp so active chats move to the top
          const updatedIndex = chatIndex.map(item =>
            item.id === id ? { ...item, timestamp: Date.now() } : item
          );
          // Sort to keep newest at top
          updatedIndex.sort((a, b) => b.timestamp - a.timestamp);
          localStorage.setItem("focus_chat_index", JSON.stringify(updatedIndex));
        }
      }
    } catch (e) {
      console.warn("Storage quota exceeded. Chat might not save permanently.");
    }
  }, [chatMessages, activeTab, id, video]);

  const clearChat = () => {
    if (window.confirm("Are you sure you want to clear your conversation?")) {
      const initialMsg = [{ role: "ai", text: "Chat cleared. How can I help you now?" }];
      setChatMessages(initialMsg);
      localStorage.removeItem(`chat_${id}`);
    }
  };

  // 🚀 NEW: Handle File Selection & Base64 Conversion
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachment({
        file: file,
        base64: reader.result,
        mimeType: file.type,
        name: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  // 🚀 THE FIX: Force Cross-Origin Image Downloads
  const handleImageDownload = async (e, imgUrl) => {
    e.preventDefault();  // Stop it from navigating away
    e.stopPropagation(); // Stop the lightbox from closing

    try {
      // Fetch the image as raw data
      const response = await fetch(imgUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      // Create a temporary hidden link and click it
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = imgUrl.split('/').pop().split('?')[0] || 'focus-ai-image.jpg';
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      // If the external server completely blocks hidden downloads (CORS), fallback to a new tab
      console.warn("Server blocked direct download, opening raw image instead.");
      window.open(imgUrl, '_blank');
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() && !attachment) return;
    const now = Date.now();
    if (now - lastMessageTime < 2000) return;
    setLastMessageTime(now);

    const userMsg = { 
      role: "user", 
      text: chatInput,
      attachment: attachment ? { base64: attachment.base64, mimeType: attachment.mimeType, name: attachment.name } : null
    };
    
    setChatMessages(prev => [...prev, userMsg]);
    const currentQuery = chatInput;
    const currentAttachment = attachment;
    
    setChatInput("");
    setAttachment(null);
    setIsTyping(true);

    // 🚀 THE FIX: We pass 'chatMessages' right before the attachment!
    const aiText = await getAIResponse(
      video.snippet.title,
      video.snippet.description,
      currentQuery,
      noteText,
      chatMessages, // 🧠 Injecting the memory here!
      currentAttachment
    );

    if (aiText.includes("[UPDATED_NOTE]")) {
      const parts = aiText.split("[UPDATED_NOTE]");
      setNoteText(parts[1].trim());
      setChatMessages(prev => [...prev, { role: "ai", text: parts[0] + "\n\n✅ *Action: I've updated your notes panel.*" }]);
    } else {
      setChatMessages(prev => [...prev, { role: "ai", text: aiText }]);
    }
    setIsTyping(false);
  };

  const [isSaved, setIsSaved] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

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
      if (!localStorage.getItem(`chat_${id}`)) {
        setChatMessages([{ role: "ai", text: `Ready to analyze "${vData?.snippet?.title || 'this video'}". What's confusing you?` }]);
      }
    };
    init();
    setIsVideoEnded(false);
  }, [id]);

  const handleSaveNote = () => {
    saveNote({ id, title: video.snippet.title, thumbnail: video.snippet.thumbnails.high?.url, channel: video.snippet.channelTitle }, noteText);
    setNoteStatus("Saved! ✅");
    setTimeout(() => setNoteStatus(""), 2000);
  };

  const toggleSave = () => setIsSaved(toggleVault({ id, title: video.snippet.title, thumbnail: video.snippet.thumbnails.high?.url, channel: video.snippet.channelTitle, duration: video.contentDetails?.duration, timestamp: Date.now() }));
  const toggleLike = () => {
    const liked = JSON.parse(localStorage.getItem("liked_videos") || "[]");
    const updated = isLiked ? liked.filter(v => v.id !== id) : [{ id, title: video.snippet.title, thumbnail: video.snippet.thumbnails.high?.url, channel: video.snippet.channelTitle, duration: video.contentDetails?.duration }, ...liked];
    localStorage.setItem("liked_videos", JSON.stringify(updated));
    setIsLiked(!isLiked);
  };

  const toggleFollow = () => {
    if (!channel) return;
    const followed = JSON.parse(localStorage.getItem("focus_following") || "[]");
    const updated = isFollowing ? followed.filter(c => c.id !== channel.id) : [...followed, { id: channel.id, title: channel.snippet.title, thumbnail: channel.snippet.thumbnails.default?.url }];
    localStorage.setItem("focus_following", JSON.stringify(updated));
    setIsFollowing(!isFollowing);
  };

  if (!video) return <div style={styles.loading}>Initializing Focus Environment...</div>;

  return (
    <div style={focusMode ? styles.focusContainer : styles.pageWrapper}>
      {!focusMode && (
        <div style={styles.topNav}>
          <Link to="/classroom" style={styles.backBtn}><ArrowLeft size={18} /> Back to Classroom</Link>
        </div>
      )}

      {/* 🚀 FOCUS MODE EXIT BUTTON */}
      {focusMode && (
        <button onClick={() => setFocusMode(false)} style={styles.exitFocusBtn}>
          <Minimize size={18} /> Exit Focus Mode
        </button>
      )}

      <div style={focusMode ? styles.focusLayout : styles.dashboardLayout}>
        <div style={focusMode ? styles.videoColumnFocus : styles.videoColumn}>
          <div style={focusMode ? styles.playerWrapperFocus : styles.playerWrapper}>
            <YouTube
              videoId={id}
              opts={{ height: '100%', width: '100%', playerVars: { autoplay: 1, start: parseInt(startTime) || 0, modestbranding: 1, rel: 0 } }}
              onReady={(e) => { 
                playerRef.current = e.target; 
                const startSecs = parseInt(startTime, 10);
                if (startSecs > 0) e.target.seekTo(startSecs, true);
              }}
              onStateChange={(e) => { if (e.data === 0) setIsVideoEnded(true); }}
              className="youtube-player"
              style={{ width: "100%", height: "100%" }}
            />
            {isVideoEnded && (
              <div style={styles.endOverlay}>
                <h2>Session Complete! 🎉</h2>
                <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
                  <button onClick={() => window.location.reload()} style={styles.overlayBtn}><RotateCcw size={20} /> Replay</button>
                  <Link to="/classroom" style={{ ...styles.overlayBtn, background: "#4caf50", color: "white", textDecoration: "none" }}>Next Lesson</Link>
                </div>
              </div>
            )}
          </div>

          {focusMode && (
            <div style={{ marginTop: "24px" }}>
              <h1 style={{ ...styles.title, fontSize: "20px" }}>{video.snippet.title}</h1>
              <p style={{ color: "#888", fontSize: "14px", marginTop: "8px" }}>{video.snippet.channelTitle}</p>
            </div>
          )}

          {!focusMode && (
            <div style={styles.infoSection}>
              <div style={styles.headerRow}>
                <h1 style={styles.title}>{video.snippet.title}</h1>
                <button onClick={() => setFocusMode(true)} style={styles.focusBtn}><Maximize size={18} /> Focus Mode</button>
              </div>

              <div style={styles.metaRow}>
                <div style={styles.leftMeta}>
                  <Link to={`/channel/${video.snippet.channelId}`} style={styles.channelInfo}>
                    <img src={channel?.snippet?.thumbnails?.default?.url} style={styles.avatar} alt="Channel" />
                    <div>
                      <h3 style={styles.channelName}>{video.snippet.channelTitle}</h3>
                      <p style={styles.subCount}>{Number(channel?.statistics?.subscriberCount).toLocaleString()} subs</p>
                    </div>
                  </Link>
                  <button onClick={toggleFollow} style={{ ...styles.followBtn, background: isFollowing ? "#333" : "white", color: isFollowing ? "white" : "black" }}>
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                </div>
                <div style={styles.actions}>
                  <button onClick={toggleLike} style={{ ...styles.btn, background: isLiked ? "white" : "#111", color: isLiked ? "black" : "white" }}><ThumbsUp size={18} /> {isLiked ? "Liked" : "Like"}</button>
                  <button onClick={toggleSave} style={{ ...styles.btn, background: isSaved ? "white" : "#111", color: isSaved ? "black" : "white" }}>{isSaved ? <Check size={18} /> : <Bookmark size={18} />} {isSaved ? "Saved" : "Save"}</button>
                  <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert("Copied!"); }} style={styles.btn}><Share2 size={18} /> Share</button>
                </div>
              </div>

              <div style={styles.descBox}>
                <p style={styles.descText}>
                  {(() => {
                    const text = descExpanded ? video.snippet.description : video.snippet.description.slice(0, 180) + "...";
                    // 🚀 REGEX: Identify URLs and convert them into clickable <a> tags
                    const urlRegex = /(https?:\/\/[^\s]+)/g;
                    return text.split(urlRegex).map((part, i) => {
                      if (part.match(urlRegex)) {
                        return <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: "#2196f3", textDecoration: "underline" }}>{part}</a>;
                      }
                      return part;
                    });
                  })()}
                </p>
                <button onClick={() => setDescExpanded(!descExpanded)} style={styles.showMoreBtn}>{descExpanded ? "Show Less" : "Show More"}</button>
              </div>
            </div>
          )}
        </div>

        <div style={focusMode ? styles.sidePanelFocus : styles.sidePanel}>
          <div style={styles.panelCard}>
            <div style={styles.tabHeader}>
              <button onClick={() => setActiveTab("notes")} style={{ ...styles.tabBtn, background: activeTab === "notes" ? "rgba(255, 152, 0, 0.15)" : "transparent", color: activeTab === "notes" ? "#ff9800" : "#666" }}>
                <FileText size={16} /> My Notes
              </button>
              <button onClick={() => setActiveTab("ai")} style={{ ...styles.tabBtn, background: activeTab === "ai" ? "rgba(33, 150, 243, 0.15)" : "transparent", color: activeTab === "ai" ? "#2196f3" : "#666" }}>
                <Sparkles size={16} /> Focus AI
              </button>
            </div>

            <div style={styles.panelBody}>
              {activeTab === "notes" ? (
                <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                  <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Type key takeaways here..." style={styles.textArea} />
                  <div style={styles.notesFooter}>
                    <span style={{ color: "#4caf50", fontWeight: "bold" }}>{noteStatus}</span>
                    <button onClick={handleSaveNote} style={styles.saveBtn}><Save size={16}/> Save Note</button>
                  </div>
                </div>
              ) : (
                <div style={styles.chatContainer}>
                  <div style={{ display: "flex", justifyContent: "flex-end", paddingBottom: "10px" }}><button onClick={clearChat} style={styles.clearBtn}><Trash2 size={14} /> Clear</button></div>
                  
                  {/* 🚀 THE NEW CHAT FEED WITH MARKDOWN & FILES */}
                  <div style={styles.chatFeed}>
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} style={{ ...styles.chatBubble, ...(msg.role === "user" ? styles.userBubble : styles.aiBubble) }}>
                        {msg.role === "ai" && <div style={{ color: "#2196f3", fontSize: "11px", fontWeight: "900", marginBottom: "6px" }}>FOCUS AI</div>}
                        
                        {/* Render Uploaded Image/File */}
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

                        {/* Render Text with Markdown, KaTeX & Custom Images */}
                        <div className="markdown-body">
                          <ReactMarkdown
                            remarkPlugins={[remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={{
                              // 🚀 NEW: Force links to open in a new tab
                              a: ({ node, children, ...props }) => (
                                <a {...props} target="_blank" rel="noopener noreferrer">
                                  {children}
                                </a>
                              ),
                              // 🚀 FIX: Prevent hydration error (div inside p) by using span
                              img: ({ node, src, alt, ...props }) => (
                                <span style={{ position: "relative", display: "inline-block", margin: "10px 0" }}>
                                  <img
                                    src={src}
                                    alt={alt}
                                    referrerPolicy="no-referrer"
                                    style={{ width: "220px", height: "140px", objectFit: "cover", borderRadius: "12px", cursor: "zoom-in", border: "1px solid #333" }}
                                    onClick={() => setExpandedImage(src)}
                                    title="Click to expand"
                                  />
                                  {/* Quick Download Button on Thumbnail */}
                                  <button
                                    onClick={(e) => handleImageDownload(e, src)}
                                    style={{ position: "absolute", bottom: "8px", right: "8px", background: "rgba(0,0,0,0.8)", padding: "6px", borderRadius: "8px", color: "#fff", display: "flex", border: "none", cursor: "pointer" }}
                                    title="Download Image"
                                  >
                                    <Download size={14} />
                                  </button>
                                </span>
                              )
                            }}
                          >
                            {msg.text}
                          </ReactMarkdown>
                        </div>
                      </div>
                    ))}
                    {isTyping && <div style={{...styles.chatBubble, ...styles.aiBubble, opacity: 0.5}}>Synthesizing...</div>}
                    <div ref={chatEndRef} />
                  </div>

                  {/* 🚀 THE NEW INPUT BOX WITH ATTACHMENTS */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
                    {attachment && (
                      <div style={styles.attachmentPreview}>
                        <span style={{ fontSize: "12px", color: "#ddd", truncate: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                          📎 {attachment.name}
                        </span>
                        <button onClick={() => setAttachment(null)} style={{ background: "none", border: "none", color: "#ff4444", cursor: "pointer" }}><X size={14} /></button>
                      </div>
                    )}
                    
                    <div style={styles.chatInputBox}>
                      <button onClick={() => fileInputRef.current.click()} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", display: "flex", alignItems: "center" }}>
                        <Paperclip size={20} />
                      </button>
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} accept="image/*,.pdf,.txt" />
                      
                      <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} style={styles.chatInput} placeholder="Ask FocusAI anything..." />
                      <button onClick={handleSendMessage} style={styles.sendBtn}><Send size={18}/></button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 🚀 THE LIGHTBOX MODAL: Renders when an image is clicked */}
      {expandedImage && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}
          onClick={() => setExpandedImage(null)}
        >
          <button style={{ position: "absolute", top: "30px", right: "40px", background: "none", border: "none", color: "white", cursor: "pointer" }}>
            <X size={32} />
          </button>

          <img
            src={expandedImage}
            style={{ maxWidth: "90%", maxHeight: "80vh", borderRadius: "16px", objectFit: "contain", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}
            alt="Expanded view"
          />

          <div style={{ marginTop: "24px", display: "flex", gap: "15px" }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => handleImageDownload(e, expandedImage)}
              style={{ background: "#2196f3", padding: "12px 24px", borderRadius: "12px", color: "white", border: "none", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
            >
              <Download size={18} /> Download Original
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Global CSS injection to handle markdown spacing nicely inside chat bubbles
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  .markdown-body p { margin: 0 0 8px 0; }
  .markdown-body p:last-child { margin: 0; }
  .markdown-body ul, .markdown-body ol { margin: 4px 0 8px 20px; padding: 0; }
  .markdown-body li { margin-bottom: 4px; }
  .markdown-body a { color: #4caf50; text-decoration: underline; }
  /* 🚀 THE FIX: Force AI images to fit perfectly inside the chat bubble */
  .markdown-body img { max-width: 100%; height: auto; border-radius: 12px; margin-top: 10px; border: 1px solid rgba(255,255,255,0.1); }
`;
document.head.appendChild(styleSheet);

const styles = {
  pageWrapper: { background: "#050505", minHeight: "100vh", padding: "0 40px 40px 40px" },
  topNav: { padding: "20px 0", width: "100%" },
  dashboardLayout: { display: "grid", gridTemplateColumns: "1fr 450px", gap: "40px", maxWidth: "100%", margin: "0 auto", alignItems: "start" },
  videoColumn: { display: "flex", flexDirection: "column", minWidth: 0 },
  playerWrapper: { position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: "24px", overflow: "hidden", background: "black", boxShadow: "0 20px 50px rgba(0,0,0,0.5)", border: "1px solid #111" },
  endOverlay: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.95)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 10 },
  overlayBtn: { display: "flex", alignItems: "center", gap: "10px", padding: "14px 28px", borderRadius: "30px", border: "none", cursor: "pointer", background: "white", color: "black", fontWeight: "bold" },
  infoSection: { marginTop: "24px" },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "16px" },
  title: { fontSize: "24px", fontWeight: "800", margin: 0, flex: 1, color: "#fff" },
  focusBtn: { background: "rgba(255,255,255,0.05)", color: "#fff", border: "1px solid #333", padding: "10px 20px", borderRadius: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: "700" },
  backBtn: { display: "inline-flex", alignItems: "center", gap: "8px", color: "#888", textDecoration: "none", fontSize: "14px", fontWeight: "600" },
  metaRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" },
  leftMeta: { display: "flex", alignItems: "center", gap: "16px" },
  channelInfo: { display: "flex", alignItems: "center", gap: "16px", textDecoration: "none", color: "white" },
  avatar: { width: "52px", height: "52px", borderRadius: "50%", border: "2px solid #222" },
  channelName: { fontSize: "17px", fontWeight: "700", margin: 0 },
  subCount: { fontSize: "13px", color: "#666", margin: 0 },
  actions: { display: "flex", gap: "12px" },
  btn: { display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "14px", border: "1px solid #222", fontWeight: "700", cursor: "pointer", fontSize: "14px" },
  followBtn: { padding: "10px 24px", borderRadius: "14px", border: "none", fontWeight: "800", cursor: "pointer" },
  descBox: { background: "#0a0a0a", padding: "20px", borderRadius: "18px", border: "1px solid #1a1a1a" },
  descText: { margin: 0, whiteSpace: "pre-wrap", fontSize: "14px", lineHeight: "1.7", color: "#fff" },
  showMoreBtn: { background: "none", border: "none", color: "#fff", marginTop: "12px", cursor: "pointer", fontWeight: "700" },

  sidePanel: { flex: 1.2, minWidth: "450px", height: "calc(100vh - 100px)", position: "sticky", top: "30px" },
  panelCard: { background: "#0a0a0a", borderRadius: "24px", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", border: "1px solid #1a1a1a" },
  tabHeader: { display: "flex", background: "#000", padding: "8px", gap: "8px" },
  tabBtn: { flex: 1, padding: "12px", border: "none", cursor: "pointer", fontWeight: "800", borderRadius: "14px" },
  panelBody: { padding: "20px", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  textArea: { width: "100%", flex: 1, background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: "18px", padding: "20px", color: "#fff", fontSize: "15px", resize: "none", outline: "none", lineHeight: "1.8" },
  notesFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" },
  saveBtn: { background: "#ff9800", color: "black", padding: "12px 24px", borderRadius: "14px", border: "none", cursor: "pointer", fontWeight: "900" },
  
  chatContainer: { display: "flex", flexDirection: "column", height: "100%" },
  chatFeed: { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" },
  chatBubble: { maxWidth: "88%", padding: "14px 18px", fontSize: "14.5px", lineHeight: "1.6", color: "#fff", wordBreak: "break-word" },
  userBubble: { alignSelf: "flex-end", background: "#2196f3", borderRadius: "22px 22px 4px 22px", boxShadow: "0 8px 16px rgba(33, 150, 243, 0.2)" },
  aiBubble: { alignSelf: "flex-start", background: "#1a1a1a", borderRadius: "22px 22px 22px 4px", border: "1px solid #222" },
  
  // 🚀 New Attachment UI
  attachmentPreview: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#222", padding: "8px 12px", borderRadius: "10px", border: "1px solid #333" },
  chatInputBox: { display: "flex", gap: "12px", padding: "10px", background: "#0d0d0d", borderRadius: "18px", border: "1px solid #1a1a1a", alignItems: "center" },
  chatInput: { flex: 1, background: "transparent", border: "none", padding: "8px", color: "white", outline: "none", fontSize: "14px" },
  sendBtn: { background: "#2196f3", border: "none", color: "white", width: "44px", height: "44px", borderRadius: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  clearBtn: { background: "rgba(255, 68, 68, 0.1)", border: "none", color: "#ff4444", padding: "6px 12px", borderRadius: "10px", cursor: "pointer", fontWeight: "700" },
  loading: { height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#050505", color: "#fff", fontWeight: "800" },
  focusContainer: { position: "fixed", inset: 0, background: "#050505", zIndex: 1000, display: "flex", flexDirection: "column", padding: "60px 40px 40px 40px" },
  focusLayout: { display: "grid", gridTemplateColumns: "1fr 450px", gap: "40px", width: "100%", height: "100%", alignItems: "start" },
  videoColumnFocus: { display: "flex", flexDirection: "column", height: "100%" },
  playerWrapperFocus: { position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: "24px", overflow: "hidden", background: "black", boxShadow: "0 20px 50px rgba(0,0,0,0.8)", border: "1px solid #222" },
  exitFocusBtn: { position: "absolute", top: "20px", left: "40px", background: "rgba(255,255,255,0.05)", color: "#fff", border: "1px solid #333", padding: "10px 20px", borderRadius: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: "700", zIndex: 1001 },
  sidePanelFocus: { flex: 1.2, minWidth: "450px", height: "calc(100vh - 120px)", position: "sticky", top: "0px" }
};

export default VideoPage;
