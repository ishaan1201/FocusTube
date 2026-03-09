import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchSearchVideos, fetchVideoDetailsBatch } from "../services/youtube";
import { Radio, RefreshCw, Search } from "lucide-react";

const LIVE_CATEGORIES = ["All", "News", "Technology", "Coding", "Science", "Nature", "Space"];

function LivePage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [localSearch, setLocalSearch] = useState("");
  const [triggerSearch, setTriggerSearch] = useState("");

  const loadLiveStreams = async () => {
    setLoading(true);
    try {
      // 🧠 STEP 1: Broad query for educational/news live content
      let query = activeCategory === "All" 
        ? "news live | technology live | coding live" 
        : `${activeCategory} live`;
      
      if (triggerSearch) {
        query = `${triggerSearch} live`;
      }

      // ✅ We explicitly pass 'live' to ensure we only get active broadcasts
      const searchData = await fetchSearchVideos(query, "", "any", "live");
      const items = searchData.items || [];

      if (items.length > 0) {
        // 🧠 STEP 2: Search items don't have viewCount. We must fetch detail data for these IDs.
        const videoIds = items.map(v => v.id.videoId).join(",");
        const detailsData = await fetchVideoDetailsBatch(videoIds);

        // Merge the live data (concurrentViewers) with search snippets
        const merged = items.map(item => {
          const details = detailsData.find(d => d.id === item.id.videoId);
          return {
            ...item,
            liveStreamingDetails: details?.liveStreamingDetails || {},
            statistics: details?.statistics || {}
          };
        });
        setVideos(merged);
      }
    } catch (error) {
      console.error("Live Fetch Error:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadLiveStreams();
  }, [activeCategory, triggerSearch]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleRow}>
          <Radio size={32} color="#ff4444" style={styles.liveIcon} />
          <div>
            <h1 style={styles.title}>Live Dashboard</h1>
            <p style={{ color: "#aaa" }}>Real-time News, Markets, Tech, and Science.</p>
          </div>
        </div>
        <button onClick={loadLiveStreams} style={styles.refreshBtn}>
          <RefreshCw size={18} /> Refresh
        </button>
      </div>

      {/* 🧭 STICKY CATEGORY NAV */}
      <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "15px", marginBottom: "20px", scrollbarWidth: "none" }}>
        {LIVE_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => { setActiveCategory(cat); setTriggerSearch(""); setLocalSearch(""); }}
            style={{
              padding: "8px 16px", borderRadius: "20px", border: "none", fontWeight: "bold", cursor: "pointer", whiteSpace: "nowrap",
              background: activeCategory === cat ? "#ff4444" : "#222",
              color: activeCategory === cat ? "white" : "#aaa"
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 🔍 LOCAL IN-PAGE SEARCH */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "30px", maxWidth: "600px" }}>
        <input 
          type="text" 
          placeholder={`Search live ${activeCategory === "All" ? "streams" : activeCategory}...`}
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && setTriggerSearch(localSearch)}
          style={{ flex: 1, padding: "10px 16px", borderRadius: "12px", border: "1px solid #333", background: "#111", color: "white", outline: "none" }}
        />
        <button 
          onClick={() => setTriggerSearch(localSearch)}
          style={{ padding: "10px 20px", borderRadius: "12px", border: "none", background: "#333", color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}
        >
          <Search size={16} /> Search
        </button>
      </div>

      {loading ? (
        <p style={styles.statusMsg}>Scanning live frequencies...</p>
      ) : videos.length === 0 ? (
        <div style={styles.emptyState}>
          <p>No active streams found matching your focus filters.</p>
          <button onClick={loadLiveStreams} style={styles.retryBtn}>Try Again</button>
        </div>
      ) : (
        <div style={styles.grid}>
          {videos.map((video) => {
            // ✅ concurrentViewers is the correct metric for LIVE videos
            const viewers = video.liveStreamingDetails?.concurrentViewers;

            return (
              <Link to={`/live/${video.id.videoId}`} key={video.id.videoId} style={styles.card}>
                <div style={styles.thumbWrapper}>
                  <img src={video.snippet.thumbnails.high?.url} style={styles.img} alt="Live thumb" />

                  <div style={styles.liveBadge}>
                    <div style={styles.dot}></div> LIVE
                  </div>

                  {viewers && (
                    <div style={styles.viewBadge}>
                      {Number(viewers).toLocaleString()} watching
                    </div>
                  )}
                </div>

                <h3 style={styles.cardTitle}>{video.snippet.title}</h3>
                <p style={styles.channel}>{video.snippet.channelTitle}</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: "40px", color: "white", maxWidth: "1400px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", borderBottom: "1px solid #333", paddingBottom: "20px" },
  titleRow: { display: "flex", alignItems: "center", gap: "15px" },
  liveIcon: { animation: "pulse 2s infinite" },
  title: { fontSize: "32px", fontWeight: "bold", margin: 0 },
  refreshBtn: { background: "#222", border: "1px solid #444", color: "white", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "30px" },
  card: { textDecoration: "none", color: "white", transition: "transform 0.2s" },
  thumbWrapper: { position: "relative", aspectRatio: "16/9", borderRadius: "12px", overflow: "hidden", marginBottom: "12px", background: "#111" },
  img: { width: "100%", height: "100%", objectFit: "cover" },
  liveBadge: { position: "absolute", top: "12px", left: "12px", background: "#ff0000", color: "white", padding: "4px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: "900", display: "flex", alignItems: "center", gap: "6px" },
  dot: { width: "6px", height: "6px", background: "white", borderRadius: "50%" },
  viewBadge: { position: "absolute", bottom: "10px", right: "10px", background: "rgba(0,0,0,0.85)", color: "white", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold", backdropFilter: "blur(4px)" },
  cardTitle: { fontSize: "15px", fontWeight: "bold", lineHeight: "1.4", margin: "0 0 6px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
  channel: { fontSize: "13px", color: "#aaa" },
  statusMsg: { color: "#666", textAlign: "center", marginTop: "60px", fontSize: "18px" },
  emptyState: { textAlign: "center", marginTop: "60px", color: "#666" },
  retryBtn: { marginTop: "20px", background: "#ff4444", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }
};

export default LivePage;