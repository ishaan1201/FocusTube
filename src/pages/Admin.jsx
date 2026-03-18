import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, Pie, PieChart } from "recharts";
import GlassCard from "../components/ui/GlassCard";
import { summarizeFeedback } from "../services/aiSummary";
import { analyzeSentiment } from "../services/sentiment";
import { getAIResponse } from "../services/gemini";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Sparkles, Send, LogOut, MessageSquare, CheckCircle, Zap, ShieldAlert, AlertCircle, Info } from "lucide-react";

export default function Admin() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("feedback"); // Default to feedback for command center
  const [selected, setSelected] = useState(null);
  const [replyText, setReplyText] = useState({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [aiSummary, setAiSummary] = useState("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [sentiment, setSentiment] = useState(null);
  const [isAnalyzingSentiment, setIsAnalyzingSentiment] = useState(false);
  const [commandFocusMode, setCommandFocusMode] = useState(true);

  const fetchFeedback = async () => {
    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setFeedback(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    const isAuth = localStorage.getItem("admin_auth");
    if (!isAuth) {
      navigate("/admin-login");
    } else {
      fetchFeedback();
    }
  }, [navigate]);

  // AUTO-OPEN HIGH PRIORITY
  useEffect(() => {
    if (feedback.length > 0 && !selected) {
      const high = feedback.find((f) => (f.priority === "high" || f.rating <= 4) && f.status !== "resolved");
      if (high) {
        setSelected(high);
      } else if (feedback[0]) {
        setSelected(feedback[0]);
      }
    }
  }, [feedback, selected]);

  const submitReply = async (id, textOverride) => {
    const text = textOverride || replyText[id];
    if (!text) return;

    const { error } = await supabase
      .from("feedback")
      .update({
        reply: text,
        replied: true,
        status: "resolved" // Auto-resolve on reply in command center
      })
      .eq("id", id);

    if (!error) {
      fetchFeedback();
      setReplyText(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const markResolved = useCallback(async (id) => {
    if (!id) return;
    await supabase
      .from("feedback")
      .update({ status: "resolved" })
      .eq("id", id);
    fetchFeedback();
  }, []);

  const autoReply = useCallback(async (item) => {
    if (!item) return;
    const res = await getAIResponse(
      "Auto Reply",
      "Support Bot",
      `Write a short, friendly, and professional response to this feedback: "${item.pain_point || item.suggestion}". The user rated us ${item.rating}/10.`
    );
    setReplyText((prev) => ({ ...prev, [item.id]: res }));
  }, []);

  // KEYBOARD SHORTCUTS
  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
      
      if (selected) {
        if (e.key === "r") markResolved(selected.id);
        if (e.key === "a") autoReply(selected);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selected, markResolved, autoReply]);

  const visibleFeedback = feedback.filter((f) => {
    const matchSearch =
      (f.pain_point?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (f.email?.toLowerCase() || "").includes(search.toLowerCase());

    if (commandFocusMode) {
      return matchSearch && (f.priority === "high" || f.rating <= 4 || f.status === "new");
    }

    const matchStatus = statusFilter === "all" ? true : f.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getPriorityIcon = (item) => {
    const p = item.priority || (item.rating <= 4 ? "high" : item.rating <= 7 ? "medium" : "low");
    if (p === "high") return <ShieldAlert className="text-red-500" size={16} />;
    if (p === "medium") return <AlertCircle className="text-yellow-500" size={16} />;
    return <Info className="text-blue-500" size={16} />;
  };

  return (
    <div className="relative text-white bg-black min-h-screen font-sans flex flex-col">
      {/* Background Glow */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute w-[600px] h-[600px] bg-purple-600/5 blur-[120px] -top-20 -left-20" />
        <div className="absolute w-[600px] h-[600px] bg-blue-600/5 blur-[120px] -bottom-20 -right-20" />
      </div>

      {/* Mini Header */}
      <header className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-black tracking-tighter bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
            COMMAND CENTER
          </h1>
          <div className="h-4 w-[1px] bg-white/10" />
          <nav className="flex gap-4">
            <button onClick={() => setActiveTab("overview")} className={`text-xs font-bold uppercase tracking-widest ${activeTab === 'overview' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Overview</button>
            <button onClick={() => setActiveTab("feedback")} className={`text-xs font-bold uppercase tracking-widest ${activeTab === 'feedback' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Operations</button>
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-zinc-900/50 p-1 rounded-lg border border-white/5">
            <button 
              onClick={() => setCommandFocusMode(true)}
              className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-tighter transition-all ${commandFocusMode ? 'bg-red-500 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
            >
              Focus Mode
            </button>
            <button 
              onClick={() => setCommandFocusMode(false)}
              className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-tighter transition-all ${!commandFocusMode ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'}`}
            >
              All
            </button>
          </div>
          <button 
            onClick={() => { localStorage.removeItem("admin_auth"); navigate("/admin-login"); }}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {activeTab === "feedback" ? (
          <div className="flex-1 grid grid-cols-12 overflow-hidden">
            {/* LEFT: Feedback List */}
            <div className="col-span-4 border-r border-white/5 flex flex-col bg-zinc-950/20">
              <div className="p-4 border-b border-white/5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                  <input
                    placeholder="Quick search..."
                    className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/5 rounded-lg text-xs focus:outline-none focus:border-purple-500/30 transition-all"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-hide">
                {visibleFeedback.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelected(item)}
                    className={`p-4 border-b border-white/5 cursor-pointer transition-all hover:bg-white/[0.02] relative group ${
                      selected?.id === item.id ? 'bg-white/[0.05] border-l-2 border-l-purple-500' : ''
                    } ${item.status === 'resolved' ? 'opacity-40' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter truncate max-w-[150px]">
                        {item.email || "Anonymous"}
                      </span>
                      {getPriorityIcon(item)}
                    </div>
                    <p className="text-sm font-medium line-clamp-2 text-zinc-200 mb-2 leading-snug">
                      {item.pain_point || item.suggestion || "No content"}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold text-zinc-600 uppercase">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                      <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-black ${
                        item.rating >= 8 ? "text-green-500" : item.rating <= 4 ? "text-red-500" : "text-yellow-500"
                      }`}>
                        {item.rating}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: Detail Panel */}
            <div className="col-span-8 flex flex-col bg-black">
              <AnimatePresence mode="wait">
                {selected ? (
                  <motion.div 
                    key={selected.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex-1 flex flex-col p-8 overflow-y-auto"
                  >
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-2xl font-black text-white">{selected.email || "Anonymous User"}</h2>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                            selected.priority === 'high' || selected.rating <= 4 ? 'bg-red-500/20 text-red-500' : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {selected.priority?.toUpperCase() || (selected.rating <= 4 ? "HIGH" : "NORMAL")} PRIORITY
                          </span>
                        </div>
                        <p className="text-zinc-500 text-sm">Submitted on {new Date(selected.created_at).toLocaleString()}</p>
                      </div>
                      <div className="text-4xl font-black bg-zinc-900 w-16 h-16 rounded-2xl flex items-center justify-center border border-white/5">
                        {selected.rating}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="p-5 bg-zinc-900/50 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                          <AlertCircle size={12} /> Pain Point
                        </p>
                        <p className="text-zinc-300 leading-relaxed italic">"{selected.pain_point || "N/A"}"</p>
                      </div>
                      <div className="p-5 bg-zinc-900/50 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                          <Sparkles size={12} /> Suggestion
                        </p>
                        <p className="text-zinc-300 leading-relaxed italic">"{selected.suggestion || "N/A"}"</p>
                      </div>
                    </div>

                    <div className="mt-auto pt-8 border-t border-white/5">
                      <div className="flex items-center justify-between mb-4">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Quick Actions</label>
                        <div className="flex gap-2">
                          <span className="text-[10px] text-zinc-600 bg-zinc-900 px-2 py-1 rounded border border-white/10 font-mono">A: AI Reply</span>
                          <span className="text-[10px] text-zinc-600 bg-zinc-900 px-2 py-1 rounded border border-white/10 font-mono">R: Resolve</span>
                        </div>
                      </div>

                      <div className="relative group">
                        <textarea
                          placeholder="Type your official response..."
                          className="w-full p-6 bg-zinc-900/80 border border-white/5 rounded-[1.5rem] text-sm focus:outline-none focus:border-purple-500/50 transition-all min-h-[180px] shadow-inner"
                          value={replyText[selected.id] || ""}
                          onChange={(e) => setReplyText(prev => ({ ...prev, [selected.id]: e.target.value }))}
                        />
                        <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => autoReply(selected)}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-purple-600/20"
                          >
                            <Zap size={14} /> AI Reply
                          </button>
                          <button
                            onClick={() => submitReply(selected.id)}
                            disabled={!replyText[selected.id]}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                          >
                            <Send size={14} /> Send & Resolve
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={() => markResolved(selected.id)}
                          className="flex items-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                          <CheckCircle size={16} className="text-green-500" /> Mark as Resolved
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-zinc-600">
                    <div className="w-16 h-16 rounded-full bg-zinc-950 border border-white/5 flex items-center justify-center mb-4">
                      <ShieldAlert size={32} />
                    </div>
                    <p className="font-bold uppercase tracking-widest text-xs">No Feedback Selected</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <GlassCard>
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-4">Avg Rating</p>
                <h2 className="text-4xl font-black">{(feedback.reduce((a, b) => a + b.rating, 0) / (feedback.length || 1)).toFixed(1)}</h2>
              </GlassCard>
              <GlassCard>
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-4">Total Items</p>
                <h2 className="text-4xl font-black">{feedback.length}</h2>
              </GlassCard>
              <GlassCard>
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-4">High Priority</p>
                <h2 className="text-4xl font-black text-red-500">{feedback.filter(f => f.priority === 'high' || f.rating <= 4).length}</h2>
              </GlassCard>
            </div>
            
            <GlassCard className="h-[400px]">
              <h3 className="text-lg font-bold mb-6">Interaction Trends</h3>
              <ResponsiveContainer width="100%" height="90%">
                <LineChart data={[...feedback].reverse().map(f => ({ date: new Date(f.created_at).toLocaleDateString(), rating: f.rating }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="date" stroke="#444" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#444" fontSize={10} axisLine={false} tickLine={false} domain={[0, 10]} />
                  <Tooltip contentStyle={{ background: '#0c0c0c', border: '1px solid #333' }} />
                  <Line type="monotone" dataKey="rating" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </GlassCard>
          </div>
        )}
      </main>
    </div>
  );
}
