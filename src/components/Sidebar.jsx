import { NavLink } from "react-router-dom";
import {
  BookOpen, Code, Cpu, Globe, Atom, TrendingUp,
  Target, History, Shield, Archive, PenTool, Newspaper,
  Home as HomeIcon, Video, Radio, Settings
} from "lucide-react";

function Sidebar({ open, onClose, focusMode, activeCategory }) {
  if (!open) return null;

  // 📂 Categories Data
  const CATEGORIES = [
    { to: "/category/coding", icon: <Code size={18} />, label: "Coding" },
    { to: "/category/science", icon: <Atom size={18} />, label: "Science" },
    { to: "/category/tech-news", icon: <Newspaper size={18} />, label: "Tech News" },
    { to: "/category/design", icon: <PenTool size={18} />, label: "Design" },
    { to: "/category/ai-data", icon: <Cpu size={18} />, label: "Data & AI" },
    { to: "/category/news", icon: <Globe size={18} />, label: "Global News" },
    { to: "/category/trading", icon: <TrendingUp size={18} />, label: "Trading & Finance" },
  ];

  // 🛡️ FILTER LOGIC: If Focus Mode is ON, only show the locked category
  const visibleCategories = focusMode
    ? CATEGORIES.filter(c => c.label === activeCategory)
    : CATEGORIES;

  return (
    <>
      <div onClick={onClose} style={styles.overlay} />
      <aside style={styles.sidebar}>

        {/* 🛡️ LOCKED BADGE (Only shows in Focus Mode) */}
        {focusMode && (
          <div style={styles.focusBadge}>
            <Shield size={14} fill="currentColor" />
            <span>LOCKED: {activeCategory?.toUpperCase()}</span>
          </div>
        )}

        <div style={styles.scrollArea}>

          {/* ✅ UPDATED: Home Section with Home Page link */}
          <NavSection title="Home">
            <NavItem to="/" icon={<HomeIcon size={18} />} label="Home" onClick={onClose} />
            <NavItem to="/live" icon={<Radio size={18} />} label="Live" onClick={onClose} />
            <NavItem to="/shorts" icon={<Video size={18} />} label="Shorts" onClick={onClose} />
          </NavSection>

          {/* Learning Section */}
          <NavSection title="Learning">
            <NavItem to="/classroom" icon={<BookOpen size={18} />} label="Classroom" onClick={onClose} />
          </NavSection>

          {/* Vault Section */}
          <NavSection title="Vault">
            <NavItem to="/vault" icon={<Archive size={18} />} label="My Vault" onClick={onClose} />
          </NavSection>

          {/* Categories Section */}
          <NavSection title="Categories">
            {visibleCategories.map((cat) => (
              <NavItem
                key={cat.to}
                to={cat.to}
                icon={cat.icon}
                label={cat.label}
                onClick={onClose}
              />
            ))}
          </NavSection>

          {/* Focus Section */}
          <NavSection title="Focus">
            <NavItem to="/focus" icon={<Target size={18} />} label="Focus Mode" onClick={onClose} />
            <NavItem to="/history" icon={<History size={18} />} label="History" onClick={onClose} />
          </NavSection>

        </div>
      </aside>
    </>
  );
}

// --- HELPER COMPONENTS ---

const NavSection = ({ title, children }) => (
  <div style={{ marginBottom: "24px" }}>
    <p style={styles.sectionTitle}>{title}</p>
    {children}
  </div>
);

const NavItem = ({ to, icon, label, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    style={({ isActive }) => ({
      ...styles.navItem,
      background: isActive ? "rgba(255, 68, 68, 0.08)" : "transparent",
      color: isActive ? "#ff4444" : "var(--text-primary)",
      borderRight: isActive ? "3px solid #ff4444" : "3px solid transparent",
      fontWeight: isActive ? "600" : "400"
    })}
  >
    <span style={{ marginRight: "14px", opacity: 0.9 }}>{icon}</span>
    {label}
  </NavLink>
);

// --- STYLES ---

const styles = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 998 },
  sidebar: {
    position: "fixed", top: "60px", left: 0, width: "260px", height: "calc(100vh - 60px)",
    background: "var(--card-bg)", borderRight: "1px solid var(--border-color)", zIndex: 999, padding: "24px 0"
  },
  scrollArea: { height: "100%", overflowY: "auto", paddingRight: "5px" },
  sectionTitle: {
    fontSize: "11px", color: "var(--text-secondary)", fontWeight: "700", padding: "0 24px 8px",
    textTransform: "uppercase", letterSpacing: "1.2px"
  },
  navItem: {
    display: "flex", alignItems: "center", padding: "12px 24px",
    textDecoration: "none", fontSize: "14px", transition: "all 0.2s ease"
  },
  focusBadge: {
    margin: "0 20px 20px",
    background: "linear-gradient(45deg, #ff4444, #cc0000)",
    color: "white",
    padding: "10px 14px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "0.5px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    boxShadow: "0 4px 12px rgba(255, 68, 68, 0.3)"
  }
};

export default Sidebar;