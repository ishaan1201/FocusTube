import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Youtube, Heart, Bookmark, Check } from "lucide-react"; 
import { useAuth } from "../context/AuthContext";
import { toggleVideoInList, fetchVideoList } from "../services/userData";

function VideoCard({ video, isShort = false }) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const checkState = async () => {
      const likedList = await fetchVideoList(user, 'liked');
      const savedList = await fetchVideoList(user, 'saved');
      const vId = video.id?.videoId || video.id;
      setIsLiked(likedList.some(v => (v.video_id || v.id) === vId));
      setIsSaved(savedList.some(v => (v.video_id || v.id) === vId));
    };
    checkState();
  }, [user, video.id]);

  const handleToggle = async (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    const added = await toggleVideoInList(user, video, type);
    if (type === 'liked') setIsLiked(added);
    else setIsSaved(added);
  };

  const videoId = video.id?.videoId || video.id;
  const { title, channelTitle, channelId, thumbnails, publishedAt } = video.snippet;
  
  // Safely grab the data from our youtube.js fetcher
  const views = video.views || video.statistics?.viewCount || "0";
  const duration = video.duration || "0:00";

  // 📊 Format Views (Turns 1200000 into 1.2M)
  const formattedViews = Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(views);

  // 📅 Format Date (Turns ISO into "Oct 12, 2023")
  const formattedDate = new Date(publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  // 👤 The Quota-Saving PFP Hack (Now using real PFP if available)
  const channelPfp = video.channelThumbnail || `https://ui-avatars.com/api/?name=${encodeURIComponent(channelTitle)}&background=333&color=fff&rounded=true`;

  const s = styles(isShort);

  return (
    <div style={s.cardContainer}>
      
      {/* THUMBNAIL SECTION */}
      <Link to={isShort ? `/shorts/${videoId}` : `/video/${videoId}`} style={s.thumbLink}>
        <div style={s.thumbWrapper}>
          <img src={thumbnails?.high?.url || thumbnails?.medium?.url} alt={title} style={s.img} />
          
          <div style={s.durationBadge}>{duration}</div>
          
          {/* Small YouTube Logo in the corner */}
          <div style={s.ytBadge}>
            <Youtube size={16} color="white" fill="#ff0000" />
          </div>

          {/* Quick Actions Hover Overlay */}
          <div className="action-overlay" style={s.actionOverlay}>
            <button 
              onClick={(e) => handleToggle(e, 'liked')}
              style={{ ...s.actionBtn, color: isLiked ? "#ff4444" : "white" }}
            >
              <Heart size={18} fill={isLiked ? "#ff4444" : "none"} />
            </button>
            <button 
              onClick={(e) => handleToggle(e, 'saved')}
              style={{ ...s.actionBtn, color: isSaved ? "#4caf50" : "white" }}
            >
              {isSaved ? <Check size={18} /> : <Bookmark size={18} />}
            </button>
          </div>
        </div>
      </Link>

      <style>{`
        .thumb-wrapper:hover .action-overlay { opacity: 1 !important; }
      `}</style>

      {/* DATA SECTION */}
      <div style={s.infoRow}>
        
        {/* Clickable Channel PFP */}
        <Link to={`/channel/${channelId}`} style={s.pfpLink}>
          <img src={channelPfp} alt={channelTitle} style={s.pfp} />
        </Link>

        <div style={s.metaCol}>
          {/* Clickable Title */}
          <Link to={isShort ? `/shorts/${videoId}` : `/video/${videoId}`} style={s.titleLink}>
            <h3 style={s.title}>{title}</h3>
          </Link>

          {/* Meta Data: Name • Views • Date */}
          <div style={s.metaData}>
            <Link to={`/channel/${channelId}`} style={s.channelLink}>
              {channelTitle}
            </Link>
            <span style={s.dot}>•</span>
            <span>{formattedViews} views</span>
            <span style={s.dot}>•</span>
            <span>{formattedDate}</span>
          </div>
        </div>

      </div>
    </div>
  );
}

const styles = (isShort) => ({
  cardContainer: { display: "flex", flexDirection: "column", gap: "12px", width: "100%", transition: "opacity 0.2s" },
  thumbLink: { textDecoration: "none" },
  thumbWrapper: { 
    position: "relative", 
    aspectRatio: isShort ? "9/16" : "16/9", 
    borderRadius: "12px", 
    overflow: "hidden", 
    background: "#222" 
  },
  actionOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    background: "linear-gradient(to bottom, rgba(0,0,0,0.4), transparent, rgba(0,0,0,0.4))",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    padding: "8px",
    gap: "8px",
    opacity: 0,
    transition: "opacity 0.2s ease",
    zIndex: 10
  },
  actionBtn: {
    background: "rgba(0,0,0,0.6)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "50%",
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    backdropFilter: "blur(4px)",
    transition: "all 0.2s ease"
  },
  img: { width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.2s" },
  durationBadge: { position: "absolute", bottom: "8px", right: "8px", background: "rgba(0,0,0,0.85)", color: "white", padding: "4px 6px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold" },
  ytBadge: { position: "absolute", top: "8px", right: "8px", background: "rgba(0,0,0,0.6)", padding: "4px", borderRadius: "6px", display: "flex", backdropFilter: "blur(4px)" },
  infoRow: { display: "flex", gap: "12px", alignItems: "flex-start" },
  pfpLink: { flexShrink: 0 },
  pfp: { width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", border: "1px solid #333" },
  metaCol: { display: "flex", flexDirection: "column", gap: "4px", overflow: "hidden" },
  titleLink: { textDecoration: "none", color: "white" },
  title: { fontSize: "16px", fontWeight: "600", margin: 0, lineHeight: "1.4", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
  metaData: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: "4px", fontSize: "13px", color: "#aaa", fontWeight: "500" },
  channelLink: { color: "#aaa", textDecoration: "none", transition: "color 0.2s" },
  dot: { margin: "0 4px", fontSize: "10px", opacity: 0.5 }
});

export default VideoCard;
