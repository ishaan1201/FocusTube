import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BrainCircuit, Download, Trash2, ArrowRight, ArrowLeft, Search, Eye, X, MessageSquare, FileText, File, Printer } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

function AiInsights() {
  const [chatIndex, setChatIndex] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingTranscript, setViewingTranscript] = useState(null);
  
  // 🚀 NEW: State to track which card's download menu is open
  const [activeDownloadMenu, setActiveDownloadMenu] = useState(null);

  useEffect(() => {
    const savedChats = JSON.parse(localStorage.getItem("focus_chat_index") || "[]");
    const enrichedChats = savedChats.map(chat => {
      const chatData = JSON.parse(localStorage.getItem(`chat_${chat.id}`) || "[]");
      return { ...chat, msgCount: chatData.length };
    });
    setChatIndex(enrichedChats);
  }, []);

  // 🚀 THE UNIVERSAL EXPORT ENGINE
  const exportTranscript = (format, videoId, title) => {
    const data = JSON.parse(localStorage.getItem(`chat_${videoId}`) || "[]");
    if (data.length === 0) return alert("No chat history found.");
    
    const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase().slice(0, 30);
    
    if (format === "txt") {
      let content = `FocusAI Transcript: ${title}\n\n`;
      data.forEach(msg => {
        content += `${msg.role === "ai" ? "FocusAI" : "You"}:\n${msg.text}\n\n`;
      });
      const blob = new Blob([content], { type: "text/plain" });
      triggerDownload(blob, `FocusAI_${safeTitle}.txt`);
    } 
    
    else if (format === "doc") {
      let content = `<html xmlns:w="urn:schemas-microsoft-com:office:word"><body><h1 style="font-family: sans-serif;">FocusAI Transcript: ${title}</h1>`;
      data.forEach(msg => {
        const color = msg.role === "ai" ? "#2196f3" : "#4caf50";
        const name = msg.role === "ai" ? "FocusAI" : "You";
        const formattedText = msg.text.replace(/\n/g, "<br/>").replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
        content += `<h3 style="color:${color}; font-family: sans-serif;">${name}:</h3><p style="font-family: sans-serif; line-height: 1.6;">${formattedText}</p><hr/>`;
      });
      content += `</body></html>`;
      const blob = new Blob([content], { type: "application/msword" });
      triggerDownload(blob, `FocusAI_${safeTitle}.doc`);
    } 
    
    else if (format === "pdf") {
      const printWindow = window.open('', '', 'height=800,width=800');
      printWindow.document.write(`
        <html><head><title>${title}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; padding: 40px; color: #333; }
          h1 { border-bottom: 2px solid #eee; padding-bottom: 10px; }
          .ai { color: #2196f3; font-weight: bold; font-size: 14px; text-transform: uppercase; margin-top: 20px; }
          .user { color: #4caf50; font-weight: bold; font-size: 14px; text-transform: uppercase; margin-top: 20px; }
          p { margin-top: 5px; }
          hr { border: 0; border-top: 1px solid #eee; margin: 20px 0; }
        </style>
        </head><body><h1>${title}</h1>
      `);
      data.forEach(msg => {
        const className = msg.role === "ai" ? "ai" : "user";
        const name = msg.role === "ai" ? "FocusAI" : "You";
        const formattedText = msg.text.replace(/\n/g, "<br/>").replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
        printWindow.document.write(`<div class="${className}">${name}</div><p>${formattedText}</p><hr/>`);
      });
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }

    // Close the dropdown if it was open
    setActiveDownloadMenu(null);
  };

  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleViewTranscript = (videoId, videoTitle) => {
    const chatData = JSON.parse(localStorage.getItem(`chat_${videoId}`) || "[]");
    if (chatData.length === 0) return alert("No chat history found.");
    // 🚀 Added 'id' to the state so the modal export buttons know which video to export
    setViewingTranscript({ id: videoId, title: videoTitle, data: chatData });
  };

  const handleDeleteChat = (videoId) => {
    if(window.confirm("Delete this AI Insight permanently?")) {
      const updatedIndex = chatIndex.filter(v => v.id !== videoId);
      setChatIndex(updatedIndex);
      localStorage.setItem("focus_chat_index", JSON.stringify(updatedIndex));
      localStorage.removeItem(`chat_${videoId}`);
    }
  };

  const filteredChats = chatIndex.filter(chat => 
    chat.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    chat.channel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={styles.container} onClick={() => setActiveDownloadMenu(null)}>
      <div style={styles.topNav}>
        <Link to="/vault" style={styles.backBtn}>
          <ArrowLeft size={18} /> Back to Vault
        </Link>
      </div>

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}><BrainCircuit size={36} color="#2196f3"/> AI Insights</h1>
          <p style={styles.subtitle}>Your centralized empire of knowledge, transcripts, and saved sessions.</p>
        </div>
        
        <div style={styles.searchBox}>
          <Search size={20} color="#666" />
          <input 
            type="text" 
            placeholder="Search transcripts..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      <div style={styles.grid}>
        {filteredChats.length === 0 ? (
          <div style={styles.emptyState}>
            <BrainCircuit size={48} color="#333" style={{ marginBottom: "15px" }} />
            <p style={styles.emptyMsg}>{searchTerm ? "No transcripts match your search." : "Your AI memory bank is empty."}</p>
          </div>
        ) : (
          filteredChats.map((item) => (
            <div key={item.id} style={styles.card}>
              <div style={styles.imageWrapper}>
                <img src={item.thumbnail} alt={item.title} style={styles.thumbnail} />
                <div style={styles.dateOverlay}>
                  {new Date(item.timestamp).toLocaleDateString()}
                </div>
                <div style={styles.msgBadge}>
                  <MessageSquare size={12} /> {item.msgCount}
                </div>
              </div>
              
              <div style={styles.cardInfo}>
                <h3 style={styles.cardTitle}>{item.title.length > 55 ? item.title.slice(0, 55) + "..." : item.title}</h3>
                <p style={styles.cardChannel}>{item.channel}</p>
              </div>

              <div style={styles.actions}>
                <Link to={`/video/${item.id}`} style={styles.resumeBtn}>
                  Resume <ArrowRight size={16} />
                </Link>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <button onClick={(e) => { e.stopPropagation(); handleViewTranscript(item.id, item.title); }} style={styles.iconBtnView} title="Open Quick Peek">
                    <Eye size={18} color="#ff9800" />
                  </button>
                  
                  {/* 🚀 QUICK EXPORT DROPDOWN SYSTEM */}
                  <div style={{ position: "relative" }}>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setActiveDownloadMenu(activeDownloadMenu === item.id ? null : item.id);
                      }} 
                      style={styles.iconBtnDown} 
                      title="Export Options"
                    >
                      <Download size={18} color="#4caf50" />
                    </button>

                    {activeDownloadMenu === item.id && (
                      <div style={styles.dropdownMenu} onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => exportTranscript("txt", item.id, item.title)} style={styles.dropdownItem}><FileText size={14}/> TXT</button>
                        <button onClick={() => exportTranscript("doc", item.id, item.title)} style={styles.dropdownItem}><File size={14}/> DOC</button>
                        <button onClick={() => exportTranscript("pdf", item.id, item.title)} style={styles.dropdownItem}><Printer size={14}/> PDF</button>
                      </div>
                    )}
                  </div>

                  <button onClick={(e) => { e.stopPropagation(); handleDeleteChat(item.id); }} style={styles.iconBtnDelete} title="Delete Record">
                    <Trash2 size={18} color="#ff4444" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 🚀 THE QUICK PEEK READER WITH EXPORT TOOLS */}
      {viewingTranscript && (
        <div style={styles.modalOverlay} onClick={() => setViewingTranscript(null)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={{ margin: 0, fontSize: "20px", color: "#fff", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {viewingTranscript.title}
              </h2>
              
              <div style={styles.exportTools}>
                <span style={{ fontSize: "12px", color: "#888", fontWeight: "bold", marginRight: "10px" }}>EXPORT:</span>
                <button onClick={() => exportTranscript("txt", viewingTranscript.id, viewingTranscript.title)} style={styles.exportBtn}><FileText size={16} /> TXT</button>
                <button onClick={() => exportTranscript("doc", viewingTranscript.id, viewingTranscript.title)} style={styles.exportBtn}><File size={16} /> DOC</button>
                <button onClick={() => exportTranscript("pdf", viewingTranscript.id, viewingTranscript.title)} style={styles.exportBtn}><Printer size={16} /> PDF</button>
                <div style={{ width: "1px", height: "20px", background: "#333", margin: "0 10px" }}></div>
                <button onClick={() => setViewingTranscript(null)} style={styles.closeBtn}><X size={24} /></button>
              </div>
            </div>
            
            <div style={styles.modalBody}>
              {viewingTranscript.data.map((msg, idx) => (
                <div key={idx} style={{ marginBottom: "24px" }}>
                  <div style={{ color: msg.role === 'ai' ? '#2196f3' : '#4caf50', fontWeight: '800', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase' }}>
                    {msg.role === 'ai' ? '🤖 FocusAI' : '👤 You'}
                  </div>
                  <div className="markdown-body" style={{ background: msg.role === 'ai' ? '#111' : '#1a1a1a', padding: '16px', borderRadius: '12px', border: '1px solid #222' }}>
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        // 🚀 NEW: Force links to open in a new tab
                        a: ({ node, children, ...props }) => (
                          <a {...props} target="_blank" rel="noopener noreferrer">
                            {children}
                          </a>
                        ),
                        // 🚀 FIX: Prevent hydration error (div inside p) by using span (if it were wrapped)
                        // Even for a plain img, using a consistent approach is safer
                        img: ({ node, src, alt, ...props }) => (
                          <img
                            src={src}
                            alt={alt}
                            referrerPolicy="no-referrer"
                            style={{ maxWidth: "100%", borderRadius: "8px", marginTop: "10px" }}
                            {...props}
                          />
                        )
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Global CSS for the modal markdown
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  .markdown-body p { margin: 0 0 10px 0; color: #ddd; line-height: 1.6; }
  .markdown-body p:last-child { margin: 0; }
  .markdown-body pre { background: #000; padding: 12px; border-radius: 8px; overflow-x: auto; }
  .markdown-body code { font-family: monospace; background: rgba(255,255,255,0.1); padding: 2px 4px; border-radius: 4px; }
  .markdown-body a { color: #2196f3; }
`;
document.head.appendChild(styleSheet);

const styles = {
  container: { padding: "40px", maxWidth: "1600px", margin: "0 auto", color: "white", minHeight: "100vh", background: "#050505" },
  topNav: { marginBottom: "20px" },
  backBtn: { display: "inline-flex", alignItems: "center", gap: "8px", color: "#888", textDecoration: "none", fontSize: "14px", fontWeight: "600" },
  
  header: { marginBottom: "40px", borderBottom: "1px solid #1a1a1a", paddingBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px" },
  title: { fontSize: "36px", fontWeight: "900", margin: "0 0 10px 0", display: "flex", alignItems: "center", gap: "15px", letterSpacing: "-1px" },
  subtitle: { color: "#888", fontSize: "16px", margin: 0 },
  
  searchBox: { display: "flex", alignItems: "center", gap: "10px", background: "#111", border: "1px solid #222", padding: "12px 20px", borderRadius: "16px", minWidth: "300px" },
  searchInput: { background: "transparent", border: "none", color: "white", outline: "none", width: "100%", fontSize: "15px" },

  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "24px" },
  card: { background: "#0a0a0a", borderRadius: "20px", overflow: "hidden", border: "1px solid #1a1a1a", display: "flex", flexDirection: "column", transition: "0.2s", ":hover": { transform: "translateY(-4px)" } },
  
  imageWrapper: { position: "relative", width: "100%", aspectRatio: "16/9" },
  thumbnail: { width: "100%", height: "100%", objectFit: "cover", borderBottom: "1px solid #111" },
  dateOverlay: { position: "absolute", bottom: "10px", right: "10px", background: "rgba(0,0,0,0.8)", color: "#ddd", padding: "4px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: "700" },
  msgBadge: { position: "absolute", top: "10px", right: "10px", background: "rgba(33, 150, 243, 0.9)", color: "#fff", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "800", display: "flex", alignItems: "center", gap: "4px" },
  
  cardInfo: { padding: "20px", flex: 1 },
  cardTitle: { margin: "0 0 8px 0", fontSize: "16px", fontWeight: "800", lineHeight: "1.4", color: "#eee" },
  cardChannel: { margin: "0 0 0 0", fontSize: "13px", color: "#888", fontWeight: "600" },
  
  actions: { padding: "16px 20px", background: "#000", borderTop: "1px solid #111", display: "flex", justifyContent: "space-between", alignItems: "center" },
  resumeBtn: { background: "#2196f3", color: "white", textDecoration: "none", padding: "10px 18px", borderRadius: "12px", fontSize: "13px", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" },
  iconBtnDelete: { background: "rgba(255, 68, 68, 0.1)", border: "none", padding: "10px", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  iconBtnView: { background: "rgba(255, 152, 0, 0.1)", border: "none", padding: "10px", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  iconBtnDown: { background: "rgba(76, 175, 80, 0.1)", border: "none", padding: "10px", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  
  // 🚀 DROPDOWN STYLES
  dropdownMenu: { position: "absolute", bottom: "120%", left: "50%", transform: "translateX(-50%)", background: "#111", border: "1px solid #333", borderRadius: "12px", padding: "6px", display: "flex", flexDirection: "column", gap: "4px", zIndex: 50, boxShadow: "0 10px 30px rgba(0,0,0,0.8)" },
  dropdownItem: { background: "transparent", border: "none", color: "#eee", padding: "10px 16px", textAlign: "left", cursor: "pointer", borderRadius: "8px", fontSize: "13px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "10px", width: "100px", transition: "0.2s" },

  emptyState: { gridColumn: "1 / -1", textAlign: "center", padding: "80px 20px", background: "#0a0a0a", borderRadius: "24px", border: "1px dashed #222" },
  emptyMsg: { color: "#fff", fontSize: "20px", fontWeight: "800", margin: "0" },

  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(5px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" },
  modalContent: { background: "#050505", width: "100%", maxWidth: "900px", height: "85vh", borderRadius: "24px", border: "1px solid #222", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.8)" },
  modalHeader: { padding: "20px 24px", borderBottom: "1px solid #111", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0a0a0a" },
  exportTools: { display: "flex", alignItems: "center", gap: "8px" },
  exportBtn: { background: "#111", border: "1px solid #333", color: "#fff", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", transition: "0.2s" },
  closeBtn: { background: "none", border: "none", color: "#888", cursor: "pointer", transition: "0.2s" },
  modalBody: { padding: "30px", overflowY: "auto", flex: 1 }
};

export default AiInsights;