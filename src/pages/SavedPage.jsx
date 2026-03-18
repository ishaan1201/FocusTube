import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, Bookmark } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { fetchVideoList, toggleVideoInList } from "../services/userData";

function SavedPage() {
  const { user } = useAuth();
  const [savedVideos, setSavedVideos] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchVideoList(user, 'saved');
      setSavedVideos(data);
    };
    loadData();
  }, [user]);

  const removeVideo = async (e, video) => {
    e.preventDefault();
    await toggleVideoInList(user, video, 'saved');
    const data = await fetchVideoList(user, 'saved');
    setSavedVideos(data);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>Saved Videos</h1>
      
      {savedVideos.length === 0 ? (
        <div style={styles.emptyState}>
          <Bookmark size={48} color="#333" />
          <h3>No saved videos</h3>
          <Link to="/" style={styles.exploreBtn}>Explore Content</Link>
        </div>
      ) : (
        <div style={styles.grid}>
          {savedVideos.map((video) => (
            <Link to={`/video/${video.video_id || video.id}`} key={video.video_id || video.id} style={styles.card}>
              <div style={styles.thumbWrapper}>
                <img src={video.thumbnail_url || video.thumbnail} alt={video.title} style={styles.thumb} />
                <button onClick={(e) => removeVideo(e, video)} style={styles.removeBtn}>
                  <Trash2 size={16} />
                </button>
              </div>
              <div style={styles.info}>
                <h3 style={styles.cardTitle}>{video.title}</h3>
                <p style={styles.channel}>{video.channel}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: "40px", color: "white" },
  pageTitle: { fontSize: "32px", fontWeight: "bold", marginBottom: "30px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "20px" },
  card: { textDecoration: "none", color: "white", background: "#1a1a1a", borderRadius: "12px", overflow: "hidden", display: "block" },
  thumbWrapper: { position: "relative", aspectRatio: "16/9" },
  thumb: { width: "100%", height: "100%", objectFit: "cover" },
  removeBtn: { position: "absolute", top: "10px", right: "10px", background: "rgba(0,0,0,0.6)", color: "#ff4444", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  info: { padding: "12px" },
  cardTitle: { fontSize: "14px", fontWeight: "bold", margin: "0 0 5px" },
  channel: { fontSize: "12px", color: "#aaa" },
  emptyState: { textAlign: "center", padding: "60px", background: "#111", borderRadius: "20px", marginTop: "20px" },
  exploreBtn: { display: "inline-block", marginTop: "20px", background: "#4caf50", color: "white", padding: "10px 24px", borderRadius: "30px", textDecoration: "none" }
};

export default SavedPage;