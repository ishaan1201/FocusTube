import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import GlassCard from "../components/ui/GlassCard";
import { summarizeFeedback } from "../services/aiSummary";
import { analyzeSentiment } from "../services/sentiment";
import { getAIResponse } from "../services/gemini";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Sparkles, Send, LogOut, ChevronRight, MessageSquare } from "lucide-react";

export default function Admin() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [replyText, setReplyText] = useState({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [aiSummary, setAiSummary] = useState("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [sentiment, setSentiment] = useState(null);
  const [isAnalyzingSentiment, setIsAnalyzingSentiment] = useState(false);
  const [realtimeStatusFilter, setRealtimeStatusFilter] = useState("all");

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

  const avgRating =
    feedback.reduce((acc, f) => acc + (f.rating || 0), 0) /
    (feedback.length || 1);

  const chartData = [...feedback].reverse().map((f) => ({
    date: new Date(f.created_at).toLocaleDateString(),
    rating: f.rating,
  }));

  const filteredFeedback = feedback.filter((f) => {
    const matchSearch =
      (f.pain_point?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (f.liked?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (f.suggestion?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (f.email?.toLowerCase() || "").includes(search.toLowerCase());

    const matchFilter =
      statusFilter === "all"
        ? true
        : statusFilter === "replied"
        ? f.replied
        : !f.replied;

    const matchStatus = 
      realtimeStatusFilter === "all"
        ? true
        : f.status === realtimeStatusFilter;

    return matchSearch && matchFilter && matchStatus;
  });

  const handleReplyChange = (id, text) => {
    setReplyText((prev) => ({ ...prev, [id]: text }));
  };

  const submitReply = async (id, textOverride) => {
    const text = textOverride || replyText[id];
    if (!text) return;

    const { error } = await supabase
      .from("feedback")
      .update({
        reply: text,
        replied: true,
      })
      .eq("id", id);

    if (error) {
      alert("Error submitting reply");
    } else {
      if (!textOverride) alert("Reply submitted!");
      fetchFeedback();
    }
  };

  const markResolved = async (id) => {
    await supabase
      .from("feedback")
      .update({ status: "resolved" })
      .eq("id", id);
    fetchFeedback();
  };

  const getPriority = (item) => {
    if (item.rating <= 4) return "high";
    if (item.rating <= 7) return "medium";
    return "low";
  };

  const autoReply = async (item) => {
    const res = await getAIResponse(
      "Auto Reply",
      "Support Bot",
      `Write a short, friendly, and professional response to this feedback: "${item.pain_point || item.suggestion}". The user rated us ${item.rating}/10.`
    );
    handleReplyChange(item.id, res);
  };

  const generateTags = async (item) => {
    const res = await getAIResponse(
      "Tag Generator",
      "AI Classifier",
      `Give 3 short one-word tags for this feedback: "${item.pain_point || item.suggestion}". Return tags separated by commas only.`
    );
    
    await supabase
      .from("feedback")
      .update({ tags: res.split(",").map(t => t.trim()) })
      .eq("id", item.id);
    
    fetchFeedback();
  };

  const generateAiInsights = async () => {
    setIsGeneratingAi(true);
    try {
      const summary = await summarizeFeedback(feedback);
      setAiSummary(summary);
    } catch (error) {
      console.error("AI Insight error:", error);
      alert("Failed to generate AI insights.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const loadSentiment = async () => {
    if (feedback.length === 0) return;
    setIsAnalyzingSentiment(true);
    try {
      const res = await analyzeSentiment(feedback);
      setSentiment(res);
    } catch (error) {
      console.error("Sentiment analysis error:", error);
    } finally {
      setIsAnalyzingSentiment(false);
    }
  };

  useEffect(() => {
    if (feedback.length > 0 && !sentiment && activeTab === "overview") {
      loadSentiment();
    }
  }, [feedback, activeTab]);

  return (
    <div className="relative p-6 text-white bg-black min-h-screen font-sans">
      {/* Background Glow */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute w-[600px] h-[600px] bg-purple-600/10 blur-[120px] -top-20 -left-20 animate-pulse" />
        <div className="absolute w-[600px] h-[600px] bg-blue-600/10 blur-[120px] -bottom-20 -right-20 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
            Admin Center
          </h1>
          <p className="text-zinc-500 mt-1">Manage Curio's user experience and feedback.</p>
        </div>
        <button 
          onClick={() => { localStorage.removeItem("admin_auth"); navigate("/admin-login"); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 rounded-xl text-sm font-medium transition-all"
        >
          <LogOut size={16} /> Logout
        </button>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {["overview", "feedback", "replies", "system"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === tab
                ? "bg-white text-black shadow-xl scale-105"
                : "bg-zinc-900/50 text-zinc-500 hover:bg-zinc-800 border border-white/5"
            }`}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
          <p className="mt-4 text-zinc-500 font-medium">Loading analytics...</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard className="flex flex-col justify-between">
                  <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-4">Total Interactions</p>
                  <h2 className="text-5xl font-black">{feedback.length}</h2>
                  <div className="mt-4 h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-[70%]" />
                  </div>
                </GlassCard>

                <GlassCard className="flex flex-col justify-between border-yellow-500/20">
                  <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-4">Average Satisfaction</p>
                  <h2 className="text-5xl font-black text-yellow-400">
                    {avgRating.toFixed(1)} <span className="text-xl text-zinc-600 font-medium">/ 10</span>
                  </h2>
                  <div className="mt-4 flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full ${i < Math.round(avgRating/2) ? 'bg-yellow-400' : 'bg-zinc-800'}`} />
                    ))}
                  </div>
                </GlassCard>

                <GlassCard className="flex flex-col justify-between">
                  <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-4">Latest Feedback</p>
                  <h2 className="text-xl font-bold leading-tight">
                    {feedback[0]?.created_at
                      ? new Date(feedback[0].created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : "No data"}
                  </h2>
                  <p className="text-zinc-500 text-sm mt-2">{feedback[0]?.email || "Anonymous user"}</p>
                </GlassCard>
              </div>

              {/* AI Insights Section */}
              <GlassCard className="border-purple-500/30 bg-purple-500/[0.02]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500 rounded-lg">
                      <Sparkles size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">FocusAI Insights</h3>
                      <p className="text-zinc-500 text-sm">Automated feedback analysis and summary.</p>
                    </div>
                  </div>
                  <button
                    onClick={generateAiInsights}
                    disabled={isGeneratingAi || feedback.length === 0}
                    className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-xl font-bold text-sm transition-all shadow-lg shadow-purple-600/20"
                  >
                    {isGeneratingAi ? "Analyzing..." : "Generate AI Summary"}
                  </button>
                </div>

                {aiSummary && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="p-6 bg-black/40 border border-purple-500/20 rounded-2xl"
                  >
                    <div className="prose prose-invert max-w-none prose-sm">
                      <pre className="whitespace-pre-wrap font-sans text-zinc-300 leading-relaxed">
                        {aiSummary}
                      </pre>
                    </div>
                  </motion.div>
                )}
              </GlassCard>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GlassCard>
                  <h3 className="text-xl font-bold mb-8">Performance Trends</h3>
                  <div className="h-[350px] w-full pr-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <defs>
                          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#4f46e5" />
                            <stop offset="100%" stopColor="#9333ea" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          stroke="#444" 
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          dy={10}
                        />
                        <YAxis 
                          stroke="#444" 
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          domain={[0, 10]}
                          dx={-10}
                        />
                        <Tooltip 
                          contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                          itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="rating" 
                          stroke="url(#lineGradient)" 
                          strokeWidth={4}
                          dot={{ fill: '#4f46e5', strokeWidth: 2, r: 5, stroke: '#000' }}
                          activeDot={{ r: 8, strokeWidth: 0, fill: '#fff' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>

                <GlassCard>
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-bold">Sentiment Analysis</h3>
                    <button 
                      onClick={loadSentiment}
                      disabled={isAnalyzingSentiment}
                      className="text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded-lg transition-colors"
                    >
                      {isAnalyzingSentiment ? "Analyzing..." : "Refresh"}
                    </button>
                  </div>
                  <div className="h-[350px] w-full flex flex-col items-center justify-center">
                    {sentiment ? (
                      <div className="w-full h-full flex flex-col md:flex-row items-center justify-center">
                        <div className="flex-1 h-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: "Positive", value: sentiment.positive || 0, color: "#22c55e" },
                                  { name: "Neutral", value: sentiment.neutral || 0, color: "#eab308" },
                                  { name: "Negative", value: sentiment.negative || 0, color: "#ef4444" },
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {[
                                  { color: "#22c55e" },
                                  { color: "#eab308" },
                                  { color: "#ef4444" },
                                ].map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                              </Pie>
                              <Tooltip 
                                contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }}
                                itemStyle={{ fontWeight: 'bold' }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex flex-col gap-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <span className="text-sm font-bold text-zinc-300">Positive: {sentiment.positive}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                            <span className="text-sm font-bold text-zinc-300">Neutral: {sentiment.neutral}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <span className="text-sm font-bold text-zinc-300">Negative: {sentiment.negative}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4 text-zinc-500">
                        <Sparkles size={40} className="animate-pulse" />
                        <p className="text-sm font-medium">Analyzing audience sentiment...</p>
                      </div>
                    )}
                  </div>
                </GlassCard>
              </div>

              <GlassCard>
                <h3 className="text-xl font-bold mb-8">Raw Performance Data</h3>
                <div className="h-[350px] w-full pr-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <defs>
                        <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#4f46e5" />
                          <stop offset="100%" stopColor="#9333ea" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#444" 
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis 
                        stroke="#444" 
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        domain={[0, 10]}
                        dx={-10}
                      />
                      <Tooltip 
                        contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="rating" 
                        stroke="url(#lineGradient)" 
                        strokeWidth={4}
                        dot={{ fill: '#4f46e5', strokeWidth: 2, r: 5, stroke: '#000' }}
                        activeDot={{ r: 8, strokeWidth: 0, fill: '#fff' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {activeTab === "feedback" && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row gap-4 mb-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input
                    placeholder="Search messages, emails, or pain points..."
                    className="w-full pl-12 pr-4 py-3 bg-zinc-900/50 border border-white/5 rounded-2xl focus:outline-none focus:border-purple-500/50 transition-all text-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="relative">
                  <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  <select
                    className="pl-11 pr-10 py-3 bg-zinc-900/50 border border-white/5 rounded-2xl focus:outline-none focus:border-purple-500/50 transition-all text-sm appearance-none cursor-pointer"
                    value={realtimeStatusFilter}
                    onChange={(e) => setRealtimeStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="new">New</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-6">
                {filteredFeedback.map((item) => (
                  <GlassCard
                    key={item.id}
                    className={`group transition-all hover:bg-white/[0.07] ${item.replied ? 'border-zinc-800' : 'border-blue-500/20'}`}
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                          item.rating >= 8 ? "bg-green-500/20 text-green-500" : 
                          item.rating >= 5 ? "bg-yellow-500/20 text-yellow-500" : 
                          "bg-red-500/20 text-red-500"
                        }`}>
                          {item.rating}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-zinc-200">{item.email || "Anonymous User"}</h4>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-tighter ${
                              getPriority(item) === "high" ? "bg-red-500/20 text-red-500" :
                              getPriority(item) === "medium" ? "bg-yellow-500/20 text-yellow-500" :
                              "bg-green-500/20 text-green-500"
                            }`}>
                              {getPriority(item)} Priority
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 uppercase font-bold tracking-tight">
                            Submitted {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <select
                          value={item.status || "new"}
                          onChange={async (e) => {
                            await supabase
                              .from("feedback")
                              .update({ status: e.target.value })
                              .eq("id", item.id);
                            fetchFeedback();
                          }}
                          className="bg-zinc-900 border border-white/10 text-xs font-bold px-3 py-1.5 rounded-xl outline-none focus:border-purple-500/50 transition-all"
                        >
                          <option value="new">New</option>
                          <option value="reviewing">Reviewing</option>
                          <option value="resolved">Resolved</option>
                        </select>
                        {item.replied && (
                          <span className="bg-blue-500 text-[10px] font-black px-2 py-0.5 rounded text-white tracking-widest uppercase">
                            Replied
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4 text-sm">
                      <div className="p-4 bg-black/30 rounded-xl border border-white/5">
                        <p className="text-[10px] text-zinc-500 uppercase font-black mb-2 tracking-widest flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Pain Point
                        </p>
                        <p className="text-zinc-300 italic">"{item.pain_point || "Nothing reported"}"</p>
                      </div>

                      <div className="p-4 bg-black/30 rounded-xl border border-white/5">
                        <p className="text-[10px] text-zinc-500 uppercase font-black mb-2 tracking-widest flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Favorites
                        </p>
                        <p className="text-zinc-300 italic">"{item.liked || "Nothing reported"}"</p>
                      </div>

                      <div className="p-4 bg-black/30 rounded-xl border border-white/5">
                        <p className="text-[10px] text-zinc-500 uppercase font-black mb-2 tracking-widest flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Suggestions
                        </p>
                        <p className="text-zinc-300 italic">"{item.suggestion || "Nothing reported"}"</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-8">
                      {item.tags?.map((tag, i) => (
                        <span key={i} className="bg-zinc-800 text-zinc-400 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border border-white/5">
                          #{tag}
                        </span>
                      ))}
                      {!item.tags && (
                        <button 
                          onClick={() => generateTags(item)}
                          className="text-[10px] text-zinc-600 hover:text-zinc-400 font-bold uppercase tracking-widest transition-colors"
                        >
                          + Generate AI Tags
                        </button>
                      )}
                    </div>

                    <div className="pt-6 border-t border-white/5">
                      {item.replied ? (
                        <div className="flex gap-4 p-4 bg-blue-500/[0.03] rounded-2xl border border-blue-500/10">
                          <div className="p-2 h-fit bg-blue-500 rounded-lg shrink-0">
                            <MessageSquare size={16} className="text-white" />
                          </div>
                          <div>
                            <p className="text-xs text-blue-500 font-black uppercase mb-1 tracking-widest">Admin Response</p>
                            <p className="text-zinc-300 text-sm">{item.reply}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex gap-2 mb-2">
                            <button
                              onClick={() => autoReply(item)}
                              className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                              ⚡ AI Reply
                            </button>
                            <button
                              onClick={() => markResolved(item.id)}
                              className="px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                              ✅ Resolve
                            </button>
                          </div>
                          <div className="relative">
                            <textarea
                              placeholder="Type your official response..."
                              className="w-full p-4 bg-black/50 border border-white/5 rounded-2xl text-sm focus:outline-none focus:border-purple-500/50 transition-all min-h-[100px]"
                              value={replyText[item.id] || ""}
                              onChange={(e) => handleReplyChange(item.id, e.target.value)}
                            />
                            <button
                              onClick={() => submitReply(item.id)}
                              disabled={!replyText[item.id]}
                              className="absolute bottom-4 right-4 flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-20 disabled:grayscale rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                            >
                              <Send size={14} /> Send Reply
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </GlassCard>
                ))}
                {filteredFeedback.length === 0 && (
                  <div className="text-center py-20 bg-zinc-900/20 rounded-3xl border border-dashed border-zinc-800">
                    <p className="text-zinc-500 font-medium italic">No feedback matches your current search or filter.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "replies" && (
            <motion.div
              key="replies"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <GlassCard>
                <h3 className="text-xl font-bold mb-6">Interaction History</h3>
                <div className="space-y-4">
                  {feedback.filter(f => f.replied).map(item => (
                    <div key={item.id} className="group p-5 bg-black/40 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold">
                            {item.email ? item.email[0].toUpperCase() : "?"}
                          </div>
                          <span className="text-sm font-bold text-zinc-300">{item.email || "Anonymous User"}</span>
                        </div>
                        <span className="text-[10px] text-zinc-600 font-black tracking-widest uppercase">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mb-3 pl-11 line-clamp-1 italic">User said: "{item.suggestion || item.pain_point}"</p>
                      <div className="pl-11 border-l-2 border-blue-500/20 ml-4 py-1">
                        <p className="text-sm text-blue-400 font-medium leading-relaxed">{item.reply}</p>
                      </div>
                    </div>
                  ))}
                  {feedback.filter(f => f.replied).length === 0 && (
                    <div className="text-center py-20">
                      <MessageSquare className="mx-auto text-zinc-800 mb-4" size={48} />
                      <p className="text-zinc-600 font-medium">Your reply inbox is empty.</p>
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          )}

          {activeTab === "system" && (
            <motion.div
              key="system"
              initial={{ opacity: 0, zoom: 0.9 }}
              animate={{ opacity: 1, zoom: 1 }}
              exit={{ opacity: 0, zoom: 0.9 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <GlassCard className="flex flex-col">
                <h3 className="text-xl font-bold mb-6">Infrastructure Status</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-green-500/5 border border-green-500/10 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
                      <span className="font-bold text-green-500">Database Core</span>
                    </div>
                    <span className="text-xs font-black text-green-500/50 uppercase tracking-widest">Connected</span>
                  </div>

                  <div className="space-y-4 px-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-500">Service Provider</span>
                      <span className="font-bold text-zinc-300">Supabase DB</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-500">Region</span>
                      <span className="font-bold text-zinc-300">aws-us-east-1</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-500">Avg. Response Time</span>
                      <span className="font-bold text-zinc-300">18ms</span>
                    </div>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="opacity-40 grayscale flex flex-col justify-center items-center text-center">
                <Sparkles className="text-zinc-600 mb-4" size={40} />
                <h4 className="font-bold text-zinc-400">Advanced AI Monitoring</h4>
                <p className="text-xs text-zinc-600 mt-2 max-w-[200px]">Real-time sentiment anomaly detection coming in v2.0</p>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
