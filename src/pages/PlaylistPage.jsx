import { useState, useEffect } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { fetchPlaylistItems, fetchVideoDetails, fetchChannelDetails } from "../services/youtube";
import NotesPanel from "../components/addons/NotesPanel";
import { ThumbsUp, Plus, Share2, Check, ChevronDown, ChevronUp } from "lucide-react";

function PlaylistPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const vId = searchParams.get("v");
  const [items, setItems] = useState([]);
  const [video, setVideo] = useState(null);
  const [channel, setChannel] = useState(null); // ✅ Channel State
  const [isSaved, setIsSaved] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  const activeId = vId || items[0]?.contentDetails?.videoId;

  useEffect(() => { fetchPlaylistItems(id).then(setItems); }, [id]);

  useEffect(() => {
    if (activeId) {
      fetchVideoDetails(activeId).then(v => {
        setVideo(v);
        // ✅ FETCH CHANNEL DETAILS
        if(v?.snippet?.channelId) {
            fetchChannelDetails(v.snippet.channelId).then(c => {
                setChannel(c);
                const followed = JSON.parse(localStorage.getItem("focus_following") || "[]");
                setIsFollowing(!!followed.find(fc => fc.id === c.id));
            });
        }
        
        const saved = JSON.parse(localStorage.getItem("vault_videos") || "[]");
        setIsSaved(!!saved.find(sv => sv.id === activeId));
        
        const liked = JSON.parse(localStorage.getItem("liked_videos") || "[]");
        setIsLiked(!!liked.find(lv => lv.id === activeId));
      });
    }
  }, [activeId]);

  // ... (Toggle functions: Save, Like, Follow - kept same as before) ...
  const toggleFollow = () => {
    if (!channel) return;
    const followed = JSON.parse(localStorage.getItem("focus_following") || "[]");
    let updated;
    if (isFollowing) {
      updated = followed.filter(c => c.id !== channel.id);
    } else {
      updated = [...followed, { id: channel.id, title: channel.snippet.title, thumbnail: channel.snippet.thumbnails.default?.url }];
    }
    localStorage.setItem("focus_following", JSON.stringify(updated));
    setIsFollowing(!isFollowing);
  };
  
  const toggleSave = () => {
    const saved = JSON.parse(localStorage.getItem("vault_videos") || "[]");
    const newVideo = { id: activeId, title: video.snippet.title, thumbnail: video.snippet.thumbnails.high.url };
    const updated = isSaved ? saved.filter(v => v.id !== activeId) : [newVideo, ...saved];
    localStorage.setItem("vault_videos", JSON.stringify(updated));
    setIsSaved(!isSaved);
  };

  const toggleLike = () => {
    const liked = JSON.parse(localStorage.getItem("liked_videos") || "[]");
    const newVideo = { id: activeId, title: video.snippet.title, thumbnail: video.snippet.thumbnails.high.url };
    const updated = isLiked ? liked.filter(v => v.id !== activeId) : [newVideo, ...liked];
    localStorage.setItem("liked_videos", JSON.stringify(updated));
    setIsLiked(!isLiked);
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 60px)", background: "#0f0f0f", color: "white" }}>
      <div style={{ flex: 3, padding: "24px", overflowY: "auto" }}>
        {activeId && (
          <iframe 
            src={`https://www.youtube.com/embed/${activeId}?autoplay=1`} 
            style={{ width: "100%", aspectRatio: "16/9", borderRadius: "12px", border: "none" }} 
            allowFullScreen 
          />
        )}
        <h2 style={{ marginTop: "20px", fontSize: "20px" }}>{video?.snippet?.title}</h2>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "15px", borderBottom: "1px solid #222", paddingBottom: "15px" }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {/* ✅ CLICKABLE CHANNEL REDIRECT */}
            <Link to={`/channel/${video?.snippet?.channelId}`} style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", color: "white" }}>
              <img src={channel?.snippet?.thumbnails?.default?.url} style={{ width: "40px", height: "40px", borderRadius: "50%" }} />
              <div>
                <h4 style={{ margin: 0, fontSize: "14px" }}>{video?.snippet?.channelTitle}</h4>
                <p style={{ margin: 0, fontSize: "12px", color: "#aaa" }}>{channel?.statistics?.subscriberCount} subs</p>
              </div>
            </Link>
            
            <button 
                onClick={toggleFollow}
                style={{...styles.followBtn, background: isFollowing ? "#333" : "white", color: isFollowing ? "white" : "black"}}
            >
                {isFollowing ? "Following" : "Follow"}
            </button>
          </div>
          
          <div style={{ display: "flex", gap: "10px" }}>
            <button style={{...styles.btn, background: isLiked ? "white" : "#222", color: isLiked ? "black" : "white"}} onClick={toggleLike}>
              <ThumbsUp size={18} /> {isLiked ? "Liked" : "Like"}
            </button>
            <button style={{...styles.btn, background: isSaved ? "white" : "#222", color: isSaved ? "black" : "white"}} onClick={toggleSave}>
              {isSaved ? <Check size={18} /> : <Plus size={18} />} Save
            </button>
            <button style={styles.btn} onClick={() => { navigator.clipboard.writeText(window.location.href); alert("Copied!"); }}>
              <Share2 size={18} /> Share
            </button>
          </div>
        </div>

        <div style={{ marginTop: "15px", background: "#1a1a1a", padding: "15px", borderRadius: "12px", fontSize: "14px", lineHeight: "1.5" }}>
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>
            {descExpanded ? video?.snippet?.description : video?.snippet?.description?.slice(0, 150) + "..."}
          </p>
          <button onClick={() => setDescExpanded(!descExpanded)} style={styles.showMoreBtn}>
            {descExpanded ? "Show Less" : "Show More"} {descExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>
      
      <div style={{ flex: 1.2, borderLeft: "1px solid #222", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, padding: "10px", overflowY: "auto", borderBottom: "1px solid #222" }}>
          <h3 style={{ fontSize: "16px", padding: "10px", margin: 0 }}>Up Next</h3>
          {items.map(item => (
            <Link 
              to={`/playlist/${id}?v=${item.contentDetails.videoId}`} 
              key={item.id} 
              style={{...styles.item, background: activeId === item.contentDetails.videoId ? "#222" : "transparent"}}
            >
              <img src={item.snippet.thumbnails.default.url} style={{ width: "100px", borderRadius: "8px" }} />
              <p style={{ fontSize: "12px", margin: 0, fontWeight: "500", color: activeId === item.contentDetails.videoId ? "white" : "#aaa" }}>
                {item.snippet.title.slice(0, 50)}...
              </p>
            </Link>
          ))}
        </div>
        <div style={{ flex: 1, padding: "10px" }}>
           <NotesPanel videoId={activeId} videoTitle={video?.snippet?.title} />
        </div>
      </div>
    </div>
  );
}

const styles = {
  btn: { background: "#222", color: "white", padding: "8px 16px", borderRadius: "20px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: "600" },
  followBtn: { padding: "6px 14px", borderRadius: "20px", border: "none", fontWeight: "bold", fontSize: "12px", marginLeft: "10px", cursor: "pointer" },
  item: { display: "flex", gap: "10px", padding: "8px", textDecoration: "none", borderRadius: "8px", marginBottom: "5px" },
  showMoreBtn: { background: "none", border: "none", color: "white", marginTop: "10px", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: "5px" }
};

export default PlaylistPage;