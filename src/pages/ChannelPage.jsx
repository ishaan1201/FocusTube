import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  fetchChannelDetails,
  fetchChannelVideosWithDuration,
  fetchChannelPlaylists,
  searchChannelSpecific
} from "../services/youtube";
import { Search, ArrowLeft, Radio, RefreshCw } from "lucide-react";
import useInfiniteScroll from "../hooks/useInfiniteScroll";

// ✅ SAFETY: Crash-proof duration formatter
const formatDuration = (d) => {
  if (!d) return "0:00";
  if (!d.includes("PT")) return d;

  const match = d.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return "0:00";

  const h = parseInt(match[1]) || 0;
  const m = parseInt(match[2]) || 0;
  const s = parseInt(match[3]) || 0;

  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

function ChannelPage() {
  const { id } = useParams();
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [activeTab, setActiveTab] = useState("Videos");
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  // Pagination State
  const [videoNextPageToken, setVideoNextPageToken] = useState("");
  const [playlistNextPageToken, setPlaylistNextPageToken] = useState("");
  const [searchNextPageToken, setSearchNextPageToken] = useState("");

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const loadData = async (isLoadMore = false) => {
    if (!isLoadMore) setLoading(true);
    try {
      if (!isLoadMore) {
        const [details, content, lists] = await Promise.all([
          fetchChannelDetails(id),
          fetchChannelVideosWithDuration(id),
          fetchChannelPlaylists(id)
        ]);
        setChannel(details);
        setVideos(content.items || []);
        setVideoNextPageToken(content.nextPageToken || "");
        setPlaylists(lists.items || []);
        setPlaylistNextPageToken(lists.nextPageToken || "");

        const followed = JSON.parse(localStorage.getItem("focus_following") || "[]");
        setIsFollowing(!!followed.find(c => c.id === id));
      } else {
        if (activeTab === "Playlists") {
          if (!playlistNextPageToken) return;
          const res = await fetchChannelPlaylists(id, playlistNextPageToken);
          setPlaylists(prev => [...prev, ...res.items]);
          setPlaylistNextPageToken(res.nextPageToken || "");
        } else if (activeTab === "Search") {
          if (!searchNextPageToken) return;
          const res = await searchChannelSpecific(id, searchQuery, searchNextPageToken);
          setSearchResults(prev => [...prev, ...res.items]);
          setSearchNextPageToken(res.nextPageToken || "");
        } else {
          if (!videoNextPageToken) return;
          const res = await fetchChannelVideosWithDuration(id, videoNextPageToken);
          setVideos(prev => [...prev, ...res.items]);
          setVideoNextPageToken(res.nextPageToken || "");
        }
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const handleLoadMore = useCallback(async () => {
    await loadData(true);
  }, [id, activeTab, videoNextPageToken, playlistNextPageToken, searchNextPageToken, searchQuery]);

  const [isFetching] = useInfiniteScroll(handleLoadMore);

  const toggleFollow = () => {
    if (!channel) return;
    const followed = JSON.parse(localStorage.getItem("focus_following") || "[]");
    let updated;
    if (isFollowing) {
      updated = followed.filter(c => c.id !== id);
    } else {
      updated = [...followed, {
        id,
        title: channel.snippet.title,
        thumbnail: channel.snippet.thumbnails.default.url
      }];
    }
    localStorage.setItem("focus_following", JSON.stringify(updated));
    setIsFollowing(!isFollowing);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setActiveTab("Search");
    setSearchNextPageToken("");

    const res = await searchChannelSpecific(id, searchQuery);
    setSearchResults(res.items || []);
    setSearchNextPageToken(res.nextPageToken || "");
    setIsSearching(false);
  };

  if (loading && videos.length === 0) return <div style={{ color: "white", padding: "40px", textAlign: "center" }}>Loading Channel...</div>;

  // 🚀 THE FIX: Advanced Filtering Engine for Videos, Shorts, and Live
  const getFilteredVideos = () => {
    if (activeTab === "Search" || activeTab === "Playlists") return [];

    return videos.filter(v => {
      const d = v.contentDetails?.duration || "";
      const isShort = d.includes("PT") && !d.includes("M") && !d.includes("H");
      
      // 🚀 DOUBLE-CHECK: Looks for actual live details OR the "live" broadcast tag
      const isLive = !!v.liveStreamingDetails || 
                     v.snippet?.liveBroadcastContent === "live" || 
                     v.snippet?.liveBroadcastContent === "upcoming";

      if (activeTab === "Shorts") return isShort && !isLive;
      if (activeTab === "Live") return isLive;
      if (activeTab === "Videos") return !isShort && !isLive; // Pure VODs only
      
      return true;
    });
  };

  const displayVideos = getFilteredVideos();

  return (
    <div style={styles.container}>

      <Link to="/classroom" style={styles.backBtn}>
        <ArrowLeft size={20} color="white" />
      </Link>

      <div style={{ ...styles.banner, backgroundImage: `url(${channel?.brandingSettings?.image?.bannerExternalUrl})` }} />

      <div style={styles.header}>
        <img src={channel?.snippet?.thumbnails?.high?.url} style={styles.avatar} alt="Avatar" />
        <div style={{ flex: 1 }}>
          <h1 style={styles.title}>{channel?.snippet?.title}</h1>
          <p style={{ color: "#aaa", margin: "5px 0" }}>
            {Number(channel?.statistics?.subscriberCount).toLocaleString()} subscribers
          </p>
        </div>

        <button
          onClick={toggleFollow}
          style={{
            ...styles.followBtn,
            background: isFollowing ? "#333" : "white",
            color: isFollowing ? "white" : "black"
          }}
        >
          {isFollowing ? "Following" : "Follow"}
        </button>
      </div>

      <div style={styles.navBar}>
        <div style={styles.tabGroup}>
          {["Videos", "Shorts", "Live", "Playlists", "Search"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ ...styles.tab, borderBottom: activeTab === tab ? "3px solid white" : "3px solid transparent", display: "flex", alignItems: "center", gap: "6px" }}
            >
              {tab === "Live" && <Radio size={16} color={activeTab === tab ? "#ff4444" : "inherit"} />}
              {tab}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} style={styles.searchBox}>
          <input
            type="text"
            placeholder="Search channel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
          <button type="submit" style={styles.searchIconBtn}>
            <Search size={18} />
          </button>
        </form>
      </div>

      <div style={styles.grid}>

        {activeTab === "Playlists" && (
          playlists.length > 0 ? (
            playlists.map(list => (
              <Link to={`/playlist/${list.id}`} key={list.id} style={styles.videoCard}>
                <div style={styles.thumbnailWrapper}>
                  <img src={list.snippet.thumbnails.high?.url} style={styles.thumbnail} alt="thumb" />
                  <div style={styles.playlistOverlay}>☰ {list.contentDetails.itemCount} Videos</div>
                </div>
                <h3 style={styles.videoTitle}>{list.snippet.title}</h3>
              </Link>
            ))
          ) : (
            <p style={styles.emptyMsg}>This channel has no public playlists.</p>
          )
        )}

        {/* 🚀 THE FIX: Mapping for Videos, Shorts, and Live */}
        {["Videos", "Shorts", "Live"].includes(activeTab) && (
          displayVideos.length > 0 ? (
            displayVideos.map((video) => {
              const vId = video.id.videoId || video.id;
              
              // Dynamic Routing based on tab
              let linkPath = `/video/${vId}`;
              if (activeTab === "Shorts") linkPath = `/shorts/${vId}`;
              if (activeTab === "Live") linkPath = `/live/${vId}`;

              const displayDuration = video.duration || formatDuration(video.contentDetails?.duration);
              const isCurrentlyLive = video.snippet?.liveBroadcastContent === "live";

              return (
                <Link to={linkPath} key={vId} style={styles.videoCard}>
                  <div style={activeTab === "Shorts" ? styles.shortsWrapper : styles.thumbnailWrapper}>
                    <img src={video.snippet.thumbnails.high?.url} style={styles.thumbnail} alt="thumb" />
                    
                    {/* Badge Rendering logic */}
                    {activeTab !== "Shorts" && (
                      <span style={isCurrentlyLive ? styles.liveBadge : styles.duration}>
                        {isCurrentlyLive ? "🔴 LIVE" : displayDuration}
                      </span>
                    )}
                  </div>
                  <h3 style={styles.videoTitle}>{video.snippet.title}</h3>
                </Link>
              );
            })
          ) : (
            <p style={styles.emptyMsg}>No {activeTab.toLowerCase()} found on this channel.</p>
          )
        )}

        {activeTab === "Search" && (
          isSearching ? (
            <p style={styles.emptyMsg}>Searching {channel.snippet.title}...</p>
          ) : searchResults.length > 0 ? (
            searchResults.map((video) => (
              <Link to={`/video/${video.id.videoId}`} key={video.id.videoId} style={styles.videoCard}>
                <div style={styles.thumbnailWrapper}>
                  <img src={video.snippet.thumbnails.high?.url} style={styles.thumbnail} alt="thumb" />
                  <span style={styles.duration}>{video.duration || formatDuration(video.contentDetails?.duration)}</span>
                </div>
                <h3 style={styles.videoTitle}>{video.snippet.title}</h3>
              </Link>
            ))
          ) : (
            <p style={styles.emptyMsg}>
              {searchQuery ? `No results for "${searchQuery}"` : "Search for any topic in this channel."}
            </p>
          )
        )}

      </div>

      {isFetching && (
        <div style={{ textAlign: "center", padding: "40px", color: "#aaa" }}>
          <RefreshCw size={24} style={{ animation: "spin 2s linear infinite", margin: "0 auto" }} />
          <p>Loading more content...</p>
        </div>
      )}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: { background: "#0f0f0f", minHeight: "100vh", color: "white", position: "relative" },
  backBtn: { position: "absolute", top: "20px", left: "20px", background: "rgba(0,0,0,0.6)", padding: "10px", borderRadius: "50%", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(5px)" },
  banner: { height: "200px", backgroundSize: "cover", backgroundPosition: "center", background: "#111" },
  header: { display: "flex", alignItems: "center", gap: "25px", padding: "30px 60px" },
  avatar: { width: "80px", height: "80px", borderRadius: "50%", border: "2px solid #333", objectFit: "cover" },
  title: { fontSize: "28px", fontWeight: "bold", margin: 0 },
  followBtn: { padding: "10px 24px", borderRadius: "24px", border: "none", fontWeight: "bold", fontSize: "16px", cursor: "pointer", transition: "0.2s" },
  navBar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 60px", borderBottom: "1px solid #222", flexWrap: "wrap", gap: "20px" },
  tabGroup: { display: "flex", gap: "30px" },
  tab: { background: "none", border: "none", padding: "15px 0", cursor: "pointer", color: "white", fontSize: "16px", fontWeight: "600", transition: "0.2s" },
  searchBox: { display: "flex", alignItems: "center", background: "#222", borderRadius: "20px", padding: "5px 15px", border: "1px solid #333" },
  searchInput: { background: "transparent", border: "none", color: "white", outline: "none", padding: "5px", width: "200px" },
  searchIconBtn: { background: "transparent", border: "none", color: "#aaa", cursor: "pointer", display: "flex", alignItems: "center" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "24px", padding: "40px 60px" },
  videoCard: { textDecoration: "none", color: "white" },
  thumbnailWrapper: { position: "relative", borderRadius: "12px", overflow: "hidden", aspectRatio: "16/9", background: "#222" },
  shortsWrapper: { position: "relative", borderRadius: "12px", overflow: "hidden", aspectRatio: "9/16", background: "#222" },
  thumbnail: { width: "100%", height: "100%", objectFit: "cover" },
  duration: { position: "absolute", bottom: "8px", right: "8px", background: "rgba(0,0,0,0.8)", padding: "2px 6px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold" },
  liveBadge: { position: "absolute", bottom: "8px", right: "8px", background: "#ff0000", color: "white", padding: "2px 6px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "4px" },
  playlistOverlay: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: "bold", backdropFilter: "blur(2px)" },
  videoTitle: { fontSize: "15px", fontWeight: "600", marginTop: "12px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: "1.4" },
  emptyMsg: { gridColumn: "1 / -1", textAlign: "center", color: "#666", marginTop: "40px", fontSize: "16px", fontWeight: "500" }
};

if (window.innerWidth < 768) {
  styles.header = { ...styles.header, padding: "20px", flexDirection: "column", alignItems: "flex-start", gap: "15px" };
  styles.navBar = { ...styles.navBar, padding: "0 20px" };
  styles.grid = { ...styles.grid, padding: "20px" };
  styles.searchInput = { ...styles.searchInput, width: "120px" };
}

export default ChannelPage;
