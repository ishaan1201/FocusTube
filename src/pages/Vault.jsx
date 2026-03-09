import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Bookmark, StickyNote, MessageSquare } from "lucide-react";
import { getHistory } from "../utils/storage";

function Vault() {
  const [totalMins, setTotalMins] = useState(0);

  // ⏱️ Helper: Parse duration string (e.g., "10:05", "1:05:20", or ISO) to minutes
  const parseDuration = (str) => {
    if (!str) return 0;

    // Handle ISO 8601 (e.g., PT15M30S)
    if (str.startsWith("PT")) {
      const match = str.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
      const h = parseInt((match[1] || "").replace("H", "")) || 0;
      const m = parseInt((match[2] || "").replace("M", "")) || 0;
      const s = parseInt((match[3] || "").replace("S", "")) || 0;
      return (h * 60) + m + (s / 60);
    }

    // Handle "MM:SS" or "HH:MM:SS"
    const parts = str.split(":").map(Number);
    if (parts.length === 3) return (parts[0] * 60) + parts[1] + (parts[2] / 60);
    if (parts.length === 2) return parts[0] + (parts[1] / 60);
    return 0;
  };

  useEffect(() => {
    const history = getHistory();
    // 🧮 Calculate total focus time from history
    const totalMinutes = history.reduce((acc, video) => {
      // Use saved duration or default to 10 mins estimate if missing/invalid
      const vidDuration = parseDuration(video.duration);
      return acc + (vidDuration || 15);
    }, 0);

    setTotalMins(Math.round(totalMinutes));
  }, []);

  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;

  // Progress for the circle (Max 5 hours target)
  const progress = Math.min((totalMins / 300) * 100, 100);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Digital Wellbeing</h1>

      {/* 📊 REAL DATA GRAPH */}
      <div style={styles.donutCard}>
        <div style={styles.donutInner}>
          <h2 style={styles.timeText}>
            {hours}h {mins}m
          </h2>
          <p style={styles.subText}>Focus Time (Est.)</p>
        </div>
        <svg width="220" height="220" viewBox="0 0 42 42" style={{ transform: "rotate(-90deg)" }}>
          {/* Background Circle */}
          <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="#222" strokeWidth="3" />
          {/* Progress Circle */}
          <circle
            cx="21" cy="21" r="15.9" fill="transparent" stroke="#ff4444" strokeWidth="3"
            strokeDasharray={`${progress} 100`}
            strokeDashoffset="0"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* 🧭 NAVIGATION GRID */}
      <div style={styles.btnGrid}>

        {/* ❤️ Liked Videos */}
        <Link to="/liked" style={styles.sqBtn}>
          <Heart color="#ff4444" size={32} />
          <span>Liked Videos</span>
        </Link>

        {/* 🔖 Saved Videos */}
        <Link to="/saved" style={styles.sqBtn}>
          <Bookmark color="#4caf50" size={32} />
          <span>Saved Videos</span>
        </Link>

        {/* 📝 My Notes (Navigates to Notes Page) */}
        <Link to="/notes" style={styles.sqBtn}>
          <StickyNote color="#ff9800" size={32} />
          <span>My Notes</span>
        </Link>

        {/* 🤖 AI Insights (Placeholder) */}
        <button style={styles.sqBtn} onClick={() => alert("AI Insights generating...")}>
          <MessageSquare color="#2196f3" size={32} />
          <span>AI Insights</span>
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: "40px", maxWidth: "800px", margin: "0 auto", color: "white" },
  title: { fontSize: "32px", fontWeight: "900", marginBottom: "40px", textAlign: "center" },

  // Graph Styles
  donutCard: {
    background: "#111", padding: "40px", borderRadius: "40px",
    display: "flex", justifyContent: "center", position: "relative",
    marginBottom: "40px", border: "1px solid #222", boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
  },
  donutInner: { position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },
  timeText: { fontSize: "35px", margin: 0, fontWeight: "bold" },
  subText: { color: "#666", fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px" },

  // Button Grid
  btnGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
  sqBtn: {
    background: "#1a1a1a", padding: "30px", borderRadius: "24px",
    border: "1px solid #333", display: "flex", flexDirection: "column",
    alignItems: "center", gap: "15px", textDecoration: "none",
    color: "white", fontSize: "16px", fontWeight: "bold",
    transition: "0.2s", cursor: "pointer"
  }
};

export default Vault;