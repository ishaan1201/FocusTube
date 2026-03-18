import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchVideoList, toggleVideoInList } from "../services/userData";
import VideoCard from "../components/VideoCard";
import { Bookmark, Loader, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

function SavedPage() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSavedVideos = async () => {
    setLoading(true);
    const rawData = await fetchVideoList(user, 'saved');
    
    const formattedVideos = rawData.map(v => ({
      id: { videoId: v.video_id || v.id }, 
      snippet: {
        title: v.title,
        thumbnails: { high: { url: v.thumbnail_url || v.thumbnail } },
        channelTitle: v.channel || "Saved Content",
        publishedAt: v.saved_at || new Date().toISOString()
      },
      duration: v.duration || "0:00"
    }));
    
    setVideos(formattedVideos);
    setLoading(false);
  };

  useEffect(() => {
    loadSavedVideos();
  }, [user]);

  const handleRemove = async (e, video) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleVideoInList(user, video, 'saved');
    loadSavedVideos();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Bookmark size={28} color="#4caf50" fill="#4caf50" />
        <h1 style={styles.title}>Saved Videos</h1>
      </div>

      {loading ? (
        <div style={styles.center}><Loader className="animate-spin" /> Fetching your vault...</div>
      ) : videos.length > 0 ? (
        <div style={styles.grid}>
          {videos.map((video, idx) => (
            <div key={idx} style={{ position: 'relative' }}>
              <VideoCard video={video} />
              <button 
                onClick={(e) => handleRemove(e, video)}
                style={styles.removeBtn}
                title="Remove from Saved"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.emptyState}>
          <Bookmark size={48} color="#333" />
          <h3>No saved videos</h3>
          <Link to="/" style={styles.exploreBtn}>Explore Content</Link>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: "40px", color: "white" },
  header: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "30px" },
  title: { fontSize: "32px", fontWeight: "900", margin: 0 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" },
  center: { display: "flex", justifyContent: "center", padding: "40px", color: "#888", gap: "10px" },
  emptyState: { textAlign: "center", padding: "60px", background: "#111", borderRadius: "20px", marginTop: "20px" },
  exploreBtn: { display: "inline-block", marginTop: "20px", background: "#4caf50", color: "white", padding: "10px 24px", borderRadius: "30px", textDecoration: "none" },
  removeBtn: { 
    position: "absolute", 
    top: "8px", 
    left: "8px", 
    background: "rgba(255, 68, 68, 0.9)", 
    color: "white", 
    border: "none", 
    borderRadius: "50%", 
    width: "28px", 
    height: "28px", 
    cursor: "pointer", 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center",
    zIndex: 20,
    boxShadow: "0 2px 10px rgba(0,0,0,0.3)"
  }
};

export default SavedPage;
