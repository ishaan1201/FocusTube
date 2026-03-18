import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchVideoList } from "../services/userData";
import VideoCard from "../components/VideoCard";
import { Heart, Loader } from "lucide-react";

function LikedPage() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLikedVideos = async () => {
      setLoading(true);
      // Fetch from our hybrid service
      const rawData = await fetchVideoList(user, 'liked');
      
      // Transform the flat database row back into the YouTube API format 
      // so your <VideoCard /> component can read it without crashing
      const formattedVideos = rawData.map(v => ({
        id: { videoId: v.video_id || v.id }, 
        snippet: {
          title: v.title,
          thumbnails: { high: { url: v.thumbnail_url || v.thumbnail } },
          channelTitle: v.channel || "Liked Content",
          publishedAt: v.saved_at || new Date().toISOString()
        },
        duration: v.duration || "0:00"
      }));
      
      setVideos(formattedVideos);
      setLoading(false);
    };

    loadLikedVideos();
  }, [user]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Heart size={28} color="#ff4444" fill="#ff4444" />
        <h1 style={styles.title}>Liked Videos</h1>
      </div>

      {loading ? (
        <div style={styles.center}><Loader className="animate-spin" /> Fetching your favorites...</div>
      ) : videos.length > 0 ? (
        <div style={styles.grid}>
          {videos.map((video, idx) => (
            <VideoCard key={idx} video={video} />
          ))}
        </div>
      ) : (
        <p style={styles.emptyText}>You haven't liked any videos yet.</p>
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
  emptyText: { color: "#888", fontSize: "16px" }
};

export default LikedPage;
