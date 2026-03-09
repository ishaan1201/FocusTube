import { Link } from "react-router-dom";
import { Youtube } from "lucide-react"; 

function VideoCard({ video, isShort = false }) {
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

  return (
    <div style={styles.cardContainer}>
      
      {/* THUMBNAIL SECTION */}
      <Link to={isShort ? `/shorts/${videoId}` : `/video/${videoId}`} style={styles.thumbLink}>
        <div style={styles.thumbWrapper}>
          <img src={thumbnails?.high?.url || thumbnails?.medium?.url} alt={title} style={styles.img} />
          
          <div style={styles.durationBadge}>{duration}</div>
          
          {/* Small YouTube Logo in the corner */}
          <div style={styles.ytBadge}>
            <Youtube size={16} color="white" fill="#ff0000" />
          </div>
        </div>
      </Link>

      {/* DATA SECTION */}
      <div style={styles.infoRow}>
        
        {/* Clickable Channel PFP */}
        <Link to={`/channel/${channelId}`} style={styles.pfpLink}>
          <img src={channelPfp} alt={channelTitle} style={styles.pfp} />
        </Link>

        <div style={styles.metaCol}>
          {/* Clickable Title */}
          <Link to={isShort ? `/shorts/${videoId}` : `/video/${videoId}`} style={styles.titleLink}>
            <h3 style={styles.title}>{title}</h3>
          </Link>

          {/* Meta Data: Name • Views • Date */}
          <div style={styles.metaData}>
            <Link to={`/channel/${channelId}`} style={styles.channelLink}>
              {channelTitle}
            </Link>
            <span style={styles.dot}>•</span>
            <span>{formattedViews} views</span>
            <span style={styles.dot}>•</span>
            <span>{formattedDate}</span>
          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  cardContainer: { display: "flex", flexDirection: "column", gap: "12px", width: "100%", transition: "opacity 0.2s" },
  thumbLink: { textDecoration: "none" },
  thumbWrapper: { position: "relative", aspectRatio: "16/9", borderRadius: "12px", overflow: "hidden", background: "#222" },
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
};

export default VideoCard;