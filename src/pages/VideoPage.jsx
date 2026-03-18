import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, Minimize, FileText, Sparkles } from "lucide-react";
import { fetchVideoDetails, fetchChannelDetails } from "../services/youtube";
import { useAuth } from "../context/AuthContext";
import { toggleVideoInList, fetchVideoList } from "../services/userData";
import { getNoteForVideo } from "../utils/storage";

// MODULES
import VideoPlayer from "../modules/Video/VideoPlayer";
import VideoMetadata from "../modules/Video/VideoMetadata";
import NotesPanel from "../modules/Notes/NotesPanel";
import VideoAIChat from "../modules/AI/VideoAIChat";

export default function VideoPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const startTime = searchParams.get("t") || "0";
  const { user } = useAuth();

  const [video, setVideo] = useState(null);
  const [channel, setChannel] = useState(null);
  
  const [focusMode, setFocusMode] = useState(false);
  const [activeTab, setActiveTab] = useState("notes");
  
  const [noteText, setNoteText] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  // 🚀 DRAG TO RESIZE STATE (Now with LocalStorage Memory)
  const [panelWidth, setPanelWidth] = useState(() => {
    const savedWidth = localStorage.getItem("focus_panel_width");
    return savedWidth ? parseInt(savedWidth, 10) : 450;
  }); 
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const init = async () => {
      const vData = await fetchVideoDetails(id);
      setVideo(vData);
      
      const savedList = await fetchVideoList(user, 'saved');
      setIsSaved(savedList.some(v => (v.video_id || v.id) === id));
      
      const likedList = await fetchVideoList(user, 'liked');
      setIsLiked(likedList.some(v => (v.video_id || v.id) === id));

      const existingNote = getNoteForVideo(id);
      if (existingNote) setNoteText(existingNote.text);
      if (vData?.snippet?.channelId) {
        const cData = await fetchChannelDetails(vData.snippet.channelId);
        setChannel(cData);
        const followed = JSON.parse(localStorage.getItem("focus_following") || "[]");
        setIsFollowing(!!followed.find(c => c.id === vData.snippet.channelId));
      }
    };
    init();
  }, [id]);

  // 🚀 MEMOIZE THE PLAYER: Prevents iframe flickering during rapid panel resizing
  const memoizedPlayer = useMemo(() => {
    return <VideoPlayer id={id} video={video} startTime={startTime} focusMode={focusMode} user={user} />;
  }, [id, video, startTime, focusMode, user]);

  // 🚀 BUTTER-SMOOTH MOUSE DRAG LOGIC
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      // Calculate width from the right edge of the screen
      const newWidth = window.innerWidth - e.clientX - 40; 
      
      // Constrain panel width between 320px and 800px
      if (newWidth > 320 && newWidth < 800) {
        setPanelWidth(newWidth);
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      localStorage.setItem("focus_panel_width", panelWidth); // Save preference!
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none"; // Prevent highlighting text
    } else {
      document.body.style.userSelect = "auto";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, panelWidth]);

  if (!video) return <div style={styles.loading}>Initializing Focus Environment...</div>;

  return (
    <div style={focusMode ? styles.focusContainer : styles.pageWrapper}>
      {!focusMode && (
        <div style={styles.topNav}>
          <Link to="/classroom" style={styles.backBtn}><ArrowLeft size={18} /> Back to Classroom</Link>
        </div>
      )}

      {focusMode && (
        <button onClick={() => setFocusMode(false)} style={styles.exitFocusBtn}>
          <Minimize size={18} /> Exit Focus Mode
        </button>
      )}

      {/* 🚀 Dynamic Grid Layout */}
      <div style={{
        ...(focusMode ? styles.focusLayout : styles.dashboardLayout),
        gridTemplateColumns: `1fr ${panelWidth}px` 
      }}>
        
        {/* CRITICAL FIX: pointerEvents: isDragging ? "none" : "auto" 
          This prevents the YouTube iframe from stealing the mouse when dragging!
        */}
        <div style={{
          ...(focusMode ? styles.videoColumnFocus : styles.videoColumn),
          pointerEvents: isDragging ? "none" : "auto" 
        }}>
          {/* 🚀 Render the cached player instead of a fresh one */}
          {memoizedPlayer}
          
          {focusMode ? (
            <div style={{ marginTop: "24px" }}>
              <h1 style={{ fontSize: "20px", color: "#fff", margin: 0 }}>{video.snippet.title}</h1>
              <p style={{ color: "#888", fontSize: "14px", marginTop: "8px" }}>{video.snippet.channelTitle}</p>
            </div>
          ) : (
            <VideoMetadata 
              video={video} channel={channel} 
              isSaved={isSaved} 
              toggleSave={async () => {
                const added = await toggleVideoInList(user, video, 'saved');
                setIsSaved(added);
              }} 
              isLiked={isLiked} 
              toggleLike={async () => {
                const added = await toggleVideoInList(user, video, 'liked');
                setIsLiked(added);
              }} 
              isFollowing={isFollowing} toggleFollow={() => setIsFollowing(!isFollowing)} 
              setFocusMode={setFocusMode} 
            />
          )}
        </div>

        {/* SIDE PANEL */}
        <div style={focusMode ? styles.sidePanelFocus : styles.sidePanel}>
          
          {/* 🚀 THE DRAG HANDLE RESIZER */}
          <div 
            onMouseDown={(e) => { e.preventDefault(); setIsDragging(true); }}
            style={{...styles.resizer, background: isDragging ? "#2196f3" : "transparent"}}
            title="Drag to resize panel"
          >
            {/* Added a subtle visual indicator line so users know it's resizable */}
            <div style={{ width: "2px", height: "30px", background: isDragging ? "#fff" : "#333", borderRadius: "2px" }} />
          </div>

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
                <NotesPanel id={id} video={video} noteText={noteText} setNoteText={setNoteText} />
              ) : (
                <VideoAIChat id={id} video={video} noteText={noteText} setNoteText={setNoteText} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  // Removed `transition: "all 0.3s"` from here so dragging doesn't jitter
  pageWrapper: { background: "#050505", minHeight: "100vh", padding: "0 40px 40px 40px" },
  topNav: { padding: "20px 0", width: "100%" },
  dashboardLayout: { display: "grid", gap: "40px", maxWidth: "100%", margin: "0 auto", alignItems: "start" },
  videoColumn: { display: "flex", flexDirection: "column", minWidth: 0 },
  backBtn: { display: "inline-flex", alignItems: "center", gap: "8px", color: "#888", textDecoration: "none", fontSize: "14px", fontWeight: "600" },
  
  sidePanel: { position: "sticky", top: "30px", height: "calc(100vh - 100px)", display: "flex" },
  
  // 🚀 Improved Resizer Handle
  resizer: {
    position: "absolute",
    left: "-20px",
    top: "0",
    bottom: "0",
    width: "14px", // slightly wider for easier grabbing
    cursor: "col-resize",
    zIndex: 50,
    transition: "background 0.2s ease",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  panelCard: { flex: 1, background: "#0a0a0a", borderRadius: "24px", display: "flex", flexDirection: "column", overflow: "hidden", border: "1px solid #1a1a1a", minWidth: 0 },
  tabHeader: { display: "flex", background: "#000", padding: "8px", gap: "8px", flexShrink: 0 },
  tabBtn: { flex: 1, padding: "12px", border: "none", cursor: "pointer", fontWeight: "800", borderRadius: "14px", transition: "0.2s" },
  panelBody: { padding: "20px", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  loading: { height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#050505", color: "#fff", fontWeight: "800" },
  focusContainer: { position: "fixed", inset: 0, background: "#050505", zIndex: 1000, display: "flex", flexDirection: "column", padding: "60px 40px 40px 40px" },
  focusLayout: { display: "grid", gap: "40px", width: "100%", height: "100%", alignItems: "start" },
  videoColumnFocus: { display: "flex", flexDirection: "column", height: "100%", minWidth: 0 },
  exitFocusBtn: { position: "absolute", top: "20px", left: "40px", background: "rgba(255,255,255,0.05)", color: "#fff", border: "1px solid #333", padding: "10px 20px", borderRadius: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: "700", zIndex: 1001 },
  sidePanelFocus: { position: "sticky", top: "0px", height: "calc(100vh - 120px)", display: "flex" }
};