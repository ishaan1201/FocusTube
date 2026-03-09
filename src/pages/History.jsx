import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getHistory, clearHistory } from "../utils/storage";
import { Trash2, Clock, RotateCcw } from "lucide-react";

function History() {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    setVideos(getHistory());
  }, []);

  const handleClear = () => {
    if (confirm("Clear entire history?")) {
      clearHistory();
      setVideos([]);
    }
  };

  const formatResume = (seconds = 0) => {
    const s = Math.floor(seconds);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec}s`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Watch History</h1>
        {videos.length > 0 && (
          <button onClick={handleClear} style={styles.clearBtn}>
            <Trash2 size={16} /> Clear History
          </button>
        )}
      </div>

      {videos.length === 0 ? (
        <div style={styles.empty}>
          <Clock size={48} color="#333" />
          <p>No watch history yet. Start learning!</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {videos.map((v) => (
            <Link to={`/video/${v.id}?t=${Math.floor(v.resumeTime || 0)}`} key={v.id} style={styles.card}>
              <img src={v.thumbnail} style={styles.thumb} alt={v.title} />
              <div style={styles.info}>
                <h3 style={styles.cardTitle}>{v.title}</h3>
                <p style={styles.date}>Watched: {new Date(v.timestamp || 0).toLocaleDateString()}</p>
                <p style={styles.resume}><RotateCcw size={14} /> Resume at {formatResume(v.resumeTime)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: "40px", color: "white" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" },
  title: { fontSize: "28px", fontWeight: "bold" },
  clearBtn: { background: "rgba(255, 68, 68, 0.1)", color: "#ff4444", border: "1px solid rgba(255, 68, 68, 0.2)", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" },
  empty: { textAlign: "center", color: "#666", marginTop: "50px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "20px" },
  card: { textDecoration: "none", color: "white", background: "#1a1a1a", borderRadius: "12px", overflow: "hidden", display: "block" },
  thumb: { width: "100%", aspectRatio: "16/9", objectFit: "cover" },
  info: { padding: "12px" },
  cardTitle: { fontSize: "14px", fontWeight: "bold", margin: "0 0 5px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
  date: { fontSize: "11px", color: "#888" },
  resume: { marginTop: "8px", color: "#ffcc00", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "600" }
};

export default History;