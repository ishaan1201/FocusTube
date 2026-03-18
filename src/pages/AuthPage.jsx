import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Loader2, Sparkles, LogIn } from "lucide-react";

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
      // 🚀 'azure' is the exact provider code Supabase uses for Microsoft
      const { error } = await supabase.auth.signInWithOAuth({ provider });
      if (error) throw error;
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* 🌟 VIBRANT ANIMATED BACKGROUND */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.8),transparent_100%)] z-10" />
        
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, -50, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-400/30 blur-[120px] rounded-full mix-blend-multiply" 
        />
        <motion.div 
          animate={{ x: [0, -50, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-400/30 blur-[120px] rounded-full mix-blend-multiply" 
        />
        <motion.div 
          animate={{ x: [0, 30, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[20%] right-[20%] w-[40%] h-[40%] bg-orange-300/30 blur-[120px] rounded-full mix-blend-multiply" 
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
        className="w-full max-w-md z-20"
      >
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", bounce: 0.5, duration: 0.8, delay: 0.2 }}
            className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/20"
          >
            {isLogin ? <LogIn size={28} className="text-white" /> : <Sparkles size={28} className="text-white" />}
          </motion.div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
            {isLogin ? "Welcome Back" : "Start Learning"}
          </h1>
          <p className="text-slate-500 font-medium">
            {isLogin ? "Sign in to access your FocusTube vault." : "Create your free account to secure your notes."}
          </p>
        </div>

        {/* 🚀 PREMIUM WHITE GLASS CARD */}
        <div className="bg-white/70 backdrop-blur-2xl border border-white p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] relative overflow-hidden">
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: "auto", scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  className="relative"
                >
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    className="w-full pl-12 pr-5 py-4 bg-slate-100/50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium placeholder:text-slate-400"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                required
                placeholder="Email Address"
                className="w-full pl-12 pr-5 py-4 bg-slate-100/50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium placeholder:text-slate-400"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                required
                placeholder="Password"
                className="w-full pl-12 pr-5 py-4 bg-slate-100/50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium placeholder:text-slate-400"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-xs font-bold px-2 text-center bg-red-50 p-3 rounded-xl border border-red-100">
                {error}
              </motion.p>
            )}

            <button
              disabled={loading}
              className="w-full py-4 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (
                <>
                  {isLogin ? "Sign In Securely" : "Create Account"}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest"><span className="bg-white/80 px-4 text-slate-400">Or continue with</span></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => handleOAuth('google')} className="flex items-center justify-center gap-3 py-3.5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-[0.98]">
              <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="text-sm font-bold text-slate-700">Google</span>
            </button>
            <button onClick={() => handleOAuth('azure')} className="flex items-center justify-center gap-3 py-3.5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-[0.98]">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 21 21">
                <rect x="1" y="1" width="9" height="9" fill="#f25022"/><rect x="11" y="1" width="9" height="9" fill="#7fba00"/><rect x="1" y="11" width="9" height="9" fill="#00a4ef"/><rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
              </svg>
              <span className="text-sm font-bold text-slate-700">Microsoft</span>
            </button>
          </div>
        </div>

        <button
          onClick={() => setIsLogin(!isLogin)}
          className="w-full mt-8 text-slate-500 hover:text-slate-800 text-sm font-bold transition-all flex items-center justify-center gap-2 group"
        >
          {isLogin ? "New to FocusTube?" : "Already have an account?"}
          <span className="text-blue-600 group-hover:underline">{isLogin ? "Create an account" : "Log in here"}</span>
        </button>
      </motion.div>
    </div>
  );
}