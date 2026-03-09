import { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import { Clock, Download } from "lucide-react";
import { saveNoteMetadata } from "../../utils/storage";

function NotesPanel({ videoId, videoTitle }) {
  const [noteContent, setNoteContent] = useState("");
  const [lastSaved, setLastSaved] = useState("");
  const [manualTime, setManualTime] = useState("");

  // Load saved notes on video change
  useEffect(() => {
    const saved = localStorage.getItem(`notes_doc_${videoId}`);
    if (saved) setNoteContent(saved);
    else setNoteContent(""); // Clear if no notes for this video
  }, [videoId]);

  // ⚡ AUTO-SAVE LOGIC
  const handleNoteChange = (e) => {
    const text = e.target.value;
    setNoteContent(text);
    localStorage.setItem(`notes_doc_${videoId}`, text);
    // Save metadata so Notes page can show title/date
    try { saveNoteMetadata(videoId, videoTitle); } catch (e) {}
    setLastSaved(new Date().toLocaleTimeString());
  };

  // 🕒 Insert Timestamp at Cursor Position
  const insertTimestamp = () => {
    const timeTag = `[${manualTime || "00:00"}] `;
    const textarea = document.getElementById("notepad-area");
    
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = noteContent;
      const newText = text.substring(0, start) + timeTag + text.substring(end);
      
      setNoteContent(newText);
      localStorage.setItem(`notes_doc_${videoId}`, newText); // Save immediately
      try { saveNoteMetadata(videoId, videoTitle); } catch (e) {}
      
      // Reset cursor position after insert
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + timeTag.length;
        textarea.focus();
      }, 0);
    }
    setManualTime("");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold").setTextColor(220, 0, 0).text("STUDY NOTES", 10, 20);
    doc.setFont("helvetica", "normal").setTextColor(0, 0, 0).setFontSize(10);
    doc.text(`Video: ${videoTitle || videoId}`, 10, 30);
    
    doc.setFontSize(12);
    const cleanText = noteContent.replace(/[^\x20-\x7E\n]/g, ""); // Strip gibberish
    const splitText = doc.splitTextToSize(cleanText, 180);
    doc.text(splitText, 10, 40);
    
    doc.save(`${videoTitle}_Notes.pdf`);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={{ margin: 0, color: "#ff4444", fontSize: "16px" }}>📝 Notepad</h3>
        <span style={{ fontSize: "11px", color: "#666" }}>{lastSaved ? `Saved ${lastSaved}` : "Auto-save ready"}</span>
      </div>

      <div style={styles.toolbar}>
        <input 
          value={manualTime}
          onChange={(e) => setManualTime(e.target.value)}
          placeholder="00:00"
          style={styles.timeInput}
        />
        <button onClick={insertTimestamp} style={styles.toolBtn}>
          <Clock size={14} /> Insert Time
        </button>
        <button onClick={exportPDF} style={styles.toolBtn}>
          <Download size={14} /> PDF
        </button>
      </div>

      <textarea
        id="notepad-area"
        value={noteContent}
        onChange={handleNoteChange}
        placeholder="Type your notes here... (Everything saves automatically)"
        style={styles.textarea}
      />
    </div>
  );
}

const styles = {
  container: { background: "#111", borderRadius: "12px", border: "1px solid #222", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" },
  header: { padding: "15px", borderBottom: "1px solid #222", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#1a1a1a" },
  toolbar: { display: "flex", gap: "10px", padding: "10px", background: "#151515", borderBottom: "1px solid #222" },
  timeInput: { background: "#222", border: "none", color: "white", padding: "5px", borderRadius: "4px", width: "60px", textAlign: "center", fontSize: "12px" },
  toolBtn: { background: "#333", color: "white", border: "none", padding: "5px 10px", borderRadius: "4px", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" },
  textarea: { flex: 1, background: "#0f0f0f", color: "#e0e0e0", border: "none", padding: "15px", resize: "none", outline: "none", fontSize: "14px", lineHeight: "1.6", fontFamily: "monospace" }
};

export default NotesPanel;