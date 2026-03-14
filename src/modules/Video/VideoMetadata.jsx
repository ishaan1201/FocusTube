import { useState } from "react";
import { Link } from "react-router-dom";
import { ThumbsUp, Bookmark, Check, Share2, Maximize } from "lucide-react";

export default function VideoMetadata({ video, channel, isSaved, toggleSave, isLiked, toggleLike, isFollowing, toggleFollow, setFocusMode }) {
  const [descExpanded, setDescExpanded] = useState(false);

  return (
    <div style={styles.infoSection}>
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
              <p style={styles.subCount}>{Number(channel?.statistics?.subscriberCount || 0).toLocaleString()} subs</p>
            </div>
          </Link>
          <button onClick={toggleFollow} style={{ ...styles.followBtn, background: isFollowing ? "#333" : "white", color: isFollowing ? "white" : "black" }}>
            {isFollowing ? "Following" : "Follow"}
          </button>
        </div>
        
        <div style={styles.actions}>
          <button onClick={toggleLike} style={{ ...styles.btn, background: isLiked ? "white" : "#111", color: isLiked ? "black" : "white" }}>
            <ThumbsUp size={18} /> {isLiked ? "Liked" : "Like"}
          </button>
          <button onClick={toggleSave} style={{ ...styles.btn, background: isSaved ? "white" : "#111", color: isSaved ? "black" : "white" }}>
            {isSaved ? <Check size={18} /> : <Bookmark size={18} />} {isSaved ? "Saved" : "Save"}
          </button>
          <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert("Copied!"); }} style={styles.btn}>
            <Share2 size={18} /> Share
          </button>
        </div>
      </div>

      <div style={styles.descBox}>
        <p style={styles.descText}>
          {(() => {
            const text = descExpanded ? video.snippet.description : video.snippet.description.slice(0, 180) + "...";
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            return text.split(urlRegex).map((part, i) => {
              if (part.match(urlRegex)) {
                return <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: "#2196f3", textDecoration: "underline" }}>{part}</a>;
              }
              return part;
            });
          })()}
        </p>
        <button onClick={() => setDescExpanded(!descExpanded)} style={styles.showMoreBtn}>
          {descExpanded ? "Show Less" : "Show More"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  infoSection: { marginTop: "24px" },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "16px" },
  title: { fontSize: "24px", fontWeight: "800", margin: 0, flex: 1, color: "#fff" },
  focusBtn: { background: "rgba(255,255,255,0.05)", color: "#fff", border: "1px solid #333", padding: "10px 20px", borderRadius: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: "700" },
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
};