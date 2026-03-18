import { NavLink } from "react-router-dom";
import {
  BookOpen, Code, Cpu, Globe, Atom, TrendingUp,
  Target, History, Shield, Archive, PenTool, Newspaper,
  Home as HomeIcon, Video, Radio, Settings, HelpCircle
} from "lucide-react";

function Sidebar({ open, onClose, focusMode, activeCategory }) {
  if (!open) return null;

  const CATEGORIES = [
    { to: "/category/coding", icon: <Code size={18} />, label: "Coding" },
    { to: "/category/science", icon: <Atom size={18} />, label: "Science" },
    { to: "/category/tech-news", icon: <Newspaper size={18} />, label: "Tech News" },
    { to: "/category/design", icon: <PenTool size={18} />, label: "Design" },
    { to: "/category/ai-data", icon: <Cpu size={18} />, label: "Data & AI" },
    { to: "/category/news", icon: <Globe size={18} />, label: "Global News" },
    { to: "/category/trading", icon: <TrendingUp size={18} />, label: "Trading & Finance" },
  ];

  const visibleCategories = focusMode
    ? CATEGORIES.filter(c => c.to.includes(activeCategory?.toLowerCase().replace(/\s+/g, '-')))
    : CATEGORIES;

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[998] md:hidden" />
      <aside className={`fixed top-16 left-0 h-[calc(100vh-64px)] bg-surface border-r border-border transition-all duration-300 z-[999] overflow-y-auto scrollbar-hide ${open ? 'w-64' : 'w-0 md:w-20'}`}>
        
        <div className="py-6 flex flex-col gap-2">
          {focusMode && (
            <div className="mx-4 mb-6 p-3 bg-accent/10 border border-accent/20 rounded-2xl flex items-center gap-3">
              <Shield size={16} className="text-accent" />
              <span className="text-[10px] font-black uppercase tracking-widest text-accent">Locked Mode</span>
            </div>
          )}

          <NavSection title="Home" isOpen={open}>
            <NavItem to="/" icon={<HomeIcon size={18} />} label="Home" isOpen={open} onClick={onClose} />
            <NavItem to="/live" icon={<Radio size={18} />} label="Live" isOpen={open} onClick={onClose} />
            <NavItem to="/shorts" icon={<Video size={18} />} label="Shorts" isOpen={open} onClick={onClose} />
          </NavSection>

          <NavSection title="Learning" isOpen={open}>
            <NavItem to="/classroom" icon={<BookOpen size={18} />} label="Classroom" isOpen={open} onClick={onClose} />
            <NavItem to="/vault" icon={<Archive size={18} />} label="My Vault" isOpen={open} onClick={onClose} />
          </NavSection>

          <NavSection title="Categories" isOpen={open}>
            {visibleCategories.map((cat) => (
              <NavItem
                key={cat.to}
                to={cat.to}
                icon={cat.icon}
                label={cat.label}
                isOpen={open}
                onClick={onClose}
              />
            ))}
          </NavSection>

          <NavSection title="Personal" isOpen={open}>
            <NavItem to="/focus" icon={<Target size={18} />} label="Focus Mode" isOpen={open} onClick={onClose} />
            <NavItem to="/history" icon={<History size={18} />} label="History" isOpen={open} onClick={onClose} />
          </NavSection>

          <NavSection title="Support" isOpen={open}>
            <NavItem to="/feedback" icon={<HelpCircle size={18} />} label="FAQ" isOpen={open} onClick={onClose} />
          </NavSection>
        </div>
      </aside>
    </>
  );
}

const NavSection = ({ title, children, isOpen }) => (
  <div className="mb-6">
    {isOpen && <p className="px-6 mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted">{title}</p>}
    {children}
  </div>
);

const NavItem = ({ to, icon, label, isOpen, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) => `
      flex items-center gap-4 px-6 py-3 transition-all duration-200 group
      ${isActive 
        ? 'bg-accent/5 text-accent border-r-4 border-accent' 
        : 'text-muted hover:bg-base hover:text-primary'}
    `}
  >
    <div className={`shrink-0 transition-transform group-active:scale-90`}>{icon}</div>
    {isOpen && <span className="text-sm font-bold tracking-tight">{label}</span>}
  </NavLink>
);

export default Sidebar;
