import { useState, useEffect, useCallback } from "react";
import { fetchSearchVideos } from "../services/youtube";
import useInfiniteScroll from "../hooks/useInfiniteScroll";
import VideoCard from "../components/VideoCard";

function Home({ query }) {
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

  const processVideos = (items) => {
    // Filter out videos under 60 seconds (Shorts)
    return items.filter(video => {
      const duration = video.contentDetails?.duration;
      return !isUnder60Sec(duration);
    });
  };

  useEffect(() => {
    const loadVideos = async () => {
      setLoading(true);
      const search = query ? `${query} tutorial | documentary | course` : "science|technology|coding|documentary|history|math";
      const data = await fetchSearchVideos(search, ""); 
      
      setVideos(processVideos(data.items || []));
      setPageToken(data.nextPageToken || "");
      setLoading(false);
    };

    loadVideos();
  }, [query]);

  const fetchMore = useCallback(async () => {
    if (!pageToken) return;

    const search = query ? `${query} tutorial | documentary | course` : "science|technology|coding|documentary|history|math";
    const data = await fetchSearchVideos(search, pageToken);
    
    setVideos(prev => [...prev, ...processVideos(data.items)]);
    setPageToken(data.nextPageToken || "");
  }, [pageToken, query]);

  useInfiniteScroll(fetchMore);

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>
        {query ? `Search Results: "${query}"` : "Top Picks for Learning"}
      </h1>

      <div style={styles.grid}>
        {videos.map((video, idx) => (
          <VideoCard key={`${video.id.videoId || video.id}-${idx}`} video={video} />
        ))}
      </div>

      {loading && <p style={styles.loadingText}>Curating your feed...</p>}
      {!loading && pageToken && <p style={styles.loadingText}>Scroll for more...</p>}
      {!loading && !pageToken && videos.length > 0 && <p style={styles.loadingText}>You've reached the end!</p>}
    </div>
  );
}

const styles = {
  container: { 
    padding: "24px",
    maxWidth: "100vw",
    overflowX: "hidden",
    boxSizing: "border-box"
  },
  pageTitle: { fontSize: "24px", marginBottom: "20px", fontWeight: "bold", color: "white" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" },
  loadingText: { textAlign: "center", padding: "20px", color: "#666", marginTop: "20px" }
};

export default Home;
