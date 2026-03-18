import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../services/supabase";
import { sendDiscordNotification } from "../services/notifications";
import { useAuth } from "../context/AuthContext";

export default function FeedbackForm({ onClose }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    rating: 5,
    pain_point: "",
    liked: "",
    suggestion: "",
    email: "",
  });

  const next = () => setStep((s) => s + 1);
  const prev = () => setStep((s) => s - 1);

  const submit = async () => {
    setLoading(true);

    const priority = form.rating <= 4 ? "high" : form.rating <= 7 ? "medium" : "low";
    const feedbackData = { 
      ...form, 
      priority,
      user_id: user?.id || null 
    };

    const { error } = await supabase.from("feedback").insert([feedbackData]);

    if (error) {
      console.error("Supabase Feedback Error:", error);
      alert(`Submission failed: ${error.message}`);
    } else {
      console.log("Feedback submitted successfully to Supabase");
      sendDiscordNotification(form);
    }

    setLoading(false);
    setStep(6);
  };

  const getMood = (rating) => {
    if (rating <= 3) return "😡";
    if (rating <= 5) return "😐";
    if (rating <= 8) return "🙂";
    return "😍";
  };

  const isBad = form.rating <= 5;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-[2.5rem] bg-[#0c0c0c]/90 border border-white/10 backdrop-blur-3xl shadow-[0_0_80px_-12px_rgba(0,0,0,0.8)] relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-purple-600/10 rounded-full blur-[100px]" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px]" />

        {/* Dynamic Progress Bar */}
        <div className="absolute top-0 left-0 h-1 bg-white/5 w-full">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-emerald-400"
            initial={{ width: "0%" }}
            animate={{ width: `${(step / 6) * 100}%` }}
            transition={{ type: "spring", stiffness: 60, damping: 20 }}
          />
        </div>

        <div className="p-10 md:p-12">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="1"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center"
              >
                <h2 className="text-3xl font-black mb-8 text-white tracking-tight">
                  How was your experience?
                </h2>

                <div className="flex flex-col items-center gap-10 mb-10">
                  <motion.span 
                    key={getMood(form.rating)}
                    initial={{ scale: 0.5, rotate: -20 }}
                    animate={{ scale: 1.2, rotate: 0 }}
                    className="text-8xl select-none"
                  >
                    {getMood(form.rating)}
                  </motion.span>

                  <div className="w-full space-y-4">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={form.rating}
                      onChange={(e) =>
                        setForm({ ...form, rating: Number(e.target.value) })
                      }
                      className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white transition-all hover:accent-purple-400"
                    />
                    <div className="flex justify-between px-2">
                      <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Poor</span>
                      <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Amazing</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={next}
                  className="w-full group relative overflow-hidden bg-white text-black py-5 rounded-[1.5rem] font-black text-lg transition-all active:scale-95 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                >
                  <span className="relative z-10">Continue</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                </button>
                <p className="text-[10px] text-purple-400 mt-6 font-black uppercase tracking-[0.2em] opacity-60">
                  Early user feedback = direct impact 🚀
                </p>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-2xl font-black mb-2 text-white tracking-tight">
                   {isBad ? "What went wrong?" : "What did you love the most?"}
                </h2>
                <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
                  {isBad ? "Be brutal. We want to fix it." : "We'll keep doing more of this."}
                </p>
                
                <motion.textarea
                  initial={{ scale: 0.98, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-full p-6 bg-white/5 border border-white/10 rounded-[2rem] focus:outline-none focus:border-purple-500/40 focus:bg-white/[0.08] transition-all min-h-[180px] text-white placeholder:text-zinc-600 text-lg shadow-inner"
                  placeholder={isBad ? "e.g. Navigation is confusing, player glitches..." : "e.g. AI summary is lightning fast, UI is clean..."}
                  value={form.pain_point}
                  onChange={(e) => setForm({ ...form, pain_point: e.target.value })}
                />

                <div className="flex items-center justify-between mt-10">
                  <button onClick={prev} className="text-zinc-500 hover:text-white font-black uppercase text-xs tracking-widest transition-colors">
                    Back
                  </button>
                  <div className="flex items-center gap-6">
                    <button onClick={next} className="text-zinc-500 hover:text-white text-xs font-black uppercase tracking-widest transition-colors">
                      Skip
                    </button>
                    <button
                      onClick={next}
                      className="bg-white text-black px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-2xl font-black mb-2 text-white tracking-tight">
                  {isBad ? "How can we improve?" : "Anything we can make better?"}
                </h2>
                <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
                  Every suggestion matters.
                </p>

                <motion.textarea
                  initial={{ scale: 0.98, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-full p-6 bg-white/5 border border-white/10 rounded-[2rem] focus:outline-none focus:border-purple-500/40 focus:bg-white/[0.08] transition-all min-h-[180px] text-white placeholder:text-zinc-600 text-lg shadow-inner"
                  placeholder="The one thing we should build next..."
                  value={form.suggestion}
                  onChange={(e) => setForm({ ...form, suggestion: e.target.value })}
                />

                <div className="flex items-center justify-between mt-10">
                  <button onClick={prev} className="text-zinc-500 hover:text-white font-black uppercase text-xs tracking-widest transition-colors">
                    Back
                  </button>
                  <div className="flex items-center gap-6">
                    <button onClick={next} className="text-zinc-500 hover:text-white text-xs font-black uppercase tracking-widest transition-colors">
                      Skip
                    </button>
                    <button
                      onClick={next}
                      className="bg-white text-black px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-2xl font-black mb-2 text-white tracking-tight">Want to stay in the loop?</h2>
                <p className="text-zinc-500 text-sm mb-8 leading-relaxed">Optional. We'll only contact you to follow up on this.</p>
                
                <motion.input
                  initial={{ scale: 0.98, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  type="email"
                  placeholder="you@example.com"
                  className="w-full p-6 bg-white/5 border border-white/10 rounded-[1.5rem] focus:outline-none focus:border-purple-500/40 focus:bg-white/[0.08] transition-all text-white placeholder:text-zinc-600 text-lg shadow-inner"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />

                <div className="flex items-center justify-between mt-10">
                  <button onClick={prev} className="text-zinc-500 hover:text-white font-black uppercase text-xs tracking-widest transition-colors">
                    Back
                  </button>
                  <button
                    onClick={submit}
                    disabled={loading}
                    className="group relative bg-purple-600 text-white px-12 py-4 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] hover:bg-purple-500 transition-all active:scale-95 shadow-2xl shadow-purple-600/30 disabled:opacity-50 overflow-hidden"
                  >
                    <span className="relative z-10">{loading ? "Sending..." : "Submit Feedback"}</span>
                    <div className="absolute inset-0 bg-white/10 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 6 && (
              <motion.div
                key="6"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-6"
              >
                <div className="w-24 h-24 bg-gradient-to-tr from-purple-500 to-emerald-400 rounded-full flex items-center justify-center mx-auto mb-10 shadow-[0_0_50px_rgba(139,92,246,0.3)]">
                  <motion.svg
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    width="48"
                    height="48"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="white"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3.5"
                      d="M5 13l4 4L19 7"
                    />
                  </motion.svg>
                </div>
                <h2 className="text-3xl font-black mb-4 text-white tracking-tight">💜 You're helping shape FocusTube</h2>
                <p className="text-zinc-400 text-lg leading-relaxed max-w-[320px] mx-auto">
                  We actually read every single piece of feedback. It makes us better.
                </p>
                <button
                  onClick={onClose || (() => window.location.reload())}
                  className="mt-12 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.3em] transition-all hover:scale-105 active:scale-95 shadow-xl shadow-black/40"
                >
                  Close Window
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
