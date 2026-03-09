import { useParams, useNavigate } from "react-router-dom";
import { X, ChevronUp, ChevronDown } from "lucide-react";

function ShortsPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div style={styles.overlay}>
      <button onClick={() => navigate(-1)} style={styles.closeBtn}><X size={30} /></button>
      
      <div style={styles.shortsContainer}>
        <div style={styles.videoCard}>
          <iframe 
            src={`https://www.youtube.com/embed/${id}?autoplay=1&loop=1&playlist=${id}&controls=0`} 
            style={styles.iframe} 
            allow="autoplay"
          />
          {/* Mock UI Overlay */}
          <div style={styles.uiOverlay}>
            <div style={styles.sideActions}>
              <div style={styles.action}>👍</div>
              <div style={styles.action}>💬</div>
              <div style={styles.action}>↗️</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: "fixed", inset: 0, background: "#000", zIndex: 2000, display: "flex", justifyContent: "center", alignItems: "center" },
  closeBtn: { position: "absolute", top: "20px", left: "20px", background: "none", border: "none", color: "white", cursor: "pointer" },
  shortsContainer: { width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" },
  videoCard: { width: "min(400px, 90vw)", height: "min(700px, 85vh)", background: "#111", borderRadius: "16px", overflow: "hidden", position: "relative" },
  iframe: { width: "100%", height: "100%", border: "none" },
  uiOverlay: { position: "absolute", bottom: "40px", right: "15px" },
  sideActions: { display: "flex", flexDirection: "column", gap: "20px" },
  action: { width: "45px", height: "45px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "20px" }
};

export default ShortsPlayer;