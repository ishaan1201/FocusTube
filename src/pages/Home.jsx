import { useState, useEffect, useCallback } from "react";
import { fetchSearchVideos } from "../services/youtube";
import useInfiniteScroll from "../hooks/useInfiniteScroll";
import VideoCard from "../components/VideoCard"; // 👈 MASSIVE UPGRADE: Importing the new component
import ShortsSection from "../components/ShortsSection";

function Home({ query }) {
  const [videos, setVideos] = useState([]);
  const [pageToken, setPageToken] = useState("");
  const [loading, setLoading] = useState(true);

  // 1️⃣ Initial Load & Global Search Listener
  useEffect(() => {
    const loadVideos = async () => {
      setLoading(true);
      
      // 🛡️ The Architect's Filter: If they search globally, we append study terms to keep it focused.
      const search = query ? `${query} tutorial | documentary | course` : "science|technology|coding|documentary|history|math";
      
      // Reset page token for new searches
      const data = await fetchSearchVideos(search, ""); 
      
      setVideos(data.items || []);
      setPageToken(data.nextPageToken || "");
      setLoading(false);
    };

    loadVideos();
  }, [query]); // <--- This array makes the page reload instantly when you search

  // 2️⃣ Infinite Scroll Logic
  const fetchMore = useCallback(async () => {
    if (!pageToken) return;

    const search = query ? `${query} tutorial | documentary | course` : "science|technology|coding|documentary|history|math";
    const data = await fetchSearchVideos(search, pageToken);
    
    // Append new videos to existing list
    setVideos(prev => [...prev, ...data.items]);
    setPageToken(data.nextPageToken || "");
  }, [pageToken, query]);

  // ✅ Hook into scroll event
  useInfiniteScroll(fetchMore);

  return (
    <div style={styles.container}>
      
      {/* Dynamic Title based on Search */}
      <h1 style={styles.pageTitle}>
        {query ? `Search Results: "${query}"` : "Top Picks for Learning"}
      </h1>

      {/* 🚀 INJECT THE SHORTS SHELF HERE */}
      {/* We use !query so the shorts shelf disappears when you search for something specific */}
      {!query && <ShortsSection />}
      
      <div style={styles.grid}>
        {videos.map((video, idx) => (
          // 👈 RIP OUT THE OLD CODE: We just pass the data to the VideoCard now!
          <VideoCard key={`${video.id.videoId || video.id}-${idx}`} video={video} />
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
  container: { 
    padding: "24px",
    maxWidth: "100vw",          // 👈 Prevents it from being wider than the screen
    overflowX: "hidden",        // 👈 Kills the global horizontal scrollbar
    boxSizing: "border-box"     // 👈 Makes sure padding doesn't add extra width
  },
  pageTitle: { fontSize: "24px", marginBottom: "20px", fontWeight: "bold", color: "white" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" },
  loadingText: { textAlign: "center", padding: "20px", color: "#666", marginTop: "20px" }
};

export default Home;