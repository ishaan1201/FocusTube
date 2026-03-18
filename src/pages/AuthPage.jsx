import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Github, Chrome, ArrowRight, Loader2, ShieldCheck, Sparkles, UserCircle } from "lucide-react";

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, signUp, signIn, signInAnonymously } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
  });

  // If already logged in, go home
  useEffect(() => {
    if (user) navigate("/");
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
          data: { username: formData.username }
        });
        if (signUpError) throw signUpError;
        alert("Check your email for the confirmation link!");
      }
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
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.1),transparent_50%)]" />
        <motion.div 
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full" 
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 12, repeat: Infinity, delay: 1 }}
          className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" 
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-purple-600/20"
          >
            <ShieldCheck size={32} className="text-white" />
          </motion.div>
          <h1 className="text-3xl font-black text-white tracking-tighter">
            {isLogin ? "Welcome back" : "Create account"}
          </h1>
          <p className="text-zinc-500 mt-2">
            Join FocusTube and master your attention.
          </p>
        </div>

        <div className="bg-zinc-900/40 backdrop-blur-2xl border border-white/5 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500 opacity-50" />
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="relative"
                >
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                  <input
                    type="text"
                    required
                    placeholder="Username"
                    className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/5 rounded-2xl text-white focus:outline-none focus:border-purple-500/50 transition-all text-sm"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
              <input
                type="email"
                required
                placeholder="Email address"
                className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/5 rounded-2xl text-white focus:outline-none focus:border-purple-500/50 transition-all text-sm"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
              <input
                type="password"
                required
                placeholder="Password"
                className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/5 rounded-2xl text-white focus:outline-none focus:border-purple-500/50 transition-all text-sm"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 text-xs font-medium px-2"
              >
                {error}
              </motion.p>
            )}

            <button
              disabled={loading}
              className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all hover:bg-zinc-200 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (
                <>
                  {isLogin ? "Sign In" : "Sign Up"}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest"><span className="bg-zinc-950 px-4 text-zinc-600">Or continue with</span></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => handleOAuth('google')}
              className="flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all active:scale-95"
            >
              <Chrome size={18} />
              <span className="text-xs font-bold text-white">Google</span>
            </button>
            <button 
              onClick={async () => {
                setLoading(true);
                try {
                  const { error } = await signInAnonymously();
                  if (error) throw error;
                  navigate("/");
                } catch (err) {
                  setError(err.message);
                } finally {
                  setLoading(false);
                }
              }}
              className="flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all active:scale-95 text-purple-400 border-purple-500/20"
            >
              <UserCircle size={18} />
              <span className="text-xs font-bold">Guest Mode</span>
            </button>
          </div>
        </div>

        <button
          onClick={() => setIsLogin(!isLogin)}
          className="w-full mt-6 text-zinc-500 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 group"
        >
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <span className="text-purple-400 group-hover:underline">{isLogin ? "Sign up now" : "Log in here"}</span>
        </button>

        <p className="mt-12 text-center text-zinc-600 text-[10px] font-medium leading-relaxed max-w-[280px] mx-auto">
          By continuing, you agree to FocusTube's <span className="text-zinc-500 hover:underline cursor-pointer">Terms of Service</span> and <span className="text-zinc-500 hover:underline cursor-pointer">Privacy Policy</span>.
        </p>
      </motion.div>
    </div>
  );
}
