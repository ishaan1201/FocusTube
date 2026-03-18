import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Flame, Clock, Calendar, StickyNote, MessageSquare, History, Heart, Bookmark, Brain, Zap, TrendingUp } from "lucide-react";
import { getFocusStats } from "../utils/storage";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../services/supabase";
import { motion } from "framer-motion";

function Vault() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalMins: 0,
    todayMins: 0,
    weeklyData: [0, 0, 0, 0, 0, 0, 0]
  });
  const [isSyncing, setIsSyncing] = useState(false);

  const syncToSupabase = useCallback(async (currentStats) => {
    if (!user || isSyncing) return;
    setIsSyncing(true);
    try {
      await supabase.from("analytics").upsert({
        user_id: user.id,
        total_mins: currentStats.totalMins,
        weekly_data: currentStats.weeklyData,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [user, isSyncing]);

  // LIVE TRACKING & INITIAL LOAD
  useEffect(() => {
    const refreshStats = () => {
      const newStats = getFocusStats();
      setStats(newStats);
      return newStats;
    };

    const initialStats = refreshStats();
    if (user) syncToSupabase(initialStats);

    const interval = setInterval(() => {
      const updated = refreshStats();
      if (user) syncToSupabase(updated);
    }, 10000); // Sync every 10s to be polite to API

    return () => clearInterval(interval);
  }, [user, syncToSupabase]);

  const getProductivityScore = () => {
    const total = stats.totalMins;
    const week = stats.weeklyData;
    const consistency = week.filter((d) => d > 0).length / 7;
    // Base score on 300 mins target * consistency factor
    return Math.min(100, Math.round((total / 300) * 100 * consistency)) || 0;
  };

  const getStreak = () => {
    let streak = 0;
    const today = new Date().getDay();
    // Check backwards from today in weekly data
    for (let i = today; i >= 0; i--) {
      if (stats.weeklyData[i] > 0) streak++;
      else if (i !== today) break; // Allow 0 for today if they haven't started
    }
    return streak;
  };

  const generateInsight = () => {
    const avg = stats.weeklyData.reduce((a, b) => a + b, 0) / 7;
    if (avg === 0) return "Start your first session to get AI insights! 🚀";
    if (avg < 30) return "You're building the habit. Try 15 min daily to boost consistency. 📈";
    if (getStreak() >= 3) return `Impressive! A ${getStreak()}-day streak. Your focus is peaking. 🔥`;
    return "Great consistency! You're in the top 10% of focused learners today. 🧠";
  };

  const formatHrsMins = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const maxWeeklyMins = Math.max(...stats.weeklyData, 60);
  const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Digital Wellbeing</h1>
        {isSyncing && <span style={styles.syncTag}><Zap size={10} fill="currentColor" /> Syncing</span>}
      </header>

      {/* 🏆 STATS ROW */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: "rgba(33, 150, 243, 0.1)" }}><Clock size={20} color="#2196f3" /></div>
          <div>
            <p style={styles.statLabel}>Today's Focus</p>
            <h2 style={styles.statValue}>{formatHrsMins(stats.todayMins)}</h2>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: "rgba(156, 39, 176, 0.1)" }}><Brain size={20} color="#9c27b0" /></div>
          <div>
            <p style={styles.statLabel}>Productivity</p>
            <h2 style={styles.statValue}>{getProductivityScore()}%</h2>
          </div>
        </div>
      </div>

      {/* 📊 7-DAY ACTIVITY CHART */}
      <div style={styles.chartCard}>
        <div style={styles.chartHeader}>
          <h3 style={styles.chartTitle}><Calendar size={18} /> Last 7 Days</h3>
          <p style={styles.streakLabel}>🔥 {getStreak()} day streak</p>
        </div>
        
        <div style={styles.chartArea}>
          {stats.weeklyData.map((mins, idx) => {
            const isToday = new Date().getDay() === idx;
            const safeMins = Math.max(0, mins);
            const calculatedHeight = safeMins > 0 ? Math.max(4, (safeMins / maxWeeklyMins) * 100) : 0;
            const heightPercent = `${Math.min(100, calculatedHeight)}%`;
            
            return (
              <div key={idx} style={styles.barCol}>
                <div style={styles.barTrack}>
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: heightPercent }}
                    style={{ 
                      ...styles.barFill, 
                      background: isToday ? "#4caf50" : "linear-gradient(to top, #6366f1, #a855f7)"
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

      {/* 🧠 AI INSIGHT CARD */}
      <div style={styles.insightCard}>
        <div style={styles.insightHeader}>
          <Zap size={16} className="text-yellow-500" fill="currentColor" />
          <h3 style={styles.insightTitle}>FocusAI Insight</h3>
        </div>
        <p style={styles.insightText}>{generateInsight()}</p>
      </div>

      {/* 🎛️ RECTANGULAR NAVIGATION GRID */}
      <div style={styles.btnGrid}>
        <NavBox to="/history" icon={<History color="#ff4444" size={26} />} label="History" bg="rgba(255, 68, 68, 0.1)" />
        <NavBox to="/liked" icon={<Heart color="#e91e63" size={26} />} label="Liked" bg="rgba(233, 30, 99, 0.1)" />
        <NavBox to="/saved" icon={<Bookmark color="#4caf50" size={26} />} label="Saved" bg="rgba(76, 175, 80, 0.1)" />
        <NavBox to="/notes" icon={<StickyNote color="#ff9800" size={26} />} label="Notes" bg="rgba(255, 152, 0, 0.1)" />
        <NavBox to="/insights" icon={<TrendingUp color="#2196f3" size={26} />} label="Insights" bg="rgba(33, 150, 243, 0.1)" />
      </div>
    </div>
  );
}

// Reusable Nav Component for Hover effects
const NavBox = ({ to, icon, label, bg }) => (
  <motion.div whileHover={{ scale: 1.05, y: -5 }} whileTap={{ scale: 0.95 }}>
    <Link to={to} style={styles.boxBtn}>
      <div style={{ ...styles.boxIcon, background: bg }}>{icon}</div>
      <span style={styles.boxText}>{label}</span>
    </Link>
  </motion.div>
);

const styles = {
  container: { padding: "40px", maxWidth: "800px", margin: "0 auto", color: "white" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" },
  title: { fontSize: "32px", fontWeight: "900", margin: 0, letterSpacing: "-1px" },
  syncTag: { fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", background: "rgba(34, 197, 94, 0.1)", color: "#22c55e", padding: "4px 8px", borderRadius: "6px", display: "flex", alignItems: "center", gap: "4px" },

  statsRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" },
  statCard: { background: "#111", padding: "24px", borderRadius: "20px", border: "1px solid #222", display: "flex", alignItems: "center", gap: "20px" },
  statIcon: { width: "48px", height: "48px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center" },
  statLabel: { color: "#888", fontSize: "13px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 4px 0" },
  statValue: { fontSize: "28px", fontWeight: "900", margin: 0 },

  chartCard: { background: "#111", padding: "30px", borderRadius: "24px", border: "1px solid #222", marginBottom: "20px" },
  chartHeader: { marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  chartTitle: { fontSize: "16px", fontWeight: "bold", margin: 0, display: "flex", alignItems: "center", gap: "8px" },
  streakLabel: { fontSize: "12px", fontWeight: "800", color: "#ff9800", textTransform: "uppercase" },
  
  chartArea: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", height: "150px", padding: "10px 0" },
  barCol: { display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", flex: 1 },
  barTrack: { width: "16px", height: "120px", background: "#222", borderRadius: "8px", display: "flex", alignItems: "flex-end", overflow: "hidden" },
  barFill: { width: "100%", borderRadius: "8px" },
  dayLabel: { fontSize: "12px" },

  insightCard: { background: "linear-gradient(135deg, #1a1a1a, #0a0a0a)", padding: "24px", borderRadius: "20px", border: "1px solid #333", borderLeft: "4px solid #8b5cf6", marginBottom: "30px" },
  insightHeader: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" },
  insightTitle: { fontSize: "14px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px", color: "#8b5cf6", margin: 0 },
  insightText: { fontSize: "15px", color: "#ccc", margin: 0, lineHeight: "1.6" },

  btnGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "16px" },
  boxBtn: { background: "#111", border: "1px solid #222", padding: "24px 10px", borderRadius: "20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", cursor: "pointer", textDecoration: "none" },
  boxIcon: { width: "54px", height: "54px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "4px" },
  boxText: { color: "white", fontSize: "14px", fontWeight: "bold" }
};

export default Vault;
