import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getNotes, deleteNote } from "../utils/storage";
import { FileText, Download, Play, Trash2, ArrowRight, FileType, Image as ImageIcon, File } from "lucide-react";

// 📚 Libraries for Exporting
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null); // The active note
  const [showDownloadOptions, setShowDownloadOptions] = useState(false); // Sub-menu toggle
  
  const navigate = useNavigate();
  const printRef = useRef(null); // Used to capture image

  useEffect(() => {
    setNotes(getNotes());
  }, []);

  const handleDelete = (videoId) => {
    if (confirm("Delete this note permanently?")) {
      deleteNote(videoId);
      setNotes(getNotes());
      setSelectedNote(null);
    }
  };

  // --- 📥 EXPORT FUNCTIONS ---

  // 1. TXT
  const exportTXT = (note) => {
    const blob = new Blob([`Title: ${note.videoTitle}\nDate: ${new Date(note.date).toLocaleDateString()}\n\n${note.text}`], { type: "text/plain;charset=utf-8" });
    saveAs(blob, `${note.videoTitle}_note.txt`);
  };

  // 2. PDF
  const exportPDF = (note) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(note.videoTitle, 10, 10);
    doc.setFontSize(10);
    doc.text(`Saved on: ${new Date(note.date).toLocaleDateString()}`, 10, 16);
    doc.setFontSize(12);
    
    // Split long text to fit page
    const splitText = doc.splitTextToSize(note.text, 180);
    doc.text(splitText, 10, 30);
    
    doc.save(`${note.videoTitle}.pdf`);
  };

  // 3. IMAGE (PNG)
  const exportImage = async (note) => {
    if (!printRef.current) return;
    // We temporarily render the note in a clean div to capture it
    const canvas = await html2canvas(printRef.current);
    canvas.toBlob((blob) => {
      saveAs(blob, `${note.videoTitle}.png`);
    });
  };

  // 4. DOCX (Google Doc Compatible)
  const exportDOCX = (note) => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: note.videoTitle,
            heading: HeadingLevel.TITLE,
          }),
          new Paragraph({
            text: `Saved on: ${new Date(note.date).toLocaleDateString()}`,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: note.text,
                size: 24, // 12pt font
              }),
            ],
          }),
        ],
      }],
    });

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, `${note.videoTitle}.docx`);
    });
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>My Notes</h1>

      {/* 🖼️ HIDDEN PRINT AREA (For Image Generation) */}
      {selectedNote && (
        <div ref={printRef} style={styles.hiddenPrint}>
          <h1 style={{color: "black"}}>{selectedNote.videoTitle}</h1>
          <p style={{color: "#666"}}>{new Date(selectedNote.date).toLocaleDateString()}</p>
          <hr />
          <p style={{whiteSpace: "pre-wrap", color: "black"}}>{selectedNote.text}</p>
        </div>
      )}

      {notes.length === 0 ? (
        <div style={styles.empty}>
          <FileText size={48} color="#333" />
          <p>No notes found. Watch a video to create one!</p>
        </div>
      ) : (
        // ✅ GRID LAYOUT (Matches Wireframe)
        <div style={styles.grid}>
          {notes.map((note) => (
            <div 
              key={note.videoId} 
              style={styles.card}
              onClick={() => { setSelectedNote(note); setShowDownloadOptions(false); }}
            >
              <div style={styles.cardContent}>
                <FileText size={32} color="white" />
                <h3 style={styles.cardTitle}>{note.videoTitle}</h3>
              </div>
              
              <div style={styles.cardArrow}>
                <ArrowRight size={24} color="white" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🟢 MAIN ACTION MODAL */}
      {selectedNote && (
        <div style={styles.modalOverlay} onClick={() => setSelectedNote(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={{marginTop: 0, marginBottom: "5px"}}>{selectedNote.videoTitle}</h2>
            <p style={{color: "#aaa", fontSize: "12px", marginBottom: "20px"}}>Select an action for this note:</p>

            {/* 1️⃣ DOWNLOAD OPTIONS */}
            {!showDownloadOptions ? (
               <button onClick={() => setShowDownloadOptions(true)} style={styles.actionBtn}>
                 <Download size={20} color="#4caf50" />
                 Download Note
               </button>
            ) : (
              <div style={styles.subOptionGrid}>
                <button onClick={() => exportPDF(selectedNote)} style={styles.subBtn}>
                   <FileType size={18} /> PDF
                </button>
                <button onClick={() => exportTXT(selectedNote)} style={styles.subBtn}>
                   <File size={18} /> TXT
                </button>
                <button onClick={() => exportImage(selectedNote)} style={styles.subBtn}>
                   <ImageIcon size={18} /> IMG
                </button>
                <button onClick={() => setShowDownloadOptions(false)} style={styles.backBtn}>
                   Cancel
                </button>
              </div>
            )}

            {/* 2️⃣ OPEN VIDEO */}
            <button onClick={() => navigate(`/video/${selectedNote.videoId}`)} style={styles.actionBtn}>
              <Play size={20} color="#2196f3" />
              Open Video
            </button>

            {/* 3️⃣ SAVE AS DOCX (Google Doc) */}
            <button onClick={() => exportDOCX(selectedNote)} style={styles.actionBtn}>
              <FileText size={20} color="#ff9800" />
              Export to DOCX (Google Docs)
            </button>
            
            <div style={styles.divider} />

            {/* 🗑️ DELETE */}
            <button onClick={() => handleDelete(selectedNote.videoId)} style={{...styles.actionBtn, color: "#ff4444", borderColor: "#330000", background: "#330000"}}>
              <Trash2 size={20} />
              Delete Permanently
            </button>

          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: "40px", color: "white", maxWidth: "1200px", margin: "0 auto" },
  pageTitle: { fontSize: "32px", fontWeight: "bold", marginBottom: "30px" },
  
  // 📐 WIREFRAME GRID
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "20px" },
  
  // 🔲 WIREFRAME CARD STYLE
  card: { 
    aspectRatio: "1/1", 
    background: "black", 
    border: "2px solid white", // ✅ White Border as requested
    borderRadius: "20px", 
    padding: "20px", 
    cursor: "pointer",
    display: "flex", 
    flexDirection: "column", 
    justifyContent: "space-between",
    position: "relative",
    transition: "transform 0.2s"
  },
  cardContent: { display: "flex", flexDirection: "column", gap: "10px" },
  cardTitle: { fontSize: "14px", fontWeight: "bold", lineHeight: "1.4", margin: 0, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" },
  cardArrow: { alignSelf: "flex-end" }, // Arrow in bottom right

  empty: { textAlign: "center", color: "#666", marginTop: "50px" },
  
  // 🖨️ Hidden div for screenshotting
  hiddenPrint: { position: "absolute", top: "-9999px", left: "-9999px", width: "600px", background: "white", padding: "40px", color: "black" },

  // 🟢 MODAL STYLES
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { background: "#111", padding: "25px", borderRadius: "20px", width: "90%", maxWidth: "350px", border: "1px solid #333", display: "flex", flexDirection: "column", gap: "12px" },
  
  actionBtn: { 
    display: "flex", alignItems: "center", gap: "12px", padding: "14px", 
    background: "#1a1a1a", border: "1px solid #333", borderRadius: "12px", 
    color: "white", fontSize: "14px", fontWeight: "bold", cursor: "pointer", transition: "0.2s" 
  },
  
  subOptionGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "5px" },
  subBtn: { background: "#222", border: "1px solid #444", color: "white", padding: "10px", borderRadius: "8px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", fontSize: "10px" },
  backBtn: { gridColumn: "1 / -1", background: "transparent", border: "none", color: "#666", padding: "5px", cursor: "pointer", fontSize: "12px" },
  
  divider: { height: "1px", background: "#222", margin: "5px 0" }
};

export default NotesPage;