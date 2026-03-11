import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import YouTube from "react-youtube";
import { Heart, Share2, Bookmark, ArrowLeft, Check, Volume2, VolumeX } from "lucide-react";
import { fetchSearchVideos, fetchVideoDetails, fetchChannelDetails } from "../services/youtube";
import { toggleVault, isInVault } from "../utils/storage";

function ShortsPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [videos, setVideos] = useState([]);
  const [pageToken, setPageToken] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [globalMute, setGlobalMute] = useState(true);

  useEffect(() => {
    const loadInitialFeed = async () => {
      setLoading(true);
      let initialFeed = [];
      if (id) {
        const targetVideo = await fetchVideoDetails(id);
        if (targetVideo) {
          if (targetVideo.snippet?.channelId) {
            try {
              const cData = await fetchChannelDetails(targetVideo.snippet.channelId);
              targetVideo.channelThumbnail = cData?.snippet?.thumbnails?.default?.url;
            } catch (err) {}
          }
          initialFeed.push(targetVideo);
        }
      }

      const data = await fetchSearchVideos("science | coding | tech | facts", "", "short");
      const filteredItems = data.items.filter(v => (v.id?.videoId || v.id) !== id);
      
      setVideos([...initialFeed, ...filteredItems]);
      setPageToken(data.nextPageToken);
      setLoading(false);
    };
    loadInitialFeed();
  }, [id]);

  const loadMore = async () => {
    if (!pageToken) return;
    const data = await fetchSearchVideos("science | coding | tech | facts", pageToken, "short");
    setVideos(prev => [...prev, ...data.items]);
    setPageToken(data.nextPageToken);
  };

  const observer = useRef(null);
  const videoRefs = useRef([]);

  useEffect(() => {
    observer.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = Number(entry.target.dataset.index);
          setActiveIndex(index);
          if (index >= videos.length - 2) loadMore();
        }
      });
    }, { threshold: 0.6 });

    videoRefs.current.forEach((ref) => {
      if (ref) observer.current.observe(ref);
    });

    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [videos]);

  return (
    <div style={styles.container}>
      <button onClick={() => navigate(-1)} style={styles.backBtn}>
        <ArrowLeft size={24} />
      </button>

      <div style={styles.feedWrapper}>
        {loading && videos.length === 0 ? (
          <div style={styles.loadingScreen}>Tuning into frequencies...</div>
        ) : (
          videos.map((video, index) => (
            <div key={index} data-index={index} ref={(el) => (videoRefs.current[index] = el)} style={styles.snapSection}>
              <ShortSlide 
                video={video} 
                isActive={index === activeIndex} 
                globalMute={globalMute}
                setGlobalMute={setGlobalMute}
                index={index}
                activeIndex={activeIndex}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 🎬 INDIVIDUAL SHORT SLIDE COMPONENT
// ----------------------------------------------------------------------
function ShortSlide({ video, isActive, globalMute, setGlobalMute, index, activeIndex }) {
  const videoId = video.id?.videoId || video.id;
  
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  
  const [isReady, setIsReady] = useState(false);
  const playerRef = useRef(null);

  const shouldRenderIframe = Math.abs(index - activeIndex) <= 1;

  const rawDescription = video.snippet?.description || "No description provided.";
  const isLongDesc = rawDescription.length > 120;

  useEffect(() => {
    setIsSaved(isInVault(videoId));
    const liked = JSON.parse(localStorage.getItem("liked_videos") || "[]");
    setIsLiked(!!liked.find(v => v.id === videoId));
  }, [videoId]);

  useEffect(() => {
    if (isReady && playerRef.current) {
      try {
        if (isActive) {
          playerRef.current.playVideo();
          if (globalMute) playerRef.current.mute();
          else playerRef.current.unMute();
        } else {
          playerRef.current.pauseVideo();
          setDescExpanded(false); // Auto-collapse if user scrolls away
        }
      } catch (err) {}
    }
  }, [isActive, globalMute, isReady]);

  const onPlayerReady = (e) => {
    playerRef.current = e.target;
    setIsReady(true);
    if (isActive) {
      try {
        e.target.playVideo();
        if (globalMute) e.target.mute();
        else e.target.unMute();
      } catch(err) {}
    }
  };

  const toggleSave = () => {
    const videoObj = { id: videoId, title: video.snippet.title, thumbnail: video.snippet.thumbnails.high?.url, channel: video.snippet.channelTitle };
    setIsSaved(toggleVault(videoObj));
  };

  const toggleLike = () => {
    const liked = JSON.parse(localStorage.getItem("liked_videos") || "[]");
    const newVideo = { id: videoId, title: video.snippet.title, thumbnail: video.snippet.thumbnails.high?.url, channel: video.snippet.channelTitle };
    const updated = isLiked ? liked.filter(v => v.id !== videoId) : [newVideo, ...liked];
    localStorage.setItem("liked_videos", JSON.stringify(updated));
    setIsLiked(!isLiked);
  };

  const toggleMute = () => {
    setGlobalMute(!globalMute);
    if (isReady && playerRef.current) {
      try {
        if (!globalMute) playerRef.current.mute();
        else playerRef.current.unMute();
      } catch(e) {}
    }
  };

  const handleVideoTap = () => {
    if (isReady && playerRef.current) {
      try {
        const state = playerRef.current.getPlayerState();
        if (state === 1) playerRef.current.pauseVideo();
        else playerRef.current.playVideo();
      } catch(e) {}
    }
  };

  const opts = {
    height: '100%', width: '100%',
    playerVars: { 
      autoplay: isActive ? 1 : 0, controls: 0, modestbranding: 1, rel: 0, 
      loop: 1, playlist: videoId, playsinline: 1, mute: globalMute ? 1 : 0 
    },
  };

  const defaultPfpSVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";
  const channelPfp = video.channelThumbnail || defaultPfpSVG;

  return (
    <div style={styles.slideLayout}>
      
      {/* ⬅️ LEFT COLUMN: Video Info */}
      <div style={styles.leftPanel}>
        <div style={styles.channelRow}>
          <Link to={`/channel/${video.snippet.channelId}`} style={styles.channelLink}>
            <img src={channelPfp} style={styles.pfp} alt="Channel" />
            <span style={styles.channelName}>@{video.snippet.channelTitle}</span>
          </Link>
          <button onClick={() => setIsSubscribed(!isSubscribed)} style={{...styles.subBtn, background: isSubscribed ? "transparent" : "white", color: isSubscribed ? "white" : "black"}}>
            {isSubscribed ? "Subscribed" : "Subscribe"}
          </button>
        </div>
        <h3 style={styles.title}>{video.snippet.title}</h3>
        
        {/* 🚀 THE FIX: Completely rebuilt description engine */}
        <div style={styles.descriptionBox}>
          <div style={{
            maxHeight: descExpanded ? "300px" : "none", // Hard limit when expanded
            overflowY: descExpanded ? "auto" : "hidden", // Scrollable when expanded
            paddingRight: descExpanded ? "6px" : "0" // Gives the scrollbar room to breathe
          }}>
            <p style={styles.descriptionText}>
              {descExpanded 
                ? rawDescription 
                : (isLongDesc ? rawDescription.slice(0, 120) + "..." : rawDescription)
              }
            </p>
          </div>
          {isLongDesc && (
            <button 
              onClick={(e) => {
                e.stopPropagation(); // Forces React to listen ONLY to this button
                setDescExpanded(!descExpanded);
              }} 
              style={styles.showMoreBtn}
            >
              {descExpanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      </div>

      {/* 🎯 CENTER COLUMN: The Video */}
      <div style={styles.slideContainer}>
        <div style={styles.playerWrapper}>
          {shouldRenderIframe ? (
            <YouTube 
              videoId={videoId} 
              opts={opts} 
              onReady={onPlayerReady} 
              style={{ height: "100%", width: "100%", pointerEvents: "none" }} 
            />
          ) : (
            <img 
              src={video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url} 
              style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.4 }} 
              alt="Loading" 
            />
          )}
          <div onClick={handleVideoTap} style={{ position: "absolute", inset: 0, zIndex: 2, cursor: "pointer" }} />
        </div>
      </div>

      {/* ➡️ RIGHT COLUMN: Action Buttons */}
      <div style={styles.rightPanel}>
        <button onClick={toggleLike} style={styles.actionBtn}>
          <div style={styles.iconCircle}><Heart size={26} color={isLiked ? "#ff4444" : "white"} fill={isLiked ? "#ff4444" : "transparent"} /></div>
          <span style={styles.actionText}>{isLiked ? "Liked" : "Like"}</span>
        </button>
        
        <button onClick={toggleSave} style={styles.actionBtn}>
          <div style={styles.iconCircle}>{isSaved ? <Check size={26} color="#4caf50" /> : <Bookmark size={26} color="white" />}</div>
          <span style={styles.actionText}>Save</span>
        </button>
        
        <button onClick={() => alert("Copied to clipboard!")} style={styles.actionBtn}>
          <div style={styles.iconCircle}><Share2 size={26} color="white" /></div>
          <span style={styles.actionText}>Share</span>
        </button>

        <button onClick={toggleMute} style={styles.actionBtn}>
          <div style={styles.iconCircle}>
            {globalMute ? <VolumeX size={26} color="#ff4444" /> : <Volume2 size={26} color="white" />}
          </div>
          <span style={styles.actionText}>{globalMute ? "Muted" : "Sound"}</span>
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 🎨 PREMIUM 3-COLUMN DASHBOARD STYLES
// ----------------------------------------------------------------------
const styles = {
  container: { position: "fixed", inset: 0, background: "#050505", zIndex: 3000 },
  backBtn: { position: "absolute", top: "24px", left: "24px", zIndex: 3010, background: "rgba(255, 255, 255, 0.1)", border: "1px solid rgba(255, 255, 255, 0.2)", color: "white", padding: "12px", borderRadius: "50%", cursor: "pointer", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" },
  feedWrapper: { height: "100vh", width: "100vw", overflowY: "scroll", scrollSnapType: "y mandatory", scrollBehavior: "smooth", msOverflowStyle: "none", scrollbarWidth: "none" },
  loadingScreen: { height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", color: "#888", fontSize: "16px", fontWeight: "bold", letterSpacing: "1px" },
  snapSection: { height: "100vh", width: "100vw", scrollSnapAlign: "start", display: "flex", justifyContent: "center", alignItems: "center", background: "#050505" },
  slideLayout: { display: "flex", alignItems: "flex-end", justifyContent: "center", gap: "40px", height: "100%", maxHeight: "850px", width: "100%", maxWidth: "1200px", padding: "20px" },
  
  // ⬅️ LEFT PANEL
  leftPanel: { display: "flex", flexDirection: "column", gap: "12px", paddingBottom: "30px", width: "350px", color: "white", zIndex: 10 },
  channelRow: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" },
  channelLink: { display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", color: "white" },
  pfp: { width: "48px", height: "48px", borderRadius: "50%", border: "2px solid #fff", background: "#222", objectFit: "cover" },
  channelName: { fontSize: "18px", fontWeight: "700" },
  subBtn: { padding: "8px 18px", borderRadius: "24px", border: "1px solid white", fontWeight: "bold", cursor: "pointer", fontSize: "13px", transition: "0.2s" },
  title: { fontSize: "20px", fontWeight: "600", margin: "0 0 4px 0", lineHeight: "1.3" },
  
  // 🚀 THE FIX: Polished UI for the description box
  descriptionBox: { background: "rgba(255, 255, 255, 0.05)", padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.1)", display: "flex", flexDirection: "column", gap: "6px", width: "100%" },
  descriptionText: { fontSize: "14px", color: "#ddd", margin: 0, lineHeight: "1.6", whiteSpace: "pre-wrap", wordBreak: "break-word" },
  showMoreBtn: { background: "none", border: "none", color: "#fff", fontWeight: "bold", fontSize: "13px", cursor: "pointer", textAlign: "left", padding: "4px 0 0 0", opacity: 0.9, pointerEvents: "auto" },

  // 🎯 CENTER PANEL
  slideContainer: { position: "relative", width: "100%", maxWidth: "420px", height: "100%", background: "#000", borderRadius: "20px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)", boxShadow: "0 20px 60px rgba(0,0,0,0.8)" },
  playerWrapper: { position: "absolute", inset: 0, display: "flex", justifyContent: "center", alignItems: "center", background: "#000" },
  
  // ➡️ RIGHT PANEL
  rightPanel: { display: "flex", flexDirection: "column", gap: "24px", paddingBottom: "30px", zIndex: 10 },
  actionBtn: { background: "none", border: "none", color: "white", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", cursor: "pointer", transition: "transform 0.2s" },
  iconCircle: { width: "52px", height: "52px", borderRadius: "50%", background: "#1a1a1a", border: "1px solid #333", display: "flex", justifyContent: "center", alignItems: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.5)" },
  actionText: { fontSize: "13px", fontWeight: "600", color: "#aaa" }
};

export default ShortsPlayer;