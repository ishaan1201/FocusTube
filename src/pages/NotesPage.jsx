import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getNotes, deleteNote } from "../utils/storage";
import { FileText, Download, Play, Trash2, ArrowRight, FileType, File } from "lucide-react";

// 📚 Libraries for Exporting
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

// 🚀 Helper: Bulletproof HTML Stripper for TXT and Word Docs
const stripHtml = (html) => {
  if (!html) return "";
  let text = html.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/p>|<\/div>|<\/h[1-6]>/gi, '\n\n');
  text = text.replace(/<li[^>]*>/gi, '• ');
  text = text.replace(/<\/li>/gi, '\n');
  text = text.replace(/<[^>]+>/g, '');
  const txt = document.createElement('textarea');
  txt.innerHTML = text;
  return txt.value.replace(/\n\s*\n/g, '\n\n').trim(); 
};

function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null); 
  const [showDownloadOptions, setShowDownloadOptions] = useState(false); 
  
  const navigate = useNavigate();

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

  // 1. TXT (Cleaned Plain Text)
  const exportTXT = (note) => {
    const plainText = stripHtml(note.text); 
    const blob = new Blob([`Title: ${note.videoTitle}\nDate: ${new Date(note.date).toLocaleDateString()}\n\n${plainText}`], { type: "text/plain;charset=utf-8" });
    saveAs(blob, `${note.videoTitle}_note.txt`);
  };

  // 🚀 2. PDF (Native Selectable Text Engine)
  const exportPDF = (note) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${note.videoTitle} - Curio Notes</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #000; line-height: 1.6; max-width: 800px; margin: 0 auto; }
            img { max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0; }
            h1 { border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 5px; }
            .meta { color: #666; font-size: 14px; margin-bottom: 30px; }
            blockquote { border-left: 4px solid #ccc; padding-left: 16px; color: #555; margin-left: 0; }
          </style>
        </head>
        <body>
          <h1>${note.videoTitle}</h1>
          <div class="meta">Saved on: ${new Date(note.date).toLocaleDateString()}</div>
          <div class="content">${note.text}</div>
          <script>
            // Wait briefly for images to load, then trigger native PDF save dialog
            window.onload = () => {
              setTimeout(() => {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // 3. DOCX (Native Word Document with Cleaned Text)
  const exportDOCX = (note) => {
    const plainText = stripHtml(note.text);
    const paragraphs = plainText.split('\n').map(line => {
      return new Paragraph({ children: [new TextRun({ text: line, size: 24 })] });
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({ text: note.videoTitle, heading: HeadingLevel.TITLE }),
          new Paragraph({ text: `Saved on: ${new Date(note.date).toLocaleDateString()}`, spacing: { after: 400 } }),
          ...paragraphs,
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

      {notes.length === 0 ? (
        <div style={styles.empty}>
          <FileText size={48} color="#333" />
          <p>No notes found. Watch a video to create one!</p>
        </div>
      ) : (
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
              <div style={styles.cardArrow}><ArrowRight size={24} color="white" /></div>
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

            {!showDownloadOptions ? (
               <button onClick={() => setShowDownloadOptions(true)} style={styles.actionBtn}>
                 <Download size={20} color="#4caf50" /> Download Note
               </button>
            ) : (
              <div style={styles.subOptionGrid}>
                <button onClick={() => exportPDF(selectedNote)} style={styles.subBtn}><FileType size={18} /> Selectable PDF</button>
                <button onClick={() => exportTXT(selectedNote)} style={styles.subBtn}><File size={18} /> TXT</button>
                <button onClick={() => setShowDownloadOptions(false)} style={styles.backBtn}>Cancel</button>
              </div>
            )}

            <button onClick={() => navigate(`/video/${selectedNote.videoId}`)} style={styles.actionBtn}>
              <Play size={20} color="#2196f3" /> Open Video
            </button>

            <button onClick={() => exportDOCX(selectedNote)} style={styles.actionBtn}>
              <FileText size={20} color="#ff9800" /> Export to DOCX
            </button>
            
            <div style={styles.divider} />

            <button onClick={() => handleDelete(selectedNote.videoId)} style={{...styles.actionBtn, color: "#ff4444", borderColor: "#330000", background: "#330000"}}>
              <Trash2 size={20} /> Delete Permanently
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
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "20px" },
  card: { aspectRatio: "1/1", background: "black", border: "2px solid white", borderRadius: "20px", padding: "20px", cursor: "pointer", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", transition: "transform 0.2s" },
  cardContent: { display: "flex", flexDirection: "column", gap: "10px" },
  cardTitle: { fontSize: "14px", fontWeight: "bold", lineHeight: "1.4", margin: 0, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" },
  cardArrow: { alignSelf: "flex-end" },
  empty: { textAlign: "center", color: "#666", marginTop: "50px" },

  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { background: "#111", padding: "25px", borderRadius: "20px", width: "90%", maxWidth: "350px", border: "1px solid #333", display: "flex", flexDirection: "column", gap: "12px" },
  actionBtn: { display: "flex", alignItems: "center", gap: "12px", padding: "14px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "12px", color: "white", fontSize: "14px", fontWeight: "bold", cursor: "pointer", transition: "0.2s" },
  
  subOptionGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "5px" },
  subBtn: { background: "#222", border: "1px solid #444", color: "white", padding: "10px", borderRadius: "8px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", fontSize: "10px" },
  backBtn: { gridColumn: "1 / -1", background: "transparent", border: "none", color: "#666", padding: "5px", cursor: "pointer", fontSize: "12px" },
  divider: { height: "1px", background: "#222", margin: "5px 0" }
};

export default NotesPage;