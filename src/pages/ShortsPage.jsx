import { useState, useEffect } from "react";
import { fetchShorts } from "../services/youtube";
import VideoCard from "../components/VideoCard";

function ShortsPage() {
  const [videos, setVideos] = useState([]);
  const [pageToken, setPageToken] = useState("");
  const [loading, setLoading] = useState(true);

  const isShortVideo = (video) => {
    // 1. Check contentDetails duration
    const isoDuration = video.contentDetails?.duration;
    if (isoDuration) {
      const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
      if (match) {
        const hours = parseInt((match[1] || "0").replace("H", "")) || 0;
        const minutes = parseInt((match[2] || "0").replace("M", "")) || 0;
        const seconds = parseInt((match[3] || "0").replace("S", "")) || 0;
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        // Most "Shorts" are under 61 seconds to be safe
        if (totalSeconds > 0 && totalSeconds <= 61) return true;
      }
    }
    
    // 2. Fallback: If no duration but coming from fetchShorts, it's likely a short
    // fetchShorts already uses videoDuration: 'short'
    return true; 
  };

  const processShorts = (items) => {
    // fetchShorts already filters for 'short' duration in the API call.
    // We'll keep the filter but make it more lenient to avoid empty states.
    return items.filter(video => isShortVideo(video));
  };

  // 1️⃣ Initial Load
  useEffect(() => {
    loadMore("");
  }, []);

  // 🔄 The Infinite Scroll Function
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 800 && !loading && pageToken) {
        loadMore(pageToken);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, pageToken]);

  const loadMore = async (token) => {
    setLoading(true);
    try {
      const data = await fetchShorts(token);

      if (data?.items) {
        const newShorts = processShorts(data.items);
        
        setVideos((prev) => {
          const existingIds = new Set(prev.map(v => v.id.videoId || v.id));
          const uniqueNew = newShorts.filter(v => !existingIds.has(v.id.videoId || v.id));
          return [...prev, ...uniqueNew];
        });

        setPageToken(data.nextPageToken || "");
      }
    } catch (error) {
      console.error("Error loading shorts:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Shorts Feed ⚡</h1>

      <div style={styles.shortsGrid}>
        {videos.map((v, idx) => (
          <VideoCard key={`${v.id.videoId || v.id}-${idx}`} video={v} isShort={true} />
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-10 w-full col-span-full">
          <div className="w-8 h-8 border-4 border-white/10 border-t-white rounded-full animate-spin" />
        </div>
      )}
      
      {!loading && pageToken && videos.length > 0 && (
        <p style={styles.loading}>Scroll for more magic...</p>
      )}
      
      {!loading && videos.length === 0 && (
        <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10 mx-auto max-w-lg">
          <p className="text-zinc-500 font-medium">Looking for educational shorts...</p>
          <button 
            onClick={() => loadMore("")}
            className="mt-4 px-6 py-2 bg-white text-black rounded-full font-bold text-sm"
          >
            Retry Fetch
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: "24px", minHeight: "100vh" },
  title: { fontSize: "24px", marginBottom: "32px", fontWeight: "bold", color: "white", letterSpacing: "-0.5px" },
  shortsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "24px"
  },
  loading: { textAlign: "center", padding: "40px", color: "#666", fontSize: "14px" }
};

export default ShortsPage;
