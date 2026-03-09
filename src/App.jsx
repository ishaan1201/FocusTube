import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { Coffee, Brain, X } from "lucide-react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import VideoPage from "./pages/VideoPage";
// Header import removed (duplicate)

import Vault from "./pages/Vault";
import SavedPage from "./pages/SavedPage";
import ShortsPage from "./pages/ShortsPage";
import Classroom from "./pages/Classroom";
import LivePage from "./pages/LivePage";
import LikedPage from "./pages/LikedPage";
import History from "./pages/History";
import NotePage from "./pages/NotesPage";
import Settings from "./pages/Settings";
import ChannelPage from "./pages/ChannelPage";
import PlaylistPage from "./pages/PlaylistPage";
import ShortsPlayer from "./pages/ShortsPlayer";
import FocusPage from "./pages/FocusPage";
import LivePlayer from "./pages/LivePlayer";
import CategoryPage from "./pages/CategoryPage";
import ProfileSettings from "./pages/ProfileSettings"; // ✅ New Route Import

function App() {
  const [theme, setTheme] = useState(localStorage.getItem("focus-theme") || "Dark");
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // 🛡️ NEW HYPER-FOCUS STATE
  const [focusMode, setFocusMode] = useState(false); // Locked into one category?
  const [activeCategory, setActiveCategory] = useState(null); // Which category is locked?

  // ⏱️ GLOBAL TIMER STATE
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showSessionDone, setShowSessionDone] = useState(false);

  useEffect(() => {
    if (Notification.permission !== "granted") Notification.requestPermission();
  }, []);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      setSessionStarted(false);
      setShowSessionDone(true);
      new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg").play();
      if (Notification.permission === "granted") {
        new Notification("FocusTube", { body: "⏰ Time's up! Great session." });
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  // ✅ THEME ENGINE: Strictly Night & Darker
  useEffect(() => {
    const root = document.documentElement;
    localStorage.setItem("focus-theme", theme);

    if (theme === "Night") {
      // 🌑 PURE BLACK
      root.style.setProperty('--bg-primary', '#000000');
      root.style.setProperty('--card-bg', '#0a0a0a');
      root.style.setProperty('--text-primary', '#ffffff');   // White text
      root.style.setProperty('--text-secondary', '#888888'); // Gray text
      root.style.setProperty('--border-color', '#1a1a1a');
    } else {
      // 🌚 DARKER (Charcoal)
      root.style.setProperty('--bg-primary', '#0f0f0f');
      root.style.setProperty('--card-bg', '#161616');
      root.style.setProperty('--text-primary', '#f1f1f1');   // Off-white text
      root.style.setProperty('--text-secondary', '#aaaaaa'); // Light gray text
      root.style.setProperty('--border-color', '#222222');
    }
  }, [theme]);

  return (
    <Router>
      <div style={{ color: "white", minHeight: "100vh", display: "flex", flexDirection: "column" }}>

        <Header
          toggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
          onSearch={(q) => setSearchQuery(q)}
          timer={{ timeLeft, isActive, sessionStarted, setIsActive }}
        />

        <div style={{ display: "flex", flex: 1 }}>
          {/* ✅ Pass Focus State to Sidebar */}
          <Sidebar
            open={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            focusMode={focusMode}
            activeCategory={activeCategory}
          />

          <main style={{ flex: 1 }}>
            <Routes>
              {/* Home is now just a general dashboard */}
              <Route path="/" element={<Home query={searchQuery} />} />

              {/* ✅ New Category Route */}
              <Route path="/category/:slug" element={
                <CategoryPage
                  focusMode={focusMode}
                  setFocusMode={setFocusMode}
                  activeCategory={activeCategory}
                  setActiveCategory={setActiveCategory}
                />
              } />

              <Route path="/video/:id" element={<VideoPage />} />
              <Route path="/channel/:id" element={<ChannelPage />} />
              <Route path="/vault" element={<Vault />} />
              <Route path="/history" element={<History />} />
              <Route path="/shorts/:id" element={<ShortsPlayer />} />
              <Route path="/notes" element={<NotePage />} />
              <Route path="/classroom" element={<Classroom />} />
              <Route path="/liked" element={<LikedPage />} />
              <Route path="/saved" element={<SavedPage />} />
              <Route path="/live" element={<LivePage />} />
              <Route path="/live/:id" element={<LivePlayer />} />
              <Route path="/playlist/:id" element={<PlaylistPage />} />
              <Route path="/shorts" element={<ShortsPage />} />

              <Route path="/focus" element={<FocusPage
                globalTime={timeLeft}
                setGlobalTime={setTimeLeft}
                globalActive={isActive}
                setGlobalActive={setIsActive}
                setSessionStarted={setSessionStarted}
              />} />

              <Route
                path="/settings"
                element={<Settings theme={theme} setTheme={setTheme} />}
              />
              <Route path="/profile" element={<ProfileSettings />} />
            </Routes>
          </main>
        </div>

        {/* SESSION DONE MODAL */}
        {showSessionDone && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <button onClick={() => setShowSessionDone(false)} style={styles.closeBtn}><X size={20} /></button>
              <h2 style={{ fontSize: "24px", marginBottom: "10px" }}>Session Complete! 🎉</h2>
              <p style={{ color: "#aaa", marginBottom: "20px" }}>Great work staying focused. What would you like to do next?</p>
              <div style={styles.modalActions}>
                <button onClick={() => { setTimeLeft(5 * 60); setIsActive(true); setSessionStarted(true); setShowSessionDone(false); }} style={styles.breakBtn}>
                  <Coffee size={18} /> Take a Break
                </button>
                <button onClick={() => { setTimeLeft(25 * 60); setIsActive(true); setSessionStarted(true); setShowSessionDone(false); }} style={styles.focusBtn}>
                  <Brain size={18} /> Start New Focus
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Router>
  );
}

const styles = {
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 },
  modal: { background: "#1a1a1a", padding: "30px", borderRadius: "20px", border: "1px solid #333", textAlign: "center", maxWidth: "400px", position: "relative" },
  closeBtn: { position: "absolute", top: "10px", right: "10px", background: "none", border: "none", color: "#666", cursor: "pointer" },
  modalActions: { display: "flex", gap: "10px", justifyContent: "center" },
  breakBtn: { background: "#4caf50", color: "white", border: "none", padding: "10px 20px", borderRadius: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold" },
  focusBtn: { background: "#ff4444", color: "white", border: "none", padding: "10px 20px", borderRadius: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold" }
};

export default App;