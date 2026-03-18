import { useState } from "react";
import { Search, Settings, User, Menu, Pause, Play, Sparkles, VolumeX, Mic, MicOff, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GoogleTranslate from "./GoogleTranslate";
import GlobalAIChat from "./GlobalAIChat";

function Header({ toggleSidebar, onSearch, timer, bgVideoId, setBgVideoId }) {
  const [input, setInput] = useState("");
  const [showAIChat, setShowAIChat] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const handleSearchSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    onSearch(input);
    navigate("/");
  };

  const startVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Your browser doesn't support voice recognition. Try Chrome!");
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      onSearch(transcript);
      navigate("/");
    };
    recognition.start();
  };

  const handleProfileClick = async () => {
    if (user) {
      navigate("/profile");
    } else {
      navigate("/auth");
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
            <h2 style={styles.logo}>Curio</h2>
            <span style={styles.poweredBy}>Powered by YouTube</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSearchSubmit} style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search videos..."
          style={styles.searchInput}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="button" onClick={startVoiceSearch} style={{ ...styles.iconBtnBase, color: isListening ? "#ff4444" : "#888", marginRight: "10px" }}>
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
        <button type="submit" style={styles.searchBtn}>
          <Search size={18} />
        </button>
      </form>

      <div style={styles.actions}>
        {bgVideoId && (
          <button 
            onClick={() => setBgVideoId(null)} 
            style={styles.musicBtn} 
            title="Stop Ambient Music"
          >
            <VolumeX size={18} color="#ff4444" />
          </button>
        )}

        <button 
          onClick={() => setShowAIChat(!showAIChat)} 
          style={{ ...styles.aiToggle, background: showAIChat ? "linear-gradient(135deg, #4285f4, #9b72cb)" : "rgba(255,255,255,0.05)" }}
          title="Ask FocusAI"
        >
          <Sparkles size={20} color={showAIChat ? "#fff" : "#aaa"} />
        </button>

        {showAIChat && <GlobalAIChat onClose={() => setShowAIChat(false)} />}

        <GoogleTranslate />

        <Settings
          size={22}
          style={styles.icon}
          onClick={() => navigate("/settings")}
          title="App Settings"
        />

        <div onClick={handleProfileClick} style={{ cursor: "pointer" }}>
          {user ? (
            user.is_anonymous ? (
              <button style={{ ...styles.loginBtn, color: "#9c27b0", borderColor: "rgba(156, 39, 176, 0.3)" }}>
                <UserCircle size={18} />
                <span>Guest Mode</span>
              </button>
            ) : (
              <img
                src={profile?.avatar_url || user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name || user.email}`}
                alt="Profile"
                style={styles.avatar}
                title={`Settings: ${profile?.full_name || user.email}`}
              />
            )
          ) : localStorage.getItem("local_guest_mode") === "true" ? (
             <button style={{ ...styles.loginBtn, color: "#9c27b0", borderColor: "rgba(156, 39, 176, 0.3)" }}>
                <UserCircle size={18} />
                <span>Guest Mode</span>
              </button>
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
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 24px", background: "var(--bg-primary)", borderBottom: "1px solid var(--border-color)", position: "sticky", top: 0, zIndex: 100, height: "64px" },
  leftSection: { display: "flex", alignItems: "center", gap: "15px" },
  menuBtn: { background: "none", color: "white", border: "none", cursor: "pointer" },
  timerBtn: { display: "flex", alignItems: "center", gap: "10px", padding: "8px 16px", border: "1px solid #333", borderRadius: "20px", cursor: "pointer", minWidth: "120px" },
  timerText: { fontSize: "16px", fontWeight: "bold", fontFamily: "monospace", color: "white" },
  logoContainer: { cursor: "pointer", minWidth: "150px", display: "flex", flexDirection: "column", justifyContent: "center" },
  logo: { color: "#4F46E5", margin: 0, fontWeight: "800", letterSpacing: "-0.5px", fontSize: "22px", lineHeight: "1", fontFamily: "'Syne', 'Inter', sans-serif" },
  poweredBy: { fontSize: "9px", color: "#888", letterSpacing: "0.5px", marginTop: "2px", textTransform: "uppercase", fontWeight: "600" },
  searchContainer: { flex: 0.5, display: "flex", background: "#121212", borderRadius: "24px", border: "1px solid #333", overflow: "hidden", height: "40px", alignItems: "center" },
  searchInput: { flex: 1, background: "transparent", border: "none", padding: "0 20px", color: "var(--text-primary)", outline: "none", fontSize: "14px" },
  searchBtn: { background: "#222", border: "none", color: "#aaa", padding: "0 20px", height: "100%", cursor: "pointer", transition: "color 0.2s" },
  iconBtnBase: { background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 0 },
  actions: { display: "flex", alignItems: "center", gap: "22px" },
  icon: { cursor: "pointer", color: "#aaa", transition: "color 0.2s" },
  musicBtn: { background: "rgba(255, 68, 68, 0.1)", border: "1px solid rgba(255, 68, 68, 0.3)", borderRadius: "50%", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "0.2s" },
  aiToggle: { width: "40px", height: "40px", borderRadius: "50%", border: "1px solid #333", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "0.3s all ease", padding: 0 },
  avatar: { width: "34px", height: "34px", borderRadius: "50%", border: "2px solid #333", objectFit: "cover", transition: "border-color 0.2s" },
  loginBtn: { display: "flex", alignItems: "center", gap: "8px", background: "transparent", color: "#3ea6ff", border: "1px solid #333", padding: "6px 14px", borderRadius: "20px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }
};

export default Header;
