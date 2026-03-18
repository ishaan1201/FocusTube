import { useState, useEffect } from "react";
import { fetchShorts } from "../services/youtube";
import VideoCard from "../components/VideoCard";

function ShortsPage() {
  const [videos, setVideos] = useState([]);
  const [pageToken, setPageToken] = useState("");
  const [loading, setLoading] = useState(true);

  const isUnder60Sec = (isoDuration) => {
    if (!isoDuration) return false;
    const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return false;
    const hours = parseInt((match[1] || "0").replace("H", "")) || 0;
    const minutes = parseInt((match[2] || "0").replace("M", "")) || 0;
    const seconds = parseInt((match[3] || "0").replace("S", "")) || 0;
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    return totalSeconds < 60;
  };

  const processShorts = (items) => {
    // Only allow videos under 60 seconds
    return items.filter(video => {
      const duration = video.contentDetails?.duration;
      return isUnder60Sec(duration);
    });
  };

  // 1️⃣ Initial Load
  useEffect(() => {
    loadMore();
  }, []);

  // 🔄 The Infinite Scroll Function
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 && !loading && pageToken) {
        loadMore();
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, pageToken]);

  const loadMore = async () => {
    setLoading(true);
    const data = await fetchShorts(pageToken);

    setVideos((prev) => {
      const newItems = processShorts(data.items);
      const newIds = new Set(newItems.map(v => v.id.videoId || v.id));
      const filteredPrev = prev.filter(v => !newIds.has(v.id.videoId || v.id));
      return [...filteredPrev, ...newItems];
    });

    setPageToken(data.nextPageToken || "");
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Shorts Feed ⚡</h1>

      <div style={styles.shortsGrid}>
        {videos.map((v) => (
          <VideoCard key={v.id.videoId || v.id} video={v} isShort={true} />
        ))}
      </div>

      {loading && <p style={styles.loading}>Loading more shorts...</p>}
      {!loading && !pageToken && videos.length > 0 && <p style={styles.loading}>You've reached the end!</p>}
      {!loading && videos.length === 0 && <p style={styles.loading}>No shorts found in this batch. Try scrolling...</p>}
    </div>
  );
}

const styles = {
  container: { padding: "24px" },
  title: { fontSize: "24px", marginBottom: "20px", fontWeight: "bold", color: "white" },
  shortsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "20px"
  },
  loading: { textAlign: "center", padding: "20px", color: "#888", marginTop: "20px" }
};

export default ShortsPage;
