import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from "lucide-react";

function LikedPage() {
  const [liked, setLiked] = useState([]);

  useEffect(() => {
    setLiked(JSON.parse(localStorage.getItem("liked_videos") || "[]"));
  }, []);

  return (
    <div style={{ padding: '40px' }}>
      <h1 style={{ fontWeight: '900', marginBottom: '30px' }}>Liked Videos</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {liked.map(v => (
          <Link to={`/video/${v.id}`} key={v.id} style={styles.row}>
            <img src={v.thumbnail} style={styles.miniThumb} alt="t" />
            <div>
              <h4 style={{ margin: 0, color: 'white' }}>{v.title}</h4>
              <p style={{ margin: '5px 0 0 0', color: '#aaa', fontSize: '12px' }}>{v.channel}</p>
            </div>
            <Heart size={18} color="red" fill="red" style={{ marginLeft: 'auto' }} />
          </Link>
        ))}
        {liked.length === 0 && <p style={{ color: '#666' }}>No liked videos yet.</p>}
      </div>
    </div>
  );
}

const styles = {
  row: { display: "flex", gap: "15px", alignItems: "center", background: "#111", padding: "12px", borderRadius: "12px", textDecoration: "none" },
  miniThumb: { width: "120px", borderRadius: "8px" }
};

export default LikedPage;