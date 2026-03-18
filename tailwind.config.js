/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 🚀 These now dynamically read from your active theme variables!
        base: "rgb(var(--bg-base) / <alpha-value>)",
        surface: "rgb(var(--bg-surface) / <alpha-value>)",
        primary: "rgb(var(--text-primary) / <alpha-value>)",
        muted: "rgb(var(--text-muted) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        border: "rgb(var(--border-subtle) / <alpha-value>)",
        
        // Legacy fallbacks (Hiding these gradually as we refactor)
        background: "rgb(var(--bg-base) / <alpha-value>)",
        foreground: "rgb(var(--text-primary) / <alpha-value>)",
        card: "rgb(var(--bg-surface) / <alpha-value>)",
      },
      borderRadius: {
        lg: "var(--radius)",
      },
    },
  },
  plugins: [],
}
