import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchSearchVideos } from "../services/youtube";
import useInfiniteScroll from "../hooks/useInfiniteScroll"; // ✅ Import Hook
import { Shield, ShieldCheck, Play } from "lucide-react";

// Map slugs to display names & search queries
const TOPIC_MAP = {
  "coding": { title: "Coding", query: "programming tutorial|web development course|coding interview|python tutorial|java tutorial|javascript tutorial|c++ tutorial|c# tutorial|html tutorial|css tutorial|react tutorial|angular tutorial|vue tutorial|node.js tutorial|express.js tutorial|mongodb tutorial|mysql tutorial|postgresql tutorial|sql tutorial|git tutorial|github tutorial|data structures and algorithms|coding interview preparation|competitive programming|web development|app development|mobile development|game development|machine learning|deep learning|artificial intelligence|data science|data analysis|data visualization|big data|cloud computing|devops|cybersecurity|ethical hacking|penetration testing|web security|app security|mobile security|network security|database security|information security|data privacy|data protection|data governance|data quality|data management|data integration|data migration|data transformation|data modeling|data architecture|data strategy|data governance|data quality|data management|data integration|data migration|data transformation|data modeling|data architecture|data strategy" },
  "tech-news": { title: "Tech News", query: "tech news|gadget review|technology update" },
  "design": { title: "Design", query: "ui ux design|graphic design tutorial|figma tutorial|adobe photoshop tutorial|adobe illustrator tutorial|adobe after effects tutorial|adobe premiere pro tutorial|adobe XD tutorial" },
  "science": { title: "Science", query: "science documentary|physics explained|space exploration" },
  "ai-data": { title: "Data & AI", query: "artificial intelligence|machine learning course|data science|ai news|ai tutorial|ai tools|ai applications|ai ethics|ai safety|ai alignment|ai policy|ai regulation|ai governance|ai risk|ai impact|ai future|ai development|ai research|ai applications|ai ethics|ai safety|ai alignment|ai policy|ai regulation|ai governance|ai risk|ai impact|ai future|ai development|ai research  " },

  // ✅ NEW CATEGORIES ADDED
  "news": { title: "Global News", query: "world news live|current affairs|BBC news|Al Jazeera English|indian news live|indian express live|indian today live|trading news live|finance news live|business news live|market news live|stock market news live|crypto news live|financial news live|business news live|market news live|stock market news live|crypto news live|financial news live  " },
  "trading": { title: "Trading & Finance", query: "stock market basics|crypto trading|financial literacy|economics explained" }
};

function CategoryPage({ focusMode, setFocusMode, activeCategory, setActiveCategory }) {
  const { slug } = useParams();
  const topic = TOPIC_MAP[slug] || { title: "Topic", query: "education" };

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nextToken, setNextToken] = useState(null); // ✅ Track pagination

  // Is THIS category currently locked?
  const isLocked = focusMode && activeCategory === topic.title;

  // 1️⃣ Initial Load
  useEffect(() => {
    const loadVideos = async () => {
      setLoading(true);
      // Fetch strictly educational content for this topic
      const data = await fetchSearchVideos(topic.query, "", "medium");
      setVideos(data.items || []);
      setNextToken(data.nextPageToken || null);
      setLoading(false);
    };
    loadVideos();
  }, [slug, topic.query]);

  // 2️⃣ Infinite Scroll Logic
  const loadMore = useCallback(async () => {
    if (!nextToken) return;
    const data = await fetchSearchVideos(topic.query, nextToken, "medium");
    if (data?.items?.length) {
      setVideos((prev) => [...prev, ...data.items]);
      setNextToken(data.nextPageToken || null);
    }
  }, [nextToken, topic.query]);

  // ✅ Hook into scroll event
  useInfiniteScroll(loadMore);

  const toggleShield = () => {
    if (isLocked) {
      setFocusMode(false);
      setActiveCategory(null);
    } else {
      setFocusMode(true);
      setActiveCategory(topic.title);
    }
  };

  return (
    <div style={styles.container}>
      {/* HEADER BANNER */}
      <div style={{ ...styles.banner, borderColor: isLocked ? "#ff4444" : "#333" }}>
        <div>
          <h1 style={styles.title}>{topic.title}</h1>
          <p style={styles.subtitle}>
            {isLocked ? "Hyper-Focus Mode Active. Other distractions hidden." : "Curated educational content."}
          </p>
        </div>

        <button
          onClick={toggleShield}
          style={{ ...styles.shieldBtn, background: isLocked ? "#ff4444" : "#333" }}
        >
          {isLocked ? <ShieldCheck size={20} /> : <Shield size={20} />}
          {isLocked ? "Unlock Mode" : "Focus Shield"}
        </button>
      </div>

      {/* VIDEO GRID */}
      <div style={styles.grid}>
        {videos.map((video) => (
          <Link to={`/video/${video.id.videoId}`} key={video.id.videoId} style={styles.card}>

            {/* ✅ Updated Thumbnail Wrapper with Duration */}
            <div style={styles.thumbnailWrapper}>
              <img src={video.snippet.thumbnails.high.url} style={styles.img} alt={video.snippet.title} />
              <div style={styles.badge}>
                {video.duration || "0:00"}
              </div>
            </div>

            <h3 style={styles.cardTitle}>{video.snippet.title}</h3>
            <p style={styles.cardChannel}>{video.snippet.channelTitle}</p>
          </Link>
        ))}
      </div>

      {/* Loading Status */}
      {loading && <p style={{ color: "#666", textAlign: "center", marginTop: "20px" }}>Loading content...</p>}
      {!loading && nextToken && <p style={{ color: "#444", textAlign: "center", marginTop: "20px" }}>Scroll for more...</p>}
    </div>
  );
}

const styles = {
  container: { padding: "24px" },
  banner: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    background: "#1a1a1a", padding: "30px", borderRadius: "20px", marginBottom: "30px", border: "1px solid"
  },
  title: { fontSize: "32px", margin: 0, fontWeight: "bold", color: "white" },
  subtitle: { color: "#aaa", marginTop: "5px" },
  shieldBtn: {
    display: "flex", alignItems: "center", gap: "10px", padding: "12px 24px",
    color: "white", border: "none", borderRadius: "30px", cursor: "pointer", fontWeight: "bold", transition: "0.2s"
  },

  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" },

  card: { textDecoration: "none", color: "white", display: "flex", flexDirection: "column", gap: "10px" },

  // ✅ Matches Home Page Styles
  thumbnailWrapper: { position: "relative", aspectRatio: "16/9", borderRadius: "12px", overflow: "hidden", background: "#222" },
  img: { width: "100%", height: "100%", objectFit: "cover" },
  badge: { position: "absolute", bottom: "8px", right: "8px", background: "rgba(0,0,0,0.85)", color: "white", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold" },

  cardTitle: { fontSize: "14px", fontWeight: "600", margin: "0", lineHeight: "1.4", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
  cardChannel: { fontSize: "12px", color: "#aaa", margin: 0 }
};

export default CategoryPage;