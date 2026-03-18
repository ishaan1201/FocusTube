import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../services/supabase";
import { sendDiscordNotification } from "../services/notifications";

export default function FeedbackForm({ onClose }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    rating: 0,
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
    const feedbackData = { ...form, priority };

    const { error } = await supabase.from("feedback").insert([feedbackData]);

    if (!error) {
      sendDiscordNotification(form);
    }

    setLoading(false);
    setStep(6);
  };

  const getRatingEmoji = (rating) => {
    if (rating <= 2) return "😞";
    if (rating <= 4) return "😐";
    if (rating <= 6) return "😊";
    if (rating <= 8) return "🤩";
    return "🔥";
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-[2rem] bg-[#0c0c0c]/80 border border-white/10 backdrop-blur-2xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-600/10 rounded-full blur-[80px]" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-600/10 rounded-full blur-[80px]" />

        {/* Progress Bar */}
        <div className="absolute top-0 left-0 h-[3px] bg-white/5 w-full">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400"
            initial={{ width: "0%" }}
            animate={{ width: `${(step / 6) * 100}%` }}
            transition={{ type: "spring", stiffness: 50, damping: 20 }}
          />
        </div>

        <div className="p-8 md:p-10">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center"
              >
                <span className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-6">
                  Step 1 of 5
                </span>
                <h2 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight text-white">
                  How's your experience?
                </h2>
                <p className="text-zinc-500 mb-10 text-lg">Your feedback drives FocusTube's evolution.</p>

                <div className="flex flex-col items-center gap-8 mb-10">
                  <div className="text-6xl md:text-7xl transition-all duration-500 transform scale-110">
                    {form.rating > 0 ? getRatingEmoji(form.rating) : "✨"}
                  </div>

                  <div className="grid grid-cols-5 md:grid-cols-10 gap-2 w-full">
                    {[...Array(10)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setForm({ ...form, rating: i + 1 })}
                        className={`aspect-square rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center border ${
                          form.rating === i + 1
                            ? "bg-white text-black border-white scale-110 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                            : "bg-white/5 text-zinc-400 border-white/5 hover:border-white/20 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={next}
                  disabled={form.rating === 0}
                  className="w-full group relative overflow-hidden bg-white text-black py-5 rounded-2xl font-bold text-lg transition-all active:scale-[0.98] disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10">Continue</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <span className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-6">
                  Step 2 of 5
                </span>
                <h2 className="text-2xl font-bold mb-2 text-white">What frustrated you?</h2>
                <p className="text-zinc-500 text-sm mb-6">Be brutal. We want to improve.</p>
                <textarea
                  className="w-full p-5 bg-white/5 border border-white/10 rounded-[1.5rem] focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all min-h-[160px] text-white placeholder:text-zinc-600"
                  placeholder="e.g. Navigation is slow, video player glitches..."
                  value={form.pain_point}
                  onChange={(e) => setForm({ ...form, pain_point: e.target.value })}
                />
                <div className="flex items-center justify-between mt-10">
                  <button onClick={prev} className="text-zinc-500 hover:text-white font-bold transition-colors">
                    Back
                  </button>
                  <div className="flex items-center gap-6">
                    <button onClick={next} className="text-zinc-500 hover:text-white text-sm font-bold transition-colors">
                      Skip
                    </button>
                    <button
                      onClick={next}
                      className="bg-white text-black px-10 py-4 rounded-2xl font-bold hover:bg-zinc-200 transition-all active:scale-95 shadow-xl shadow-white/5"
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <span className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-6">
                  Step 3 of 5
                </span>
                <h2 className="text-2xl font-bold mb-2 text-white">What did you like?</h2>
                <p className="text-zinc-500 text-sm mb-6">What should we keep doing?</p>
                <textarea
                  className="w-full p-5 bg-white/5 border border-white/10 rounded-[1.5rem] focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all min-h-[160px] text-white placeholder:text-zinc-600"
                  placeholder="e.g. The AI summary is amazing, clean UI..."
                  value={form.liked}
                  onChange={(e) => setForm({ ...form, liked: e.target.value })}
                />
                <div className="flex items-center justify-between mt-10">
                  <button onClick={prev} className="text-zinc-500 hover:text-white font-bold transition-colors">
                    Back
                  </button>
                  <div className="flex items-center gap-6">
                    <button onClick={next} className="text-zinc-500 hover:text-white text-sm font-bold transition-colors">
                      Skip
                    </button>
                    <button
                      onClick={next}
                      className="bg-white text-black px-10 py-4 rounded-2xl font-bold hover:bg-zinc-200 transition-all active:scale-95 shadow-xl shadow-white/5"
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <span className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-6">
                  Step 4 of 5
                </span>
                <h2 className="text-2xl font-bold mb-2 text-white">Any suggestions?</h2>
                <p className="text-zinc-500 text-sm mb-6">What's the one feature you wish we had?</p>
                <textarea
                  className="w-full p-5 bg-white/5 border border-white/10 rounded-[1.5rem] focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all min-h-[160px] text-white placeholder:text-zinc-600"
                  placeholder="e.g. Add a dark mode, browser extension..."
                  value={form.suggestion}
                  onChange={(e) => setForm({ ...form, suggestion: e.target.value })}
                />
                <div className="flex items-center justify-between mt-10">
                  <button onClick={prev} className="text-zinc-500 hover:text-white font-bold transition-colors">
                    Back
                  </button>
                  <div className="flex items-center gap-6">
                    <button onClick={next} className="text-zinc-500 hover:text-white text-sm font-bold transition-colors">
                      Skip
                    </button>
                    <button
                      onClick={next}
                      className="bg-white text-black px-10 py-4 rounded-2xl font-bold hover:bg-zinc-200 transition-all active:scale-95 shadow-xl shadow-white/5"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div
                key="5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <span className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-6">
                  Step 5 of 5
                </span>
                <h2 className="text-2xl font-bold mb-2 text-white">Leave your email</h2>
                <p className="text-zinc-500 text-sm mb-6">Optional. We'll only contact you to follow up on this.</p>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full p-5 bg-white/5 border border-white/10 rounded-[1.2rem] focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all text-white placeholder:text-zinc-600"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <div className="flex items-center justify-between mt-10">
                  <button onClick={prev} className="text-zinc-500 hover:text-white font-bold transition-colors">
                    Back
                  </button>
                  <button
                    onClick={submit}
                    disabled={loading}
                    className="group relative bg-purple-600 text-white px-12 py-4 rounded-2xl font-bold hover:bg-purple-500 transition-all active:scale-95 shadow-2xl shadow-purple-600/30 disabled:opacity-50"
                  >
                    <span className="relative z-10">{loading ? "Sending..." : "Submit Feedback"}</span>
                    <div className="absolute inset-0 bg-white/10 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 rounded-2xl" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 6 && (
              <motion.div
                key="6"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-10"
              >
                <div className="w-24 h-24 bg-gradient-to-tr from-green-500 to-emerald-400 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                  <svg
                    width="48"
                    height="48"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="white"
                    className="drop-shadow-lg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3.5"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-4xl font-black mb-3 text-white tracking-tight">🎉 Thank you!</h2>
                <p className="text-zinc-400 text-lg leading-relaxed max-w-[280px] mx-auto">
                  Your feedback helps us build the future of FocusTube.
                </p>
                <button
                  onClick={onClose || (() => window.location.reload())}
                  className="mt-12 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95"
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
