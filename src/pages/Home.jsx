import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { fetchSearchVideos } from "../services/youtube";
import useInfiniteScroll from "../hooks/useInfiniteScroll"; // ✅ Import Hook
import { Play } from "lucide-react";

function Home({ query }) {
  const [videos, setVideos] = useState([]);
  const [pageToken, setPageToken] = useState(""); // 🔄 Track pagination
  const [loading, setLoading] = useState(true);

  // 1️⃣ Initial Load
  useEffect(() => {
    const loadVideos = async () => {
      setLoading(true);
      // If user typed in search bar, use that. Otherwise use defaults.
      const search = query || "science|technology|coding|documentary|history|math";
      
      // Reset page token for new searches
      const data = await fetchSearchVideos(search, ""); 
      
      setVideos(data.items || []);
      setPageToken(data.nextPageToken || "");
      setLoading(false);
    };

    loadVideos();
  }, [query]); 

  // 2️⃣ Infinite Scroll Logic
  const fetchMore = useCallback(async () => {
    if (!pageToken) return;

    const search = query || "science|technology|coding|documentary|history|math";
    const data = await fetchSearchVideos(search, pageToken);
    
    // Append new videos to existing list
    setVideos(prev => [...prev, ...data.items]);
    setPageToken(data.nextPageToken || "");
  }, [pageToken, query]);

  // ✅ Hook into scroll event
  useInfiniteScroll(fetchMore);

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>Top Picks for Learning</h1>
      
      <div style={styles.grid}>
        {videos.map((video) => (
          <Link to={`/video/${video.id.videoId}`} key={video.id.videoId} style={styles.card}>
            <div style={styles.thumbnailWrapper}>
              <img 
                src={video.snippet.thumbnails.high.url} 
                style={styles.img} 
                alt={video.snippet.title} 
              />
              {/* ✅ REAL DURATION DISPLAY */}
              <div style={styles.badge}>
                {video.duration || "0:00"}
              </div>
            </div>
            <h3 style={styles.title}>{video.snippet.title}</h3>
            <p style={styles.channel}>{video.snippet.channelTitle}</p>
          </Link>
        ))}
      </div>

      {/* Loading Status */}
      {loading && <p style={styles.loadingText}>Curating your feed...</p>}
      {!loading && pageToken && <p style={styles.loadingText}>Scroll for more...</p>}
      {!loading && !pageToken && videos.length > 0 && <p style={styles.loadingText}>You've reached the end!</p>}
    </div>
  );
}

const styles = {
  container: { padding: "24px" },
  pageTitle: { fontSize: "24px", marginBottom: "20px", fontWeight: "bold", color: "white" },
  
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" },
  
  card: { textDecoration: "none", color: "white", display: "flex", flexDirection: "column", gap: "10px" },
  
  thumbnailWrapper: { position: "relative", aspectRatio: "16/9", borderRadius: "12px", overflow: "hidden", background: "#222" },
  img: { width: "100%", height: "100%", objectFit: "cover" },
  
  // ✅ Duration Badge Style
  badge: { 
    position: "absolute", bottom: "8px", right: "8px", 
    background: "rgba(0,0,0,0.85)", color: "white", 
    padding: "4px 8px", borderRadius: "6px", 
    fontSize: "12px", fontWeight: "bold" 
  },
  
  title: { fontSize: "15px", fontWeight: "600", margin: "0", lineHeight: "1.4", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
  channel: { fontSize: "12px", color: "#aaa", margin: 0 },
  
  loadingText: { textAlign: "center", padding: "20px", color: "#666", marginTop: "20px" }
};

export default Home;