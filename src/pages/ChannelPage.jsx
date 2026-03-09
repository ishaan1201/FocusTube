import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  fetchChannelDetails,
  fetchChannelVideosWithDuration,
  fetchChannelPlaylists,
  searchChannelSpecific
} from "../services/youtube";
import { Search, ArrowLeft } from "lucide-react";

// ✅ SAFETY: Crash-proof duration formatter
const formatDuration = (d) => {
  if (!d) return "0:00";

  // If it doesn't contain 'PT', it is likely already formatted. Return it as is.
  if (!d.includes("PT")) return d;

  const match = d.match(/PT(\d+H)?(\d+M)?(\d+S)?/);

  // 🛡️ SAFETY CHECK: If regex fails to match, return '0:00' instead of crashing
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

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [details, content, lists] = await Promise.all([
          fetchChannelDetails(id),
          fetchChannelVideosWithDuration(id),
          fetchChannelPlaylists(id)
        ]);
        setChannel(details);
        setVideos(content);
        setPlaylists(lists);

        const followed = JSON.parse(localStorage.getItem("focus_following") || "[]");
        setIsFollowing(!!followed.find(c => c.id === id));
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    if (id) loadData();
  }, [id]);

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

    const results = await searchChannelSpecific(id, searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  if (loading) return <div style={{ color: "white", padding: "40px", textAlign: "center" }}>Loading Channel...</div>;

  const filteredVideos = activeTab === "Shorts"
    ? videos.filter(v => {
      const d = v.contentDetails?.duration || "";
      return d.includes("PT") && !d.includes("M") && !d.includes("H");
    })
    : videos;

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
          {["Videos", "Shorts", "Playlists", "Search"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ ...styles.tab, borderBottom: activeTab === tab ? "3px solid white" : "3px solid transparent" }}
            >
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
          playlists.map(list => (
            <Link to={`/playlist/${list.id}`} key={list.id} style={styles.videoCard}>
              <div style={styles.thumbnailWrapper}>
                <img src={list.snippet.thumbnails.high?.url} style={styles.thumbnail} alt="thumb" />
                <div style={styles.playlistOverlay}>☰ {list.contentDetails.itemCount} Videos</div>
              </div>
              <h3 style={styles.videoTitle}>{list.snippet.title}</h3>
            </Link>
          ))
        )}

        {(activeTab === "Videos" || activeTab === "Shorts") && (
          filteredVideos.map((video) => {
            const vId = video.id.videoId || video.id;
            const linkPath = activeTab === "Shorts" ? `/shorts/${vId}` : `/video/${vId}`;

            // Use existing formatted duration OR format it if raw
            const displayDuration = video.duration || formatDuration(video.contentDetails?.duration);

            return (
              <Link to={linkPath} key={vId} style={styles.videoCard}>
                <div style={activeTab === "Shorts" ? styles.shortsWrapper : styles.thumbnailWrapper}>
                  <img src={video.snippet.thumbnails.high?.url} style={styles.thumbnail} alt="thumb" />
                  {activeTab !== "Shorts" && (
                    <span style={styles.duration}>{displayDuration}</span>
                  )}
                </div>
                <h3 style={styles.videoTitle}>{video.snippet.title}</h3>
              </Link>
            );
          })
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
    </div>
  );
}

const styles = {
  container: { background: "#0f0f0f", minHeight: "100vh", color: "white", position: "relative" },
  backBtn: { position: "absolute", top: "20px", left: "20px", background: "rgba(0,0,0,0.6)", padding: "10px", borderRadius: "50%", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center" },
  banner: { height: "200px", backgroundSize: "cover", backgroundPosition: "center", background: "#111" },
  header: { display: "flex", alignItems: "center", gap: "25px", padding: "30px 60px" },
  avatar: { width: "80px", height: "80px", borderRadius: "50%", border: "2px solid #0f0f0f" },
  title: { fontSize: "28px", fontWeight: "bold", margin: 0 },
  followBtn: { padding: "10px 24px", borderRadius: "24px", border: "none", fontWeight: "bold", fontSize: "16px", cursor: "pointer", transition: "0.2s" },
  navBar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 60px", borderBottom: "1px solid #222", flexWrap: "wrap", gap: "20px" },
  tabGroup: { display: "flex", gap: "30px" },
  tab: { background: "none", border: "none", padding: "15px 0", cursor: "pointer", color: "white", fontSize: "16px", fontWeight: "500" },
  searchBox: { display: "flex", alignItems: "center", background: "#222", borderRadius: "20px", padding: "5px 15px", border: "1px solid #333" },
  searchInput: { background: "transparent", border: "none", color: "white", outline: "none", padding: "5px", width: "200px" },
  searchIconBtn: { background: "transparent", border: "none", color: "#aaa", cursor: "pointer", display: "flex", alignItems: "center" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "24px", padding: "40px 60px" },
  videoCard: { textDecoration: "none", color: "white" },
  thumbnailWrapper: { position: "relative", borderRadius: "12px", overflow: "hidden", aspectRatio: "16/9" },
  shortsWrapper: { position: "relative", borderRadius: "12px", overflow: "hidden", aspectRatio: "9/16" },
  thumbnail: { width: "100%", height: "100%", objectFit: "cover" },
  duration: { position: "absolute", bottom: "8px", right: "8px", background: "rgba(0,0,0,0.8)", padding: "2px 6px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold" },
  playlistOverlay: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" },
  videoTitle: { fontSize: "14px", fontWeight: "600", marginTop: "12px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
  emptyMsg: { gridColumn: "1 / -1", textAlign: "center", color: "#666", marginTop: "40px", fontSize: "18px" }
};

if (window.innerWidth < 768) {
  styles.header = { ...styles.header, padding: "20px", flexDirection: "column", alignItems: "flex-start", gap: "15px" };
  styles.navBar = { ...styles.navBar, padding: "0 20px" };
  styles.grid = { ...styles.grid, padding: "20px" };
  styles.searchInput = { ...styles.searchInput, width: "120px" };
}

export default ChannelPage;