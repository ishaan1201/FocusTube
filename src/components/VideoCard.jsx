import { Link } from "react-router-dom";
import { Play } from "lucide-react";

function VideoCard({ video, isShort = false }) {
    const videoId = video.id?.videoId || video.id;
    const { title, channelTitle, thumbnails, publishedAt } = video.snippet;
    const duration = video.duration || "0:00";

    // Decide where to link: /shorts/:id for shorts, /video/:id for standard
    const linkTo = isShort ? `/shorts/${videoId}` : `/video/${videoId}`;

    if (isShort) {
        return (
            <Link to={linkTo} style={styles.shortCard}>
                <div style={styles.shortPoster}>
                    <img src={thumbnails.high.url} alt={title} style={styles.img} />
                    <div style={styles.shortOverlay}>
                        <Play size={24} fill="white" />
                    </div>
                </div>
                <h4 style={styles.shortTitle}>{title}</h4>
            </Link>
        );
    }

    // Standard Video Card (Similar to existing Home styling but reusable)
    return (
        <Link to={linkTo} style={styles.card}>
            <div style={styles.thumbnailWrapper}>
                <img src={thumbnails.high.url} alt={title} style={styles.img} />
                <div style={styles.badge}>{duration}</div>
            </div>
            <div style={styles.meta}>
                <h3 style={styles.title}>{title}</h3>
                <p style={styles.channel}>{channelTitle}</p>
                <span style={styles.date}>{new Date(publishedAt).getFullYear()}</span>
            </div>
        </Link>
    );
}

const styles = {
    // Common
    img: { width: "100%", height: "100%", objectFit: "cover" },

    // Standard Card
    card: { textDecoration: "none", color: "white", display: "flex", flexDirection: "column", gap: "10px" },
    thumbnailWrapper: { position: "relative", aspectRatio: "16/9", borderRadius: "12px", overflow: "hidden", background: "#222" },
    badge: {
        position: "absolute", bottom: "8px", right: "8px",
        background: "rgba(0,0,0,0.85)", color: "white",
        padding: "4px 8px", borderRadius: "6px",
        fontSize: "12px", fontWeight: "bold"
    },
    meta: { display: "flex", flexDirection: "column", gap: "4px" },
    title: { fontSize: "15px", fontWeight: "600", margin: "0", lineHeight: "1.4", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
    channel: { fontSize: "12px", color: "#aaa", margin: 0 },
    date: { fontSize: "11px", color: "#666" },

    // Short Card
    shortCard: { textDecoration: "none", color: "white", display: "flex", flexDirection: "column", gap: "8px" },
    shortPoster: { aspectRatio: "9/16", borderRadius: "12px", overflow: "hidden", position: "relative" },
    shortOverlay: {
        position: "absolute", inset: 0,
        background: "rgba(0,0,0,0.1)",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "background 0.2s"
    },
    shortTitle: { fontSize: "14px", fontWeight: "600", margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }
};

export default VideoCard;
