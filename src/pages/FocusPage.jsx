import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, CheckCircle, Plus, Volume2, Coffee, Brain, Edit3, Save } from "lucide-react";

// 🎵 Ambience Presets (Updated Playlist)
const AMBIENCE_TRACKS = [
  { id: "5yx6BWlEVcY", name: "Chillhop 🦝" },      // Existing
  { id: "jfKfPfyJRdk", name: "Lofi Girl ☕" },       // ✅ Replaced Rain with Lofi Girl
  { id: "M5QY2_8704o", name: "White Noise 💨" },    // Existing
  { id: "Rb0UmrCXxVA", name: "Mozart Classical 🎻" }, // ✅ Fixed Broken Link
  { id: "TURbeWK2wwg", name: "Forest Nature 🌲" }   // Existing
];

function FocusPage({ globalTime, setGlobalTime, globalActive, setGlobalActive, setSessionStarted }) {
  
  const [mode, setMode] = useState("focus"); 

  // Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editH, setEditH] = useState(0);
  const [editM, setEditM] = useState(25);
  const [editS, setEditS] = useState(0);

  const [bgVideoId, setBgVideoId] = useState(null); 
  const [tasks, setTasks] = useState([]);
  const [taskInput, setTaskInput] = useState("");

  // 🔄 Timer Controls
  const toggleTimer = () => {
    const newState = !globalActive;
    setGlobalActive(newState);
    if (newState) setSessionStarted(true); 
  };

  const resetTimer = () => {
    setGlobalActive(false);
    setSessionStarted(false); 
    if (mode === "custom") {
       setGlobalTime((editH * 3600) + (editM * 60) + editS);
    } else {
       setGlobalTime(mode === "focus" ? 25 * 60 : mode === "short" ? 5 * 60 : 15 * 60);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setGlobalActive(false);
    setSessionStarted(false);
    setIsEditing(false);
    setGlobalTime(newMode === "focus" ? 25 * 60 : newMode === "short" ? 5 * 60 : 15 * 60);
  };

  const startEditing = () => {
    setGlobalActive(false); 
    const h = Math.floor(globalTime / 3600);
    const m = Math.floor((globalTime % 3600) / 60);
    const s = globalTime % 60;
    setEditH(h); setEditM(m); setEditS(s);
    setIsEditing(true);
  };

  const saveTime = (e) => {
    e.preventDefault();
    const totalSeconds = (editH * 3600) + (editM * 60) + editS;
    if (totalSeconds > 0) {
      setGlobalTime(totalSeconds);
      setMode("custom"); 
      setIsEditing(false);
    }
  };

  const addTask = (e) => {
    e.preventDefault();
    if (!taskInput.trim()) return;
    setTasks([...tasks, { id: Date.now(), text: taskInput, completed: false }]);
    setTaskInput("");
  };
  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div style={styles.container}>
      {/* LEFT PANEL */}
      <div style={styles.leftPanel}>
        <div style={styles.timerCard}>
          <div style={styles.modeTabs}>
            <button style={{...styles.tab, background: mode === "focus" ? "#ff4444" : "transparent"}} onClick={() => switchMode("focus")}>Focus</button>
            <button style={{...styles.tab, background: mode === "short" ? "#4caf50" : "transparent"}} onClick={() => switchMode("short")}>Short</button>
            <button style={{...styles.tab, background: mode === "long" ? "#2196f3" : "transparent"}} onClick={() => switchMode("long")}>Long</button>
          </div>

          <div style={styles.displayContainer}>
            {isEditing ? (
              <form onSubmit={saveTime} style={styles.editForm}>
                <div style={styles.inputWrapper}>
                  <input type="number" min="0" value={editH} onChange={(e) => setEditH(Number(e.target.value))} style={styles.timeInput} />
                  <span style={styles.label}>hr</span>
                </div>
                <span style={styles.colon}>:</span>
                <div style={styles.inputWrapper}>
                  <input type="number" min="0" max="59" value={editM} onChange={(e) => setEditM(Number(e.target.value))} style={styles.timeInput} />
                  <span style={styles.label}>min</span>
                </div>
                <span style={styles.colon}>:</span>
                <div style={styles.inputWrapper}>
                  <input type="number" min="0" max="59" value={editS} onChange={(e) => setEditS(Number(e.target.value))} style={styles.timeInput} />
                  <span style={styles.label}>sec</span>
                </div>
                <button type="submit" style={styles.saveBtn}><Save size={20} /></button>
              </form>
            ) : (
              <div style={styles.timeWrapper}>
                <h1 style={styles.timeDisplay}>{formatTime(globalTime)}</h1>
                <button onClick={startEditing} style={styles.editBtn}><Edit3 size={18} /></button>
              </div>
            )}
          </div>

          <div style={styles.controls}>
            <button onClick={toggleTimer} style={styles.mainBtn}>
              {globalActive ? <Pause size={32} /> : <Play size={32} />}
            </button>
            <button onClick={resetTimer} style={styles.iconBtn}><RotateCcw size={24} /></button>
          </div>
        </div>

        {/* AUDIO SECTION */}
        <div style={styles.audioCard}>
          <div style={styles.cardHeader}>
            <Volume2 size={24} color="#ff4444" /> 
            <h3 style={{fontSize: "18px"}}>Ambient Sound</h3>
          </div>
          <div style={styles.trackList}>
            <button style={{...styles.trackBtn, borderColor: !bgVideoId ? "#ff4444" : "#333"}} onClick={() => setBgVideoId(null)}>Silence 🔇</button>
            {AMBIENCE_TRACKS.map(track => (
              <button key={track.id} style={{...styles.trackBtn, borderColor: bgVideoId === track.id ? "#ff4444" : "#333", background: bgVideoId === track.id ? "#222" : "transparent"}} onClick={() => setBgVideoId(track.id)}>
                {track.name}
              </button>
            ))}
          </div>
          {bgVideoId && (
            <div style={styles.hiddenPlayer}>
              <iframe width="1" height="1" src={`https://www.youtube.com/embed/${bgVideoId}?autoplay=1&loop=1&playlist=${bgVideoId}&controls=0`} title="Ambience" allow="autoplay" />
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL - TASKS */}
      <div style={styles.rightPanel}>
        <h2 style={styles.sectionTitle}>Session Goals</h2>
        <form onSubmit={addTask} style={styles.inputGroup}>
          <input value={taskInput} onChange={(e) => setTaskInput(e.target.value)} placeholder="What needs to get done?" style={styles.input} />
          <button type="submit" style={styles.addBtn}><Plus size={20} /></button>
        </form>
        <div style={styles.taskList}>
          {tasks.map(task => (
            <div key={task.id} onClick={() => toggleTask(task.id)} style={{...styles.taskItem, opacity: task.completed ? 0.5 : 1}}>
              {task.completed ? <CheckCircle size={20} color="#4caf50" /> : <div style={styles.circle} />}
              <span style={{textDecoration: task.completed ? "line-through" : "none"}}>{task.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: "40px", maxWidth: "1000px", margin: "0 auto", display: "flex", gap: "40px", flexWrap: "wrap", justifyContent: "center" },
  leftPanel: { flex: 1, minWidth: "350px", display: "flex", flexDirection: "column", gap: "24px" }, 
  rightPanel: { flex: 1, minWidth: "300px", background: "#111", padding: "24px", borderRadius: "20px", border: "1px solid #222", height: "fit-content" },
  timerCard: { background: "#111", padding: "30px", borderRadius: "24px", textAlign: "center", border: "1px solid #222", boxShadow: "0 10px 30px rgba(0,0,0,0.3)" },
  modeTabs: { display: "flex", justifyContent: "center", gap: "10px", marginBottom: "20px" },
  tab: { padding: "8px 16px", borderRadius: "20px", border: "none", color: "white", cursor: "pointer", fontWeight: "600", fontSize: "13px" },
  displayContainer: { height: "120px", display: "flex", alignItems: "center", justifyContent: "center" },
  timeWrapper: { display: "flex", alignItems: "center", gap: "15px" },
  timeDisplay: { fontSize: "80px", fontWeight: "bold", fontFamily: "monospace", letterSpacing: "-2px" },
  editBtn: { background: "none", border: "none", color: "#666", cursor: "pointer" },
  editForm: { display: "flex", alignItems: "center", gap: "8px" },
  inputWrapper: { display: "flex", flexDirection: "column", alignItems: "center" },
  timeInput: { fontSize: "40px", background: "#222", color: "white", border: "2px solid #333", borderRadius: "8px", width: "70px", textAlign: "center", fontFamily: "monospace" },
  label: { fontSize: "10px", color: "#666", marginTop: "4px", textTransform: "uppercase" },
  colon: { fontSize: "40px", fontWeight: "bold", color: "#444", marginBottom: "15px" },
  saveBtn: { background: "#ff4444", color: "white", border: "none", padding: "10px", borderRadius: "8px", cursor: "pointer", marginLeft: "10px" },
  controls: { display: "flex", justifyContent: "center", gap: "20px", alignItems: "center", marginTop: "10px" },
  mainBtn: { width: "70px", height: "70px", borderRadius: "50%", background: "white", color: "black", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  iconBtn: { background: "transparent", border: "none", color: "#666", cursor: "pointer" },
  
  audioCard: { background: "#111", padding: "24px", borderRadius: "24px", border: "1px solid #222" },
  cardHeader: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" },
  
  trackList: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  trackBtn: { 
    background: "transparent", 
    border: "1px solid #333", 
    color: "#ddd", 
    padding: "16px", 
    borderRadius: "12px", 
    cursor: "pointer", 
    fontSize: "15px", 
    fontWeight: "500",
    textAlign: "left",
    transition: "0.2s"
  },
  
  hiddenPlayer: { textAlign: "center", padding: "10px", background: "#0f0f0f", borderRadius: "8px", marginTop: "10px", border: "1px dashed #333" },
  sectionTitle: { fontSize: "20px", marginBottom: "20px" },
  inputGroup: { display: "flex", gap: "10px", marginBottom: "20px" },
  input: { flex: 1, background: "#222", border: "none", padding: "12px 16px", borderRadius: "12px", color: "white", outline: "none" },
  addBtn: { background: "#ff4444", color: "white", border: "none", width: "44px", borderRadius: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  taskList: { display: "flex", flexDirection: "column", gap: "10px" },
  taskItem: { display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "#1a1a1a", borderRadius: "10px", cursor: "pointer" },
  circle: { width: "20px", height: "20px", borderRadius: "50%", border: "2px solid #555" }
};

export default FocusPage;