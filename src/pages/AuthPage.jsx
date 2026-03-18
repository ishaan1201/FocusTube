import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Chrome, ArrowRight, Loader2, Sparkles, LogIn, Monitor } from "lucide-react";

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, signIn, refreshProfile, signUp } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
  });

  // Redirect if fully logged in
  useEffect(() => {
    if (user && !user.is_anonymous) navigate("/");
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        const { error: signInError } = await signIn(formData.email, formData.password);
        if (signInError) throw signInError;
      } else {
        const { error: signUpError } = await signUp(formData.email, formData.password, {
          data: { full_name: formData.username }
        });
        if (signUpError) throw signUpError;
        alert("Verification email sent! Check your inbox to activate your account. 🚀");
      }
      await refreshProfile();
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider });
      if (error) throw error;
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex w-full font-sans bg-white overflow-hidden">
      
      {/* ========================================== */}
      {/* 👈 LEFT PANEL: CRISP AUTH FORM */}
      {/* ========================================== */}
      <div className="w-full lg:w-[45%] xl:w-[40%] flex flex-col justify-center px-8 sm:px-16 md:px-24 lg:px-16 relative z-10 bg-white shadow-[20px_0_40px_rgba(0,0,0,0.04)]">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-sm mx-auto"
        >
          {/* Header */}
          <div className="mb-10">
            <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
              {isLogin ? <LogIn size={24} className="text-white" /> : <Sparkles size={24} className="text-white" />}
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
              {isLogin ? "Welcome back" : "Create an account"}
            </h1>
            <p className="text-slate-500 font-medium text-sm">
              {isLogin ? "Enter your details to access your workspace." : "Join FocusTube to secure your notes and insights."}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: "auto", scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  className="relative overflow-hidden"
                >
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text" required placeholder="e.g. Ishaan"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium placeholder:text-slate-400"
                      value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email" required placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium placeholder:text-slate-400"
                  value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password" required placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium placeholder:text-slate-400"
                  value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-xs font-bold px-2 py-2 text-center bg-red-50 rounded-lg border border-red-100">
                {error}
              </motion.p>
            )}

            <button
              disabled={loading}
              className="w-full py-4 mt-2 bg-slate-900 text-white rounded-xl font-bold text-sm transition-all hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/20 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (
                <>
                  {isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest"><span className="bg-white px-4 text-slate-400">Or continue with</span></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleOAuth('google')} className="flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-[0.98]">
              <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="text-xs font-bold text-slate-700">Google</span>
            </button>
            <button onClick={() => handleOAuth('azure')} className="flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-[0.98]">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 21 21">
                <rect x="1" y="1" width="9" height="9" fill="#f25022"/><rect x="11" y="1" width="9" height="9" fill="#7fba00"/><rect x="1" y="11" width="9" height="9" fill="#00a4ef"/><rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
              </svg>
              <span className="text-xs font-bold text-slate-700">Microsoft</span>
            </button>
          </div>

          <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-8 text-slate-500 hover:text-slate-800 text-sm font-semibold transition-all flex items-center justify-center gap-2 group">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <span className="text-blue-600 font-bold group-hover:underline">{isLogin ? "Sign up" : "Log in"}</span>
          </button>
        </motion.div>
      </div>

      {/* ========================================== */}
      {/* 👉 RIGHT PANEL: CALM & RELAXING VISUAL */}
      {/* ========================================== */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden bg-slate-900">
        
        {/* Extremely slow "breathing" background image for a calming effect */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 z-0"
        >
          <img
            src="https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=2070&auto=format&fit=crop" 
            alt="Serene landscape"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/30 to-slate-900/40" />
        </motion.div>

        {/* 🌟 NEW: Subtle, slow-moving dust motes / fireflies */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full mix-blend-screen shadow-[0_0_8px_2px_rgba(255,255,255,0.4)]"
              initial={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                opacity: 0,
                scale: Math.random() * 0.5 + 0.5,
              }}
              animate={{
                top: [`${Math.random() * 100}%`, `${Math.random() * 100 - 15}%`],
                opacity: [0, Math.random() * 0.4 + 0.2, 0],
              }}
              transition={{
                duration: Math.random() * 15 + 15, // Ultra slow (15-30 seconds)
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 10,
              }}
            />
          ))}
        </div>

        {/* Minimalist text */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, delay: 0.5 }}
          className="relative z-10 p-12 max-w-lg text-center flex flex-col items-center"
        >
          <h2 className="text-3xl font-serif italic text-white/90 mb-6 tracking-wide drop-shadow-lg">
            "Quiet the mind, and the soul will speak."
          </h2>
          <div className="w-12 h-[1px] bg-white/30 mb-6" />
          <p className="text-white/50 text-xs font-bold tracking-[0.3em] uppercase">
            Take a deep breath
          </p>
        </motion.div>

      </div>
    </div>
  );
}
