import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState(localStorage.getItem("focus_theme") || "light");

  useEffect(() => {
    // This flips the switch on the entire HTML document
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("focus_theme", theme);
  }, [theme]);

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("glass");
    else setTheme("light");
  };

  return (
    <button 
      onClick={cycleTheme}
      className="p-2 rounded-xl bg-surface border border-border hover:bg-base transition-all text-primary flex items-center gap-2"
      title="Toggle Theme"
    >
      {theme === "light" && <Sun size={18} />}
      {theme === "dark" && <Moon size={18} />}
      {theme === "glass" && <Monitor size={18} />}
      <span className="text-xs font-bold uppercase tracking-widest hidden sm:block">
        {theme}
      </span>
    </button>
  );
}
