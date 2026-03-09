import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ThumbsUp, Share2, Plus, Check, ChevronDown, ChevronUp } from "lucide-react";
import { fetchVideoDetails, fetchChannelDetails, updateWatchHistory } from "../services/youtube";
import NotesPanel from "../components/addons/NotesPanel";
import LiveChat from "../components/LiveChat"; // ✅ Import Chat

function LivePlayer() {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const [channel, setChannel] = useState(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const init = async () => {
      const vData = await fetchVideoDetails(id);
      setVideo(vData);

      if (vData?.snippet?.channelId) {
        const cData = await fetchChannelDetails(vData.snippet.channelId);
        setChannel(cData);
      }
      // Check Saved State
      const saved = JSON.parse(localStorage.getItem("vault_videos") || "[]");
      setIsSaved(!!saved.find(v => v.id === id));
    };
    init();
  }, [id]);

  const toggleSave = () => {
    const saved = JSON.parse(localStorage.getItem("vault_videos") || "[]");
    const newVideo = { id, title: video.snippet.title, thumbnail: video.snippet.thumbnails.high?.url, channel: video.snippet.channelTitle };
    const updated = isSaved ? saved.filter(v => v.id !== id) : [newVideo, ...saved];
    localStorage.setItem("vault_videos", JSON.stringify(updated));
    setIsSaved(!isSaved);
  };

  if (!video) return <div style={{ padding: "40px", color: "white" }}>Loading Stream...</div>;

  return (
    <div style={styles.container}>
      {/* LEFT: Video, Info, Desc, NOTES */}
      <div style={styles.mainContent}>
        {/* 1. Video Player */}
        <iframe 
          src={`https://www.youtube.com/embed/${id}?autoplay=1`} 
          style={styles.iframe} 
          allowFullScreen 
        />
        
        {/* 2. Title & Channel Info */}
        <h1 style={styles.title}>{video.snippet.title}</h1>
        
        <div style={styles.metaRow}>
          <div style={styles.leftMeta}>
            <Link to={`/channel/${video.snippet.channelId}`} style={styles.channelInfo}>
              <img src={channel?.snippet?.thumbnails?.default?.url} style={styles.avatar} />
              <div>
                <h3 style={styles.channelName}>{video.snippet.channelTitle}</h3>
                <p style={styles.subCount}>{channel?.statistics?.subscriberCount} subscribers</p>
              </div>
            </Link>
            <span style={styles.liveBadge}>🔴 LIVE</span>
          </div>

          <div style={styles.actions}>
            <button style={styles.btn}><ThumbsUp size={18} /> {video.statistics.likeCount}</button>
            <button onClick={toggleSave} style={styles.btn}>
               {isSaved ? <Check size={18} /> : <Plus size={18} />} Save
            </button>
            <button style={styles.btn}><Share2 size={18} /> Share</button>
          </div>
        </div>
        
        {/* 3. Description Box */}
        <div style={styles.descBox}>
           <div style={styles.statsRow}>
              <span>Started streaming {new Date(video.snippet.publishedAt).toLocaleDateString()}</span>
              <span>{Number(video.statistics.viewCount).toLocaleString()} watching</span>
           </div>
           <p style={styles.descText}>
             {descExpanded ? video.snippet.description : video.snippet.description.slice(0, 150) + "..."}
           </p>
           <button onClick={() => setDescExpanded(!descExpanded)} style={styles.showMoreBtn}>
             {descExpanded ? "Show Less" : "Show More"} {descExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
           </button>
        </div>

        {/* 4. ✅ NOTES PANEL (Moved Below Description) */}
        <div style={{ marginTop: "24px" }}>
           <h3 style={{fontSize: "18px", marginBottom: "15px"}}>Study Notes</h3>
           {/* Height limited so it doesn't stretch infinitely */}
           <div style={{ height: "400px" }}>
             <NotesPanel videoId={id} videoTitle={video.snippet.title} />
           </div>
        </div>
      </div>

      {/* RIGHT: Live Chat (Replaces Sidebar) */}
      <div style={styles.sidePanel}>
        <LiveChat />
      </div>
    </div>
  );
}

const styles = {
  container: { display: "flex", gap: "24px", padding: "24px", maxWidth: "1600px", margin: "0 auto", color: "white", flexWrap: "wrap" },
  mainContent: { flex: 3, minWidth: "600px" },
  iframe: { width: "100%", aspectRatio: "16/9", borderRadius: "16px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.5)" },
  title: { fontSize: "20px", fontWeight: "700", marginTop: "16px", marginBottom: "12px" },
  metaRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  leftMeta: { display: "flex", alignItems: "center", gap: "12px" },
  channelInfo: { display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", color: "white" },
  avatar: { width: "40px", height: "40px", borderRadius: "50%" },
  channelName: { fontSize: "16px", fontWeight: "600", margin: 0 },
  subCount: { fontSize: "12px", color: "#aaa", margin: 0 },
  liveBadge: { background: "#cc0000", color: "white", padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold", marginLeft: "10px" },
  actions: { display: "flex", gap: "10px" },
  btn: { display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "20px", border: "none", background: "#222", color: "white", fontWeight: "600", cursor: "pointer" },
  descBox: { background: "#1a1a1a", padding: "15px", borderRadius: "12px", marginTop: "15px" },
  statsRow: { display: "flex", gap: "15px", fontSize: "14px", fontWeight: "bold", marginBottom: "10px", color: "#ddd" },
  descText: { margin: 0, whiteSpace: "pre-wrap", fontSize: "14px", lineHeight: "1.5" },
  showMoreBtn: { background: "none", border: "none", color: "white", marginTop: "10px", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: "5px" },
  sidePanel: { flex: 1.2, minWidth: "300px", height: "fit-content", position: "sticky", top: "20px" } // Sticky chat
};

export default LivePlayer;