import { useState } from "react";
import { Moon, Globe, Shield, Trash2 } from "lucide-react";
import GoogleTranslate from "../components/GoogleTranslate";

function SettingsPage({ theme, setTheme }) {
  // ✅ Logic: Toggle is "ON" if theme is Night
  const isNightMode = theme === "Night";

  const [saveStatus, setSaveStatus] = useState("");

  const toggleTheme = () => {
    const nextTheme = isNightMode ? "Darker" : "Night";
    setTheme(nextTheme);
  };

  const handleApply = () => {
    setSaveStatus("Settings Applied! ✅");
    setTimeout(() => setSaveStatus(""), 2000);
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>App Settings</h1>
        <p style={{ color: "#888" }}>Optimize your Curio environment</p>
      </header>

      {/* --- APPEARANCE SECTION --- */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <Moon size={20} color={isNightMode ? "#ff9800" : "#888"} />
          <h2 style={styles.sectionTitle}>Appearance</h2>
        </div>

        <div style={styles.settingRow}>
          <div>
            <p style={styles.label}>Night Mode (OLED)</p>
            <p style={styles.desc}>Switch between Darker and Pure Black backgrounds</p>
          </div>

          {/* ✅ NEW: Toggle Switch for Darker vs Night */}
          <button
            onClick={toggleTheme}
            style={{
              ...styles.toggle,
              background: isNightMode ? "#ff4444" : "#444"
            }}
          >
            <div style={{
              ...styles.toggleDot,
              transform: isNightMode ? "translateX(20px)" : "translateX(0)"
            }} />
          </button>
        </div>
      </section>

      {/* --- LANGUAGE SECTION --- */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <Globe size={20} color="#2196f3" />
          <h2 style={styles.sectionTitle}>Translate App</h2>
        </div>

        <div style={styles.settingRow}>
          <div>
            <p style={styles.label}>System Language</p>
            <p style={styles.desc}>Powered by Google Translate</p>
          </div>
          <GoogleTranslate />
        </div>
      </section>

      {/* --- PRIVACY SECTION --- */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <Shield size={20} color="#4caf50" />
          <h2 style={styles.sectionTitle}>Privacy</h2>
        </div>

        <div style={styles.settingRow}>
          <div>
            <p style={styles.label}>History Management</p>
            <p style={styles.desc}>Wipe your locally saved watch history</p>
          </div>
          <button
            onClick={() => { if (window.confirm("Clear all?")) localStorage.removeItem("focus_history"); }}
            style={styles.dangerBtn}
          >
            <Trash2 size={16} /> Clear
          </button>
        </div>
      </section>

      <footer style={styles.footer}>
        <span style={{ color: "#4caf50", fontWeight: "700" }}>{saveStatus}</span>
        <button onClick={handleApply} style={styles.saveBtn}>Apply Changes</button>
      </footer>
    </div>
  );
}

const styles = {
  container: { padding: "40px 20px", maxWidth: "800px", margin: "0 auto" },
  header: { marginBottom: "40px" },
  title: { fontSize: "32px", fontWeight: "800", margin: "0 0 8px", color: "var(--text-primary)" },
  section: {
    background: "rgba(128, 128, 128, 0.05)",
    padding: "24px",
    borderRadius: "20px",
    marginBottom: "20px",
    border: "1px solid var(--border-color)"
  },
  sectionHeader: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" },
  sectionTitle: { fontSize: "18px", fontWeight: "700", margin: 0, color: "var(--text-primary)" },
  settingRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: "16px", fontWeight: "600", margin: "0 0 4px", color: "var(--text-primary)" },
  desc: { fontSize: "13px", color: "var(--text-secondary)", margin: 0 },

  // ✅ TOGGLE STYLES
  toggle: {
    width: "44px",
    height: "24px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    padding: "2px",
    transition: "0.3s ease",
    display: "flex",
    alignItems: "center"
  },
  toggleDot: {
    width: "20px",
    height: "20px",
    background: "white",
    borderRadius: "50%",
    transition: "0.3s ease",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
  },

  dangerBtn: { background: "transparent", color: "#ff4444", border: "1px solid #ff4444", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold" },
  footer: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "30px" },
  saveBtn: { background: "#ff4444", color: "white", border: "none", padding: "12px 30px", borderRadius: "12px", fontWeight: "800", cursor: "pointer" }
};

export default SettingsPage;