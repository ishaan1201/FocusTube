import { useState, useEffect } from "react";
import { fetchShorts } from "../services/youtube";
import VideoCard from "./VideoCard";
import { Zap } from "lucide-react"; 

function ShortsSection() {
  const [shorts, setShorts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadShorts = async () => {
      // Fetch the default educational shorts
      const data = await fetchShorts("");
      // Only grab the top 8 or 10 so it doesn't scroll forever
      setShorts(data.items?.slice(0, 10) || []);
      setLoading(false);
    };
    loadShorts();
  }, []);

  if (loading || shorts.length === 0) return null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Zap color="#ff0000" size={24} fill="#ff0000" />
        <h2 style={styles.title}>Shorts</h2>
      </div>
      
      {/* 🚀 The Horizontal Scroll Wrapper */}
      <div style={styles.scrollWrapper}>
        {shorts.map((video, idx) => (
          <div key={`${video.id.videoId || video.id}-${idx}`} style={styles.shortCard}>
             <VideoCard video={video} isShort={true} />
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: { 
    margin: "10px 0 30px", 
    borderTop: "4px solid #1a1a1a", 
    borderBottom: "4px solid #1a1a1a", 
    padding: "24px 0",
    maxWidth: "100%",       // 👈 Forces it to respect the Home container's width
    overflow: "hidden"      // 👈 Traps the scrolling exclusively to the shorts row
  },
  header: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" },
  title: { fontSize: "22px", fontWeight: "bold", margin: 0, color: "white" },
  scrollWrapper: { 
    display: "flex", 
    gap: "16px", 
    overflowX: "auto", 
    paddingBottom: "15px", 
    scrollbarWidth: "thin" // Makes the scrollbar look sleek on Firefox
  },
  shortCard: { 
    minWidth: "200px", // Forces the cards to stay vertical and not get crushed
    width: "200px", 
    flexShrink: 0 
  }
};

export default ShortsSection;