import { motion } from "framer-motion";

export default function GlassCard({ children, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 shadow-lg ${className}`}
    >
      {children}
    </motion.div>
  );
}
