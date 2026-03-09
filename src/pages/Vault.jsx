import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Flame, Clock, Calendar, ChevronRight, StickyNote, MessageSquare, History } from "lucide-react";
import { getHistory } from "../utils/storage";

function Vault() {
  const [stats, setStats] = useState({
    totalMins: 0,
    todayMins: 0,
    weeklyData: [0, 0, 0, 0, 0, 0, 0] // Sun - Sat
  });

  // ⏱️ Helper: Parse duration string to minutes
  const parseDuration = (str) => {
    if (!str) return 0;
    if (str.startsWith("PT")) {
      const match = str.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
      const h = parseInt((match[1] || "").replace("H", "")) || 0;
      const m = parseInt((match[2] || "").replace("M", "")) || 0;
      const s = parseInt((match[3] || "").replace("S", "")) || 0;
      return (h * 60) + m + (s / 60);
    }
    const parts = str.split(":").map(Number);
    if (parts.length === 3) return (parts[0] * 60) + parts[1] + (parts[2] / 60);
    if (parts.length === 2) return parts[0] + (parts[1] / 60);
    return 0;
  };

  useEffect(() => {
    const history = getHistory();
    const now = new Date();
    const todayStr = now.toDateString();
    
    let total = 0;
    let today = 0;
    let weekBuckets = [0, 0, 0, 0, 0, 0, 0]; // Index 0 = Sunday

    history.forEach(video => {
      const vidMins = parseDuration(video.duration) || 15; // fallback to 15m
      const vidDate = new Date(video.timestamp || Date.now());
      
      total += vidMins;
      
      if (vidDate.toDateString() === todayStr) {
        today += vidMins;
      }

      // Check if video was watched in the last 7 days
      const diffTime = Math.abs(now - vidDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (diffDays <= 7) {
        weekBuckets[vidDate.getDay()] += vidMins;
      }
    });

    setStats({
      totalMins: Math.round(total),
      todayMins: Math.round(today),
      weeklyData: weekBuckets
    });
  }, []);

  const formatHrsMins = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  // Find max value for chart scaling (minimum scale of 60 mins so small bars don't look huge)
  const maxWeeklyMins = Math.max(...stats.weeklyData, 60);
  const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Digital Wellbeing</h1>

      {/* 🏆 STATS ROW */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}><Clock size={20} color="#2196f3" /></div>
          <div>
            <p style={styles.statLabel}>Today's Focus</p>
            <h2 style={styles.statValue}>{formatHrsMins(stats.todayMins)}</h2>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: "rgba(255, 152, 0, 0.1)" }}><Flame size={20} color="#ff9800" /></div>
          <div>
            <p style={styles.statLabel}>All-Time Focus</p>
            <h2 style={styles.statValue}>{formatHrsMins(stats.totalMins)}</h2>
          </div>
        </div>
      </div>

      {/* 📊 7-DAY ACTIVITY CHART */}
      <div style={styles.chartCard}>
        <div style={styles.chartHeader}>
          <h3 style={styles.chartTitle}><Calendar size={18} /> Last 7 Days</h3>
        </div>
        
        <div style={styles.chartArea}>
          {stats.weeklyData.map((mins, idx) => {
            const heightPercent = `${(mins / maxWeeklyMins) * 100}%`;
            const isToday = new Date().getDay() === idx;
            
            return (
              <div key={idx} style={styles.barCol}>
                <div style={styles.barTrack}>
                  <div 
                    style={{ 
                      ...styles.barFill, 
                      height: heightPercent,
                      background: isToday ? "#4caf50" : "#ff4444"
                    }} 
                    title={`${Math.round(mins)} mins`}
                  />
                </div>
                <span style={{ ...styles.dayLabel, color: isToday ? "#4caf50" : "#888", fontWeight: isToday ? "bold" : "normal" }}>
                  {daysOfWeek[idx]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🧭 NAVIGATION GRID */}
      <div style={styles.btnGrid}>
        <Link to="/history" style={styles.navBtn}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ ...styles.navIconBox, background: "rgba(255, 68, 68, 0.1)" }}><History color="#ff4444" size={24} /></div>
            <span style={styles.navText}>Watch History</span>
          </div>
          <ChevronRight color="#555" />
        </Link>

        <Link to="/notes" style={styles.navBtn}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ ...styles.navIconBox, background: "rgba(255, 152, 0, 0.1)" }}><StickyNote color="#ff9800" size={24} /></div>
            <span style={styles.navText}>My Notes</span>
          </div>
          <ChevronRight color="#555" />
        </Link>

        <button style={styles.navBtn} onClick={() => alert("AI Insights generating...")}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ ...styles.navIconBox, background: "rgba(33, 150, 243, 0.1)" }}><MessageSquare color="#2196f3" size={24} /></div>
            <span style={styles.navText}>AI Insights</span>
          </div>
          <ChevronRight color="#555" />
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: "40px", maxWidth: "800px", margin: "0 auto", color: "white" },
  title: { fontSize: "32px", fontWeight: "900", marginBottom: "30px" },

  statsRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" },
  statCard: { background: "#111", padding: "24px", borderRadius: "20px", border: "1px solid #222", display: "flex", alignItems: "center", gap: "20px" },
  statIcon: { background: "rgba(33, 150, 243, 0.1)", width: "48px", height: "48px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center" },
  statLabel: { color: "#888", fontSize: "13px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 4px 0" },
  statValue: { fontSize: "28px", fontWeight: "900", margin: 0 },

  chartCard: { background: "#111", padding: "30px", borderRadius: "24px", border: "1px solid #222", marginBottom: "30px" },
  chartHeader: { marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  chartTitle: { fontSize: "16px", fontWeight: "bold", margin: 0, display: "flex", alignItems: "center", gap: "8px" },
  
  chartArea: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", height: "150px", padding: "10px 0" },
  barCol: { display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", flex: 1 },
  barTrack: { width: "16px", height: "120px", background: "#222", borderRadius: "8px", display: "flex", alignItems: "flex-end", overflow: "hidden" },
  barFill: { width: "100%", borderRadius: "8px", transition: "height 0.5s ease-out" },
  dayLabel: { fontSize: "12px" },

  btnGrid: { display: "flex", flexDirection: "column", gap: "15px" },
  navBtn: { background: "#111", border: "1px solid #222", padding: "16px 24px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", textDecoration: "none", transition: "all 0.2s" },
  navIconBox: { width: "40px", height: "40px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" },
  navText: { color: "white", fontSize: "16px", fontWeight: "bold" }
};

export default Vault;