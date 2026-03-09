import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function History() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(JSON.parse(localStorage.getItem("focus_history") || "[]"));
  }, []);

  return (
    <div style={{padding: '40px'}}>
      <h1 style={{fontSize: '32px', marginBottom: '30px'}}>Watch History</h1>
      <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
        {items.map(video => (
          <Link 
            to={`/video/${video.id}?t=${Math.floor(video.resumeTime || 0)}`} 
            key={video.id} 
            style={styles.historyCard}
          >
            <img src={video.thumbnail} style={styles.thumb} alt="t" />
            <div style={styles.details}>
              <h3 style={{margin: '0 0 5px 0', color: 'white'}}>{video.title}</h3>
              <p style={{color: '#aaa', margin: 0}}>Watched on {new Date(video.lastWatched).toLocaleDateString()}</p>
              <span style={styles.resumeBadge}>Resume at {Math.floor(video.resumeTime / 60)}m</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

const styles = {
  historyCard: { display: "flex", gap: "20px", textDecoration: "none", background: "#111", padding: "15px", borderRadius: "16px" },
  thumb: { width: "200px", aspectRatio: "16/9", borderRadius: "12px", objectFit: "cover" },
  resumeBadge: { display: "inline-block", marginTop: "10px", background: "#ff0000", color: "white", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold" }
};

export default History;