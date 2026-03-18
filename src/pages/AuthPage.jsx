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
    <div className="min-h-screen w-full flex font-sans relative overflow-hidden bg-[#FAFAF9]">

      {/* 🌟 COZY, CONTINUOUS ANIMATED BACKGROUND */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Subtle noise texture for that tactile, premium feel */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay z-10" />

        {/* Warm, soft glowing orbs (Rose, Orange, Soft Indigo) */}
        <motion.div animate={{ x: [0, 40, 0], y: [0, -40, 0], scale: [1, 1.1, 1] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-rose-200/60 blur-[120px] rounded-full mix-blend-multiply" />
        <motion.div animate={{ x: [0, -40, 0], y: [0, 40, 0], scale: [1, 1.2, 1] }} transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-orange-200/50 blur-[140px] rounded-full mix-blend-multiply" />
        <motion.div animate={{ x: [0, 30, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute top-[20%] right-[30%] w-[40%] h-[40%] bg-indigo-200/40 blur-[120px] rounded-full mix-blend-multiply" />
      </div>

      {/* ========================================== */}
      {/* 👈 LEFT PANEL: FLOATING GLASS FORM */}
      {/* ========================================== */}
      <div className="w-full lg:w-[50%] flex flex-col justify-center px-6 sm:px-12 md:px-20 lg:px-24 relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-md mx-auto bg-white/60 backdrop-blur-3xl border border-white/60 p-8 sm:p-10 rounded-[2rem] shadow-[0_8px_40px_rgba(0,0,0,0.04)]"
        >
          {/* Header */}
          <div className="mb-8">
            <div className="w-12 h-12 bg-gradient-to-tr from-orange-400 to-rose-400 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-orange-500/20">
              {isLogin ? <LogIn size={24} className="text-white" /> : <Sparkles size={24} className="text-white" />}
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">
              {isLogin ? "Welcome back" : "Create an account"}
            </h1>
            <p className="text-slate-500 font-medium text-sm">
              {isLogin ? "Enter your details to access your workspace." : "Join FocusTube to secure your notes and insights."}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="relative overflow-hidden">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" required placeholder="Full Name" className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-slate-200/60 rounded-xl text-slate-800 focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-400/10 transition-all font-medium placeholder:text-slate-400 backdrop-blur-sm" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="email" required placeholder="Email Address" className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-slate-200/60 rounded-xl text-slate-800 focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-400/10 transition-all font-medium placeholder:text-slate-400 backdrop-blur-sm" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="password" required placeholder="Password" className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-slate-200/60 rounded-xl text-slate-800 focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-400/10 transition-all font-medium placeholder:text-slate-400 backdrop-blur-sm" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
            </div>

            {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-xs font-bold px-2 py-2 text-center bg-red-50/80 rounded-lg border border-red-100 backdrop-blur-sm">{error}</motion.p>}

            <button disabled={loading} className="w-full py-4 mt-2 bg-slate-800 text-white rounded-xl font-bold text-sm transition-all hover:bg-slate-900 hover:shadow-xl hover:shadow-slate-900/10 active:scale-[0.98] flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <>{isLogin ? "Sign In" : "Create Account"} <ArrowRight size={16} /></>}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200/60" /></div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest"><span className="bg-[#fdfcfb] px-4 text-slate-400 rounded-full">Or</span></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleOAuth('google')} className="flex items-center justify-center gap-2 py-3 bg-white/60 border border-slate-200/60 rounded-xl hover:bg-white transition-all shadow-sm active:scale-[0.98] backdrop-blur-sm">
              <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              <span className="text-xs font-bold text-slate-700">Google</span>
            </button>
            <button onClick={() => handleOAuth('azure')} className="flex items-center justify-center gap-2 py-3 bg-white/60 border border-slate-200/60 rounded-xl hover:bg-white transition-all shadow-sm active:scale-[0.98] backdrop-blur-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 21 21"><rect x="1" y="1" width="9" height="9" fill="#f25022"/><rect x="11" y="1" width="9" height="9" fill="#7fba00"/><rect x="1" y="11" width="9" height="9" fill="#00a4ef"/><rect x="11" y="11" width="9" height="9" fill="#ffb900"/></svg>
              <span className="text-xs font-bold text-slate-700">Microsoft</span>
            </button>
          </div>
          
          <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-8 text-slate-500 hover:text-slate-800 text-sm font-semibold transition-all flex items-center justify-center gap-2 group">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <span className="text-orange-500 font-bold group-hover:underline">{isLogin ? "Sign up" : "Log in"}</span>
          </button>
        </motion.div>
      </div>

      {/* ========================================== */}
      {/* 👉 RIGHT PANEL: ABSTRACT GLASS SPHERE */}
      {/* ========================================== */}
      <div className="hidden lg:flex w-[50%] items-center justify-center relative z-20 pointer-events-none p-12">
        {/* The main rotating glass orb container */}
        <div className="relative w-full max-w-lg aspect-square flex items-center justify-center">
          
          {/* Main Frosted Glass Sphere */}
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.02, 1] }}
            transition={{ rotate: { duration: 40, repeat: Infinity, ease: "linear" }, scale: { duration: 8, repeat: Infinity, ease: "easeInOut" } }}
            className="absolute inset-10 rounded-full bg-gradient-to-tr from-white/10 to-white/40 backdrop-blur-3xl border border-white/50 shadow-[0_8px_40px_rgba(0,0,0,0.05)] overflow-hidden"
          >
            {/* Inner dynamic highlights to make it look 3D and glassy */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-white/40 blur-2xl rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-orange-100/20 blur-3xl rounded-full" />
          </motion.div>

          {/* Floating geometric accent rings around the sphere */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
            className="absolute inset-4 rounded-full border border-slate-200/40 border-dashed opacity-50"
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border border-orange-200/30 opacity-40"
          />
          
        </div>
      </div>

    </div>
  );
}
