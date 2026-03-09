import { useState } from "react";
import { Search, Settings, User, Menu, Pause, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginWithGoogle } from "../services/firebase";
import GoogleTranslate from "./GoogleTranslate";

function Header({ toggleSidebar, onSearch, timer }) {
  const [input, setInput] = useState("");
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch(input);
    navigate("/");
  };

  const handleProfileClick = async () => {
    if (currentUser) {
      navigate("/profile"); // 🎯 Goes to profile settings if logged in
    } else {
      try {
        await loginWithGoogle();
      } catch (error) {
        console.error("Login failed:", error);
      }
    }
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <header style={styles.header}>
      <div style={styles.leftSection}>
        <button onClick={toggleSidebar} style={styles.menuBtn}>
          <Menu size={24} />
        </button>

        {timer && timer.sessionStarted ? (
          <button
            onClick={() => timer.setIsActive(!timer.isActive)}
            style={{ ...styles.timerBtn, background: timer.isActive ? "rgba(255, 68, 68, 0.1)" : "#222" }}
            title={timer.isActive ? "Tap to Pause" : "Tap to Resume"}
          >
            {timer.isActive ? <Pause size={18} color="#ff4444" /> : <Play size={18} color="#4caf50" />}
            <span style={styles.timerText}>{formatTime(timer.timeLeft)}</span>
          </button>
        ) : (
          <div style={styles.logoContainer} onClick={() => { onSearch(""); navigate("/"); }}>
            <h2 style={styles.logo}>FOCUS<span style={styles.logoTube}>TUBE</span></h2>
          </div>
        )}
      </div>

      <form onSubmit={handleSearchSubmit} style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Powered by YouTube"
          style={styles.searchInput}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" style={styles.searchBtn}>
          <Search size={18} />
        </button>
      </form>

      <div style={styles.actions}>
        <GoogleTranslate />

        {/* ⚙️ Settings Icon (Always visible shortcut) */}
        <Settings
          size={22}
          style={styles.icon}
          onClick={() => navigate("/settings")}
          title="App Settings"
        />

        {/* 👤 Profile Link Section */}
        <div onClick={handleProfileClick} style={{ cursor: "pointer" }}>
          {currentUser ? (
            <img
              src={currentUser.photoURL}
              alt="Profile"
              style={styles.avatar}
              title={`Settings: ${currentUser.displayName}`}
            />
          ) : (
            <button style={styles.loginBtn}>
              <User size={18} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

const styles = {
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    justifyContent: "space-between",
    padding: "10px 24px",
    background: "var(--bg-primary)",
    borderBottom: "1px solid var(--border-color)",
    position: "sticky",
    top: 0,
    zIndex: 100,
    height: "64px"
  },
  leftSection: { display: "flex", alignItems: "center", gap: "15px" },
  menuBtn: { background: "none", color: "white", border: "none", cursor: "pointer" },
  timerBtn: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px 16px",
    border: "1px solid #333",
    borderRadius: "20px",
    cursor: "pointer",
    minWidth: "120px"
  },
  timerText: { fontSize: "16px", fontWeight: "bold", fontFamily: "monospace", color: "white" },
  logoContainer: { cursor: "pointer", minWidth: "150px" },
  logo: { color: "#ff0000", margin: 0, fontWeight: "900", letterSpacing: "-1px", fontSize: "22px" },
  logoTube: { color: "var(--text-primary)" },
  searchContainer: {
    flex: 0.5,
    display: "flex",
    background: "#121212",
    borderRadius: "24px",
    border: "1px solid #333",
    overflow: "hidden",
    height: "40px"
  },
  searchInput: {
    flex: 1,
    background: "transparent",
    border: "none",
    padding: "0 20px",
    color: "var(--text-primary)",
    outline: "none",
    fontSize: "14px"
  },
  searchBtn: {
    background: "#222",
    border: "none",
    color: "#aaa",
    padding: "0 20px",
    cursor: "pointer",
    transition: "color 0.2s"
  },
  actions: { display: "flex", alignItems: "center", gap: "22px" },
  icon: { cursor: "pointer", color: "#aaa", transition: "color 0.2s" },
  avatar: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    border: "2px solid #333",
    objectFit: "cover",
    transition: "border-color 0.2s"
  },
  loginBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "transparent",
    color: "#3ea6ff", // Standard YouTube blue for sign-in
    border: "1px solid #333",
    padding: "6px 14px",
    borderRadius: "20px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px"
  }
};

export default Header;