import { useState, useEffect, useRef } from "react";
import YouTube from "react-youtube";
import { RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { logWatchTime } from "../../utils/storage";
import { syncWatchHistory } from "../../services/userData";

export default function VideoPlayer({ id, video, startTime, focusMode, user }) {
  const [isVideoEnded, setIsVideoEnded] = useState(false);
  const playerRef = useRef(null);

  // Automatically track watch time and save to history
  useEffect(() => {
    let interval;
    if (video) {
      interval = setInterval(async () => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          try {
            const playerState = await playerRef.current.getPlayerState();
            if (playerState === 1) { 
              logWatchTime(15); 
              
              const currentTime = await playerRef.current.getCurrentTime();
              if (currentTime > 5) {
                // 🚀 Silently syncs to DB or LocalStorage based on login status
                syncWatchHistory(user, video, currentTime).catch(console.error);
              }
            }
          } catch (err) {}
        }
      }, 15000); // 🚀 Increased to 15 seconds to save database bandwidth
    }
    return () => clearInterval(interval);
  }, [video, id, user]);

  return (
    <div style={focusMode ? styles.playerWrapperFocus : styles.playerWrapper}>
      <YouTube
        videoId={id}
        opts={{ height: '100%', width: '100%', playerVars: { autoplay: 1, start: parseInt(startTime) || 0, modestbranding: 1, rel: 0 } }}
        onReady={(e) => { 
          playerRef.current = e.target; 
          const startSecs = parseInt(startTime, 10);
          if (startSecs > 0) e.target.seekTo(startSecs, true);
        }}
        onStateChange={(e) => { if (e.data === 0) setIsVideoEnded(true); }}
        className="youtube-player"
        style={{ width: "100%", height: "100%" }}
      />
      {isVideoEnded && (
        <div style={styles.endOverlay}>
          <h2>Session Complete! 🎉</h2>
          <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
            <button onClick={() => window.location.reload()} style={styles.overlayBtn}><RotateCcw size={20} /> Replay</button>
            <Link to="/classroom" style={{ ...styles.overlayBtn, background: "#4caf50", color: "white", textDecoration: "none" }}>Next Lesson</Link>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  playerWrapper: { position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: "24px", overflow: "hidden", background: "black", boxShadow: "0 20px 50px rgba(0,0,0,0.5)", border: "1px solid #111" },
  playerWrapperFocus: { position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: "24px", overflow: "hidden", background: "black", boxShadow: "0 20px 50px rgba(0,0,0,0.8)", border: "1px solid #222" },
  endOverlay: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.95)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 10 },
  overlayBtn: { display: "flex", alignItems: "center", gap: "10px", padding: "14px 28px", borderRadius: "30px", border: "none", cursor: "pointer", background: "white", color: "black", fontWeight: "bold" },
};