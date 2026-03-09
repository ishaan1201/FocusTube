import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { fetchSearchVideos, fetchChannelDetails } from "../services/youtube";
import useInfiniteScroll from "../hooks/useInfiniteScroll";
import { GraduationCap, Microscope, Calculator, PlayCircle, Pin, Trash2 } from "lucide-react";

const CLASSES = [
  "Class 5", "Class 6", "Class 7", "Class 8",
  "Class 9", "Class 10", "Class 11", "Class 12",
  "JEE", "NEET"
];

function Classroom() {
  const [selectedClass, setSelectedClass] = useState("Class 10");
  const [videos, setVideos] = useState([]);
  const [pinnedChannels, setPinnedChannels] = useState([]); // 📌 Only for the SELECTED class
  const [nextPageToken, setNextPageToken] = useState("");
  const [initialLoading, setInitialLoading] = useState(false);

  // 🔄 LOAD PINS FOR SELECTED CLASS
  useEffect(() => {
    // Get the big object { "Class 10": [...], "JEE": [...] }
    const allPins = JSON.parse(localStorage.getItem("class_pinned_map") || "{}");
    // Only set the state to the array for the CURRENT class
    setPinnedChannels(allPins[selectedClass] || []);
  }, [selectedClass]);

  // 📌 PINNING LOGIC (Specific to selectedClass)
  const togglePin = async (video) => {
    const channelId = video.snippet.channelId;
    const isPinned = pinnedChannels.find(c => c.id === channelId);

    // 1. Get current full map from storage
    const allPins = JSON.parse(localStorage.getItem("class_pinned_map") || "{}");
    let currentClassList = allPins[selectedClass] || [];

    if (isPinned) {
      // Remove Pin
      currentClassList = currentClassList.filter(c => c.id !== channelId);
    } else {
      // Add Pin
      let logoUrl = `https://ui-avatars.com/api/?name=${video.snippet.channelTitle}&background=random&color=fff`;

      try {
        const details = await fetchChannelDetails(channelId);
        if (details?.snippet?.thumbnails?.default?.url) {
          logoUrl = details.snippet.thumbnails.default.url;
        }
      } catch (e) { console.warn("Could not fetch logo, using fallback"); }

      const newChannel = {
        id: channelId,
        name: video.snippet.channelTitle,
        logo: logoUrl
      };

      currentClassList = [newChannel, ...currentClassList];
    }

    // 2. Update State (So UI reflects immediately)
    setPinnedChannels(currentClassList);

    // 3. Save back to the specific slot in the map
    allPins[selectedClass] = currentClassList;
    localStorage.setItem("class_pinned_map", JSON.stringify(allPins));
  };

  const scrollRef = useRef(null);
  const getQuery = (cls) => {
    if (cls === "JEE") return "JEE Mains Advanced physics chemistry maths one shot lecture";
    if (cls === "NEET") return "NEET biology physics chemistry one shot lecture";
    return `${cls} science math english social studies chapter explanation one shot`;
  };

  useEffect(() => {
    if (!selectedClass) return;
    const loadInitial = async () => {
      setInitialLoading(true);
      setVideos([]);
      const query = getQuery(selectedClass);
      const data = await fetchSearchVideos(query, "", "long");
      setVideos(data.items);
      setNextPageToken(data.nextPageToken || "");
      setInitialLoading(false);
    };
    loadInitial();
  }, [selectedClass]);

  const fetchMoreVideos = useCallback(async () => {
    if (!nextPageToken || !selectedClass) return;
    const query = getQuery(selectedClass);
    const data = await fetchSearchVideos(query, nextPageToken, "long");
    setVideos(prev => [...prev, ...data.items]);
    setNextPageToken(data.nextPageToken || "");
  }, [nextPageToken, selectedClass]);

  const [isFetching] = useInfiniteScroll(fetchMoreVideos);

  return (
    <div style={styles.pageContainer}>

      {/* 🔮 HERO HEADER */}
      <div style={styles.heroSection}>
        <h1 style={styles.gradientTitle}>FocusTube Academy</h1>
        <p style={{ color: "#aaa", margin: 0 }}>Distraction-free learning environment.</p>
      </div>

      {/* 🧭 STICKY CLASS NAV */}
      <div style={styles.stickyNav}>
        <div style={styles.scrollWrapper} ref={scrollRef}>
          {CLASSES.map((cls) => {
            const isActive = selectedClass === cls;
            return (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                style={isActive ? styles.activeTab : styles.inactiveTab}
              >
                {cls === "JEE" ? <Calculator size={16} /> :
                  cls === "NEET" ? <Microscope size={16} /> :
                    <GraduationCap size={16} />}
                {cls}
              </button>
            );
          })}
        </div>
      </div>

      <div style={styles.contentArea}>

        {/* 🌟 PINNED CHANNELS BAR (Specific to this Class) */}
        {pinnedChannels.length > 0 && (
          <div style={styles.channelSection}>
            <h3 style={styles.sectionTitle}>
              My <span style={{ color: "#4caf50" }}>{selectedClass}</span> Educators
            </h3>
            <div style={styles.channelScroll}>
              {pinnedChannels.map((ch) => (
                <div key={ch.id} style={{ position: "relative" }}>
                  <Link to={`/channel/${ch.id}`} style={styles.channelBubble}>
                    <img
                      src={ch.logo}
                      style={{ ...styles.channelLogo, borderColor: "#4caf50" }}
                      alt={ch.name}
                    />
                    <span style={{ ...styles.channelLabel, color: "#4caf50" }}>
                      {ch.name.slice(0, 14)}{ch.name.length > 14 && ".."}
                    </span>
                  </Link>
                  {/* Unpin Button */}
                  <button
                    onClick={() => togglePin({ snippet: { channelId: ch.id } })}
                    style={styles.removePinBtn}
                  >
                    <Trash2 size={10} color="white" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 📚 VIDEO GRID */}
        <h2 style={styles.sectionTitle}>Recommended Lessons</h2>

        {initialLoading ? (
          <div style={styles.loaderBox}>
            <div className="spinner"></div>
            <p>Curating best videos for you...</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {videos.map((video, index) => {
              // Check if pinned IN THIS CLASS specifically
              const isPinned = pinnedChannels.find(p => p.id === video.snippet.channelId);

              return (
                <div key={`${video.id.videoId}-${index}`} style={styles.card}>

                  {/* Thumbnail */}
                  <Link to={`/video/${video.id.videoId}`} style={{ textDecoration: 'none' }}>
                    <div style={styles.thumbWrapper}>
                      <img src={video.snippet.thumbnails.high?.url} style={styles.img} alt="thumbnail" />
                      <div style={styles.durationBadge}>{video.duration}</div>
                      <div style={styles.playOverlay}>
                        <PlayCircle size={40} color="white" fill="rgba(0,0,0,0.5)" />
                      </div>
                    </div>
                  </Link>

                  {/* Info Section */}
                  <div style={styles.cardInfo}>
                    <Link to={`/video/${video.id.videoId}`} style={{ textDecoration: 'none', color: 'white' }}>
                      <h3 style={styles.cardTitle}>{video.snippet.title.slice(0, 60)}...</h3>
                    </Link>

                    <div style={styles.cardMeta}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                        {/* Channel Link */}
                        <Link to={`/channel/${video.snippet.channelId}`} style={styles.channelLink}>
                          {video.snippet.channelTitle}
                        </Link>

                        {/* 📌 PIN BUTTON */}
                        <button
                          onClick={() => togglePin(video)}
                          title={isPinned ? "Unpin from this Class" : "Pin to this Class"}
                          style={{
                            background: "transparent", border: "none", cursor: "pointer",
                            padding: "4px", display: "flex", alignItems: "center"
                          }}
                        >
                          <Pin
                            size={14}
                            fill={isPinned ? "#4caf50" : "none"}
                            color={isPinned ? "#4caf50" : "#666"}
                          />
                        </button>
                      </div>

                      <span>{video.views ? Number(video.views).toLocaleString() : "Unknown"} views</span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {isFetching && !initialLoading && (
          <div style={{ textAlign: "center", padding: "30px", opacity: 0.7 }}>
            <p>Loading more...</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  pageContainer: { minHeight: "100vh", background: "#0a0a0a", color: "white", paddingBottom: "50px" },
  heroSection: { textAlign: "center", padding: "40px 20px 20px", background: "radial-gradient(circle at top, #1a2a3a 0%, #0a0a0a 100%)" },
  gradientTitle: { fontSize: "32px", fontWeight: "900", marginBottom: "8px", background: "linear-gradient(90deg, #4caf50, #2196f3)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },

  stickyNav: { position: "sticky", top: 0, zIndex: 100, background: "rgba(10, 10, 10, 0.95)", backdropFilter: "blur(10px)", borderBottom: "1px solid #222", padding: "15px 0" },
  scrollWrapper: { display: "flex", gap: "12px", overflowX: "auto", padding: "0 20px", scrollbarWidth: "none", alignItems: "center" },

  activeTab: { background: "#4caf50", color: "white", border: "none", padding: "10px 20px", borderRadius: "30px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 4px 15px rgba(76, 175, 80, 0.3)", transition: "all 0.3s ease", transform: "scale(1.05)" },
  inactiveTab: { background: "#1a1a1a", color: "#888", border: "1px solid #333", padding: "10px 20px", borderRadius: "30px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s ease" },

  contentArea: { maxWidth: "1400px", margin: "0 auto", padding: "20px" },
  sectionTitle: { fontSize: "18px", marginBottom: "15px", fontWeight: "700", color: "#ddd" },

  // 🌟 CHANNEL SECTION
  channelSection: { marginBottom: "40px" },
  channelScroll: { display: "flex", gap: "20px", overflowX: "auto", paddingBottom: "10px", scrollbarWidth: "thin" },
  channelBubble: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
    textDecoration: "none", color: "white", minWidth: "80px", cursor: "pointer",
    transition: "transform 0.2s"
  },
  channelLogo: { width: "64px", height: "64px", borderRadius: "50%", border: "2px solid", objectFit: "cover", background: "#222" },
  channelLabel: { fontSize: "11px", textAlign: "center", fontWeight: "500" },
  removePinBtn: {
    position: "absolute", top: 0, right: 10, background: "rgba(255,0,0,0.8)",
    border: "none", borderRadius: "50%", width: "18px", height: "18px",
    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
  },

  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "25px" },

  card: { background: "#161616", borderRadius: "16px", overflow: "hidden", border: "1px solid #222", display: "flex", flexDirection: "column" },
  thumbWrapper: { position: "relative", aspectRatio: "16/9", overflow: "hidden" },
  img: { width: "100%", height: "100%", objectFit: "cover" },
  durationBadge: { position: "absolute", bottom: "8px", right: "8px", background: "rgba(0,0,0,0.85)", color: "white", padding: "3px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold" },
  playOverlay: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)", opacity: 0, transition: "opacity 0.2s" },

  cardInfo: { padding: "14px", flex: 1, display: "flex", flexDirection: "column" },
  cardTitle: { fontSize: "15px", fontWeight: "600", lineHeight: "1.4", marginBottom: "8px" },
  cardMeta: { marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", color: "#888", fontSize: "13px" },
  channelLink: { color: "#aaa", fontWeight: "500", textDecoration: "none", borderBottom: "1px solid transparent", transition: "all 0.2s" },
  loaderBox: { textAlign: "center", padding: "100px 0", color: "#666" }
};

styles.channelLink[':hover'] = { color: "#fff", borderBottom: "1px solid #fff" };

export default Classroom;