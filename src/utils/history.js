export const updateWatchHistory = (video, seconds) => {
  const history = JSON.parse(localStorage.getItem("focus_history") || "[]");
  const videoId = video.id?.videoId || video.id;
  const existingIdx = history.findIndex(v => v.id === videoId);

  const item = {
    id: videoId,
    title: video.snippet.title,
    thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url,
    lastWatched: new Date().toISOString(),
    resumeTime: seconds,
    duration: video.duration || "0:00"
  };

  if (existingIdx > -1) history.splice(existingIdx, 1);
  history.unshift(item);
  localStorage.setItem("focus_history", JSON.stringify(history.slice(0, 50)));
};
