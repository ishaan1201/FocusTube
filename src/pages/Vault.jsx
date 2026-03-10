import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Flame, Clock, Calendar, StickyNote, MessageSquare, History, Heart, Bookmark } from "lucide-react";
import { getHistory } from "../utils/storage";

function Vault() {
  const [stats, setStats] = useState({
    totalMins: 0,
    todayMins: 0,
    weeklyData: [0, 0, 0, 0, 0, 0, 0] 
  });

  useEffect(() => {
    const history = getHistory();
    const now = new Date();
    const todayStr = now.toDateString();
    
    let total = 0;
    let today = 0;
    let weekBuckets = [0, 0, 0, 0, 0, 0, 0]; 

    history.forEach(video => {
      let vidMins = 0;
      
      // 🛡️ THE ULTIMATE FIX: Stop guessing the video length!
      // If resumeTime exists (even if it is literally 0), we divide by 60 to get exact minutes.
      if (video.resumeTime !== undefined && video.resumeTime !== null) {
        vidMins = Number(video.resumeTime) / 60;
      } else {
        // If there is totally corrupted data, add 0. NEVER add the full video length.
        vidMins = 0; 
      }

      // Safety caps
      if (isNaN(vidMins) || vidMins < 0) vidMins = 0;
      if (vidMins > 600) vidMins = 600; 

      // Parse the date
      const vidDate = new Date(video.lastWatched || video.timestamp || Date.now());
      
      total += vidMins;
      
      if (vidDate.toDateString() === todayStr) {
        today += vidMins;
      }

      // Add to the 7-day chart buckets
      const diffTime = now.getTime() - vidDate.getTime();
      const diffDays = diffTime / (1000 * 3600 * 24); 
      
      if (diffDays >= 0 && diffDays < 7) {
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
            const isToday = new Date().getDay() === idx;
            const safeMins = Math.max(0, mins);
            
            // Ensure minimum 4% visual height only if they actually watched something > 0
            const calculatedHeight = safeMins > 0 ? Math.max(4, (safeMins / maxWeeklyMins) * 100) : 0;
            const heightPercent = `${Math.min(100, calculatedHeight)}%`;
            
            return (
              <div key={idx} style={styles.barCol}>
                <div style={styles.barTrack}>
                  <div 
                    style={{ 
                      ...styles.barFill, 
                      height: heightPercent,
                      background: isToday ? "#4caf50" : "#ff4444"
                    }} 
                    title={`${Math.round(safeMins)} mins`}
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

      {/* 🎛️ RECTANGULAR NAVIGATION GRID */}
      <div style={styles.btnGrid}>
        
        <Link to="/history" style={styles.boxBtn}>
          <div style={{ ...styles.boxIcon, background: "rgba(255, 68, 68, 0.1)" }}><History color="#ff4444" size={26} /></div>
          <span style={styles.boxText}>History</span>
        </Link>

        <Link to="/liked" style={styles.boxBtn}>
          <div style={{ ...styles.boxIcon, background: "rgba(233, 30, 99, 0.1)" }}><Heart color="#e91e63" size={26} /></div>
          <span style={styles.boxText}>Liked</span>
        </Link>

        <Link to="/saved" style={styles.boxBtn}>
          <div style={{ ...styles.boxIcon, background: "rgba(76, 175, 80, 0.1)" }}><Bookmark color="#4caf50" size={26} /></div>
          <span style={styles.boxText}>Saved</span>
        </Link>

        <Link to="/notes" style={styles.boxBtn}>
          <div style={{ ...styles.boxIcon, background: "rgba(255, 152, 0, 0.1)" }}><StickyNote color="#ff9800" size={26} /></div>
          <span style={styles.boxText}>Notes</span>
        </Link>

        <button style={styles.boxBtn} onClick={() => alert("AI Insights generating...")}>
          <div style={{ ...styles.boxIcon, background: "rgba(33, 150, 243, 0.1)" }}><MessageSquare color="#2196f3" size={26} /></div>
          <span style={styles.boxText}>Insights</span>
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

  btnGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "16px" },
  boxBtn: { background: "#111", border: "1px solid #222", padding: "24px 10px", borderRadius: "20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", cursor: "pointer", textDecoration: "none", transition: "transform 0.2s" },
  boxIcon: { width: "54px", height: "54px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "4px" },
  boxText: { color: "white", fontSize: "14px", fontWeight: "bold" }
};

export default Vault;