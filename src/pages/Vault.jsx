import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { 
  Flame, Clock, Calendar, StickyNote, MessageSquare, 
  History, Heart, Bookmark, Brain, Zap, TrendingUp, 
  Loader2, Archive, FileText, ChevronRight
} from "lucide-react";
import { getFocusStats } from "../utils/storage";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../services/supabase";
import { fetchDocuments } from "../services/userData";
import { motion } from "framer-motion";

function Vault() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalMins: 0,
    todayMins: 0,
    weeklyData: [0, 0, 0, 0, 0, 0, 0]
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const [notes, setNotes] = useState([]);
  const [insights, setInsights] = useState([]);

  // 1. FETCH PRODUCTIVITY STATS
  useEffect(() => {
    const fetchCloudStats = async () => {
      if (!user) {
        setInitialLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("analytics")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (data && !error) {
          const local = getFocusStats();
          const merged = {
            totalMins: Math.max(local.totalMins, data.total_mins),
            todayMins: local.todayMins,
            weeklyData: local.weeklyData.map((mins, i) => Math.max(mins, data.weekly_data[i] || 0))
          };
          setStats(merged);
        } else {
          setStats(getFocusStats());
        }
      } catch (err) {
        setStats(getFocusStats());
      } finally {
        setInitialLoading(false);
      }
    };
    fetchCloudStats();
  }, [user]);

  // 2. FETCH DOCUMENTS (NOTES & INSIGHTS)
  useEffect(() => {
    const loadDocs = async () => {
      const [fetchedNotes, fetchedInsights] = await Promise.all([
        fetchDocuments(user, 'note'),
        fetchDocuments(user, 'ai_insight')
      ]);
      setNotes(fetchedNotes);
      setInsights(fetchedInsights);
    };
    if (!initialLoading) loadDocs();
  }, [user, initialLoading]);

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

  // LIVE TRACKING
  useEffect(() => {
    if (initialLoading) return;
    const refreshStats = () => {
      const newStats = getFocusStats();
      setStats(newStats);
      return newStats;
    };
    const interval = setInterval(() => {
      const updated = refreshStats();
      if (user) syncToSupabase(updated);
    }, 15000);
    return () => clearInterval(interval);
  }, [user, initialLoading, syncToSupabase]);

  const getProductivityScore = () => {
    const total = stats.totalMins;
    const week = stats.weeklyData;
    const consistency = week.filter((d) => d > 0).length / 7;
    return Math.min(100, Math.round((total / 300) * 100 * consistency)) || 0;
  };

  const getStreak = () => {
    let streak = 0;
    const today = new Date().getDay();
    for (let i = today; i >= 0; i--) {
      if (stats.weeklyData[i] > 0) streak++;
      else if (i !== today) break;
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
    const m = Math.round(mins % 60);
    return `${h}h ${m}m`;
  };

  const maxWeeklyMins = Math.max(...stats.weeklyData, 60);
  const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-500" size={32} />
      </div>
    );
  }

  return (
    <div className="p-10 max-w-6xl mx-auto text-white">
      <header className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <Archive size={32} className="text-purple-500" />
          <h1 className="text-4xl font-black tracking-tighter">THE VAULT</h1>
        </div>
        {isSyncing && (
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-500/20">
            <Zap size={10} fill="currentColor" /> Cloud Sync Active
          </div>
        )}
      </header>

      {/* 📊 CORE STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard icon={<Clock className="text-blue-400" />} label="Today's Focus" value={formatHrsMins(stats.todayMins)} />
        <StatCard icon={<Brain className="text-purple-400" />} label="Productivity" value={`${getProductivityScore()}%`} />
        <StatCard icon={<Flame className="text-orange-400" />} label="Current Streak" value={`${getStreak()} Days`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* LEFT: CHART & INSIGHTS */}
        <div className="lg:col-span-8 space-y-10">
          <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-8 rounded-[2rem]">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-8 flex items-center gap-2">
              <Calendar size={16} /> Weekly Activity
            </h3>
            <div className="flex justify-between items-end h-40 gap-2">
              {stats.weeklyData.map((mins, idx) => {
                const isToday = new Date().getDay() === idx;
                const height = mins > 0 ? Math.max(8, (mins / maxWeeklyMins) * 100) : 0;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-3">
                    <div className="w-full bg-white/5 rounded-t-xl flex items-end h-full overflow-hidden">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        className={`w-full rounded-t-lg ${isToday ? 'bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]' : 'bg-zinc-700'}`}
                      />
                    </div>
                    <span className={`text-[10px] font-black ${isToday ? 'text-purple-400' : 'text-zinc-600'}`}>{daysOfWeek[idx]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/20 p-8 rounded-[2rem]">
            <div className="flex items-center gap-3 mb-4">
              <Zap size={20} className="text-yellow-400" fill="currentColor" />
              <h3 className="text-lg font-black tracking-tight">FocusAI Intelligence</h3>
            </div>
            <p className="text-zinc-300 leading-relaxed italic">"{generateInsight()}"</p>
          </div>
        </div>

        {/* RIGHT: DOCUMENTS PREVIEW */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2rem]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Latest Notes</h3>
              <Link to="/notes" className="text-[10px] font-bold text-purple-400 hover:underline flex items-center">
                All <ChevronRight size={10} />
              </Link>
            </div>
            <div className="space-y-3">
              {notes.slice(0, 3).map((note, i) => (
                <div key={i} className="p-4 bg-black/40 border border-white/5 rounded-2xl hover:border-purple-500/30 transition-all cursor-pointer group">
                  <p className="text-[10px] font-black text-zinc-500 mb-1">ID: {note.videoId}</p>
                  <p className="text-xs text-zinc-300 line-clamp-1 group-hover:text-white transition-colors">
                    {note.content.replace(/<[^>]*>/g, '').substring(0, 40)}...
                  </p>
                </div>
              ))}
              {notes.length === 0 && <p className="text-xs text-zinc-600 italic">No notes captured yet.</p>}
            </div>
          </div>

          {/* Quick Nav Grid */}
          <div className="grid grid-cols-2 gap-4">
             <NavIcon to="/history" icon={<History />} label="History" />
             <NavIcon to="/liked" icon={<Heart />} label="Liked" />
             <NavIcon to="/saved" icon={<Bookmark />} label="Saved" />
             <NavIcon to="/insights" icon={<TrendingUp />} label="Stats" />
          </div>
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ icon, label, value }) => (
  <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-6 rounded-[2rem] flex items-center gap-5">
    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">{label}</p>
      <h2 className="text-2xl font-black tracking-tight">{value}</h2>
    </div>
  </div>
);

const NavIcon = ({ to, icon, label }) => (
  <Link to={to} className="flex flex-col items-center justify-center p-6 bg-zinc-900/40 border border-white/5 rounded-[2rem] hover:bg-white/5 transition-all active:scale-95 group">
    <div className="text-zinc-500 group-hover:text-white transition-colors mb-2">
      {icon}
    </div>
    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-white">{label}</span>
  </Link>
);

export default Vault;
