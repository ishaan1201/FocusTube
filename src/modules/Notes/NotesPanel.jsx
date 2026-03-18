import { useState, useMemo, useRef, useEffect } from "react";
import { Save, Cloud, Database } from "lucide-react";
import { saveNote } from "../../utils/storage";
import { useAuth } from "../../context/AuthContext";
import { saveDocument } from "../../services/userData";

import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

// 🚀 Import our Custom Modules (Removed the drop module!)
import ImageResize from 'quill-image-resize-module-react';
import MagicUrl from 'quill-magic-url';

// 🚀 Register them with Quill
window.Quill = Quill;
Quill.register('modules/imageResize', ImageResize.default || ImageResize);
Quill.register('modules/magicUrl', MagicUrl.default || MagicUrl);

export default function NotesPanel({ id, video, noteText, setNoteText }) {
  const { user } = useAuth();
  const [noteStatus, setNoteStatus] = useState("");

  // 🧠 FIX 1: We use a Ref to track the text. 
  // This ensures our Ctrl+S shortcut always saves the latest text without needing to restart the editor!
  const textRef = useRef(noteText);
  useEffect(() => {
    textRef.current = noteText;
  }, [noteText]);

  const handleSaveNote = async () => {
    // 1. Hybrid Save (New System)
    await saveDocument(user, textRef.current, 'note', id);

    // 2. Legacy Local Save (for reverse compatibility during transition)
    saveNote({ 
      id, 
      title: video.snippet.title, 
      thumbnail: video.snippet.thumbnails.high?.url, 
      channel: video.snippet.channelTitle 
    }, textRef.current); 
    
    setNoteStatus("Saved! ✅");
    setTimeout(() => setNoteStatus(""), 2000);
  };

  // 🧠 FIX 2: useMemo prevents the editor from resetting on every keystroke!
  // This allows the Undo History to build up and the Image Resizer to stay active.
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }, { 'font': [] }], 
      ['bold', 'italic', 'underline', 'strike'], 
      [{ 'color': [] }, { 'background': [] }],          
      [{ 'list': 'ordered'}, { 'list': 'bullet' }], 
      ['link', 'image', 'code-block'],
      ['clean'] 
    ],
    // 🚀 Activate the Resizer
    imageResize: {
      parchment: Quill.import('parchment'),
      modules: ['Resize', 'DisplaySize']
    },
    // 🚀 Activate Auto-Linking
    magicUrl: true,
    // 🚀 Turn on Undo/Redo
    history: {
      delay: 1000,
      maxStack: 100,
      userOnly: true
    },
    // 🚀 Custom Keyboard Shortcuts
    keyboard: {
      bindings: {
        saveShortcut: {
          key: 'S',
          shortKey: true, // Ctrl / Cmd
          handler: function() {
            handleSaveNote(); 
            return false;
          }
        }
      }
    }
  }), []); // <-- That empty array is the magic that stops the restarting!

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }} className="wysiwyg-wrapper">
      <style>{`
        .wysiwyg-wrapper { display: flex; flex-direction: column; flex: 1; height: 100%; }
        .wysiwyg-wrapper .quill { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
        .wysiwyg-wrapper .ql-toolbar { background: #1a1a1a; border: 1px solid #222 !important; border-radius: 14px 14px 0 0; padding: 12px; }
        .wysiwyg-wrapper .ql-container { background: #0d0d0d; border: 1px solid #222 !important; border-top: none !important; border-radius: 0 0 14px 14px; flex: 1; overflow-y: auto; font-family: inherit; font-size: 15px; }
        .wysiwyg-wrapper .ql-editor { color: #fff; line-height: 1.8; padding: 20px; }
        .wysiwyg-wrapper .ql-stroke { stroke: #aaa !important; }
        .wysiwyg-wrapper .ql-fill { fill: #aaa !important; }
        .wysiwyg-wrapper .ql-picker { color: #aaa !important; }
        .wysiwyg-wrapper .ql-picker-options { background: #1a1a1a !important; border: 1px solid #333 !important; }
        .wysiwyg-wrapper .ql-editor.ql-blank::before { color: #666; font-style: normal; }
        .wysiwyg-wrapper .ql-color-picker .ql-picker-options, .wysiwyg-wrapper .ql-icon-picker .ql-picker-options { padding: 8px; }
      `}</style>

      <ReactQuill 
        theme="snow" 
        value={noteText} 
        onChange={setNoteText} 
        modules={modules}
        placeholder="Start typing your notes here..."
      />

      <div style={styles.notesFooter}>
        <div className="flex items-center gap-4">
          <span style={{ color: "#4caf50", fontWeight: "bold", fontSize: "14px" }}>{noteStatus}</span>
          {user ? (
            <div className="flex items-center gap-1.5 text-blue-500 text-[10px] font-bold uppercase tracking-widest bg-blue-500/10 px-2 py-1 rounded-md">
              <Cloud size={12} /> Cloud
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-bold uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md">
              <Database size={12} /> Local
            </div>
          )}
        </div>
        <button onClick={handleSaveNote} style={styles.saveBtn}>
          <Save size={16}/> Save Note
        </button>
      </div>
    </div>
  );
}

const styles = {
  notesFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" },
  saveBtn: { display: "flex", alignItems: "center", gap: "8px", background: "#ff9800", color: "black", padding: "10px 20px", borderRadius: "14px", border: "none", cursor: "pointer", fontWeight: "900", fontSize: "14px" }
};