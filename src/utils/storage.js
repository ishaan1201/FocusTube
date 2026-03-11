// 📂 src/utils/storage.js

const HISTORY_KEY = "focus_history";
const VAULT_KEY = "focus_vault";
const NOTES_KEY = "focus_notes_index";

// --- HISTORY ---
export const addToHistory = (video) => {
  if (!video || !video.id) return;
  const history = getHistory();
  const filtered = history.filter(v => v.id !== video.id);

  // ✅ Explicitly save duration
  const newEntry = {
    id: video.id,
    title: video.title || video.snippet.title,
    thumbnail: video.thumbnail || video.snippet.thumbnails.high.url,
    channel: video.channel || video.snippet.channelTitle,
    duration: video.duration || "0:00",
    timestamp: Date.now()
  };

  const updated = [newEntry, ...filtered].slice(0, 50);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
};

export const getHistory = () => {
  return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
};

export const clearHistory = () => {
  localStorage.removeItem(HISTORY_KEY);
};

// --- VAULT (BOOKMARKS) ---
export const toggleVault = (video) => {
  if (!video || !video.id) return;
  const vault = getVault();
  const exists = vault.find(v => v.id === video.id);

  let updated;
  if (exists) {
    updated = vault.filter(v => v.id !== video.id);
  } else {
    // ✅ Explicitly save duration
    const newEntry = {
      id: video.id,
      title: video.title || video.snippet.title,
      thumbnail: video.thumbnail || video.snippet.thumbnails.high.url,
      channel: video.channel || video.snippet.channelTitle,
      duration: video.duration || "0:00",
      timestamp: Date.now()
    };
    updated = [newEntry, ...vault];
  }
  localStorage.setItem(VAULT_KEY, JSON.stringify(updated));
  return !exists;
};

export const getVault = () => {
  return JSON.parse(localStorage.getItem(VAULT_KEY) || "[]");
};

export const isInVault = (videoId) => {
  const vault = getVault();
  return vault.some(v => v.id === videoId);
};

// --- NOTES (Fixed for Compatibility) ---

// 1️⃣ Main Save Function (Called by VideoPage)
export const saveNote = (video, text) => {
  if (!video || !video.id) return;

  // Save the text content
  localStorage.setItem(`notes_doc_${video.id}`, text);

  // Update the Metadata Index
  saveNoteMetadata(video.id, video.title || video.snippet?.title);
};

// 2️⃣ Get Single Note (Called by VideoPage)
export const getNoteForVideo = (videoId) => {
  if (!videoId) return null;
  const text = localStorage.getItem(`notes_doc_${videoId}`);
  if (!text) return null;

  // Return in the format the UI expects
  return {
    videoId,
    text,
    date: Date.now() // Timestamps might be in index, but current is fine for display
  };
};

// 3️⃣ Get All Notes (Called by NotesPage)
export const getNotes = () => {
  const index = JSON.parse(localStorage.getItem(NOTES_KEY) || "{}");
  const notes = [];

  for (const vid in index) {
    const text = localStorage.getItem(`notes_doc_${vid}`) || "";
    notes.push({
      videoId: vid,
      videoTitle: index[vid].title || vid,
      date: index[vid].date || Date.now(),
      text
    });
  }

  // Sort newest first
  return notes.sort((a, b) => b.date - a.date);
};

// Helper: Updates just the title/date index
export const saveNoteMetadata = (videoId, title) => {
  if (!videoId) return;
  const index = JSON.parse(localStorage.getItem(NOTES_KEY) || "{}");
  index[videoId] = { title: title || videoId, date: Date.now() };
  localStorage.setItem(NOTES_KEY, JSON.stringify(index));
};

export const deleteNote = (videoId) => {
  if (!videoId) return;
  localStorage.removeItem(`notes_doc_${videoId}`);

  const index = JSON.parse(localStorage.getItem(NOTES_KEY) || "{}");
  if (index[videoId]) {
    delete index[videoId];
    localStorage.setItem(NOTES_KEY, JSON.stringify(index));
  }
};


// --- FOCUS TIME TRACKER (THE STOPWATCH) ---

export const logWatchTime = (seconds) => {
  const today = new Date().toDateString();
  const usage = JSON.parse(localStorage.getItem("focus_time_log") || "{}");
  
  // Add the new seconds to today's total
  usage[today] = (usage[today] || 0) + seconds;
  localStorage.setItem("focus_time_log", JSON.stringify(usage));
};

export const getFocusStats = () => {
  const usage = JSON.parse(localStorage.getItem("focus_time_log") || "{}");
  const now = new Date();
  const todayStr = now.toDateString();

  let totalSecs = 0;
  let todaySecs = usage[todayStr] || 0;
  let weeklyData = [0, 0, 0, 0, 0, 0, 0]; 

  for (const [dateStr, secs] of Object.entries(usage)) {
    totalSecs += secs;
    const logDate = new Date(dateStr);
    
    // Calculate how many days ago this was
    const diffTime = now.getTime() - logDate.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);

    // If it was within the last 7 days, add to the specific day's bucket
    if (diffDays >= 0 && diffDays < 7) {
      weeklyData[logDate.getDay()] += (secs / 60); // Convert to minutes for the chart
    }
  }

  return {
    totalMins: Math.round(totalSecs / 60),
    todayMins: Math.round(todaySecs / 60),
    weeklyData
  };
};