import axios from 'axios';
import { getUserPreferences } from '../utils/localization';

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

// ----------------------------------------------------------------------
// 🚨 MOCK DATA GENERATOR
// ----------------------------------------------------------------------
const getMockVideos = (count, type = 'video') => {
  return Array(count).fill(0).map((_, i) => ({
    id: { videoId: `mock_${type}_${i}` },
    snippet: {
      title: `Mock ${type} Title ${i + 1} (API Quota Exceeded)`,
      channelTitle: "Curio Academy",
      thumbnails: { high: { url: `https://picsum.photos/seed/${i}/640/360` } },
      description: "Placeholder due to API quota limit.",
      liveBroadcastContent: type === 'live' ? 'live' : 'none',
      publishedAt: new Date().toISOString(),
      channelId: `mock_channel_${i}`
    },
    contentDetails: { duration: type === 'short' ? 'PT45S' : 'PT15M30S' },
    statistics: { viewCount: "1000", likeCount: "50" },
    liveStreamingDetails: { concurrentViewers: "500" },
    duration: type === 'short' ? '0:45' : '15:30',
    views: "1000",
    channelThumbnail: "https://via.placeholder.com/88"
  }));
};

// ----------------------------------------------------------------------
// 🕒 HELPER: ISO Duration to String (PT1H2M -> 1:02:00)
// ----------------------------------------------------------------------
export const formatDuration = (isoDuration) => {
  if (!isoDuration) return "0:00";
  const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return isoDuration;

  const hours = (match[1] || "").replace("H", "");
  const minutes = (match[2] || "").replace("M", "");
  const seconds = (match[3] || "").replace("S", "");

  let result = "";
  if (hours) result += hours + ":";
  result += (minutes || "0") + ":";
  result += (seconds || "00").padStart(2, "0");

  return result;
};

// ----------------------------------------------------------------------
// 🔍 CORE API FUNCTIONS
// ----------------------------------------------------------------------

export const fetchVideoDetailsBatch = async (videoIds) => {
  if (!videoIds) return [];
  try {
    const res = await axios.get(`${BASE_URL}/videos`, {
      params: {
        part: 'snippet,contentDetails,statistics,liveStreamingDetails',
        id: videoIds,
        key: API_KEY
      }
    });
    return res.data.items || [];
  } catch (err) {
    console.error(err);
    return [];
  }
};

export const fetchVideoDetails = async (id) => {
  try {
    const res = await axios.get(`${BASE_URL}/videos`, {
      params: { part: 'snippet,statistics,contentDetails,liveStreamingDetails', id, key: API_KEY }
    });
    return res.data.items?.[0] || getMockVideos(1)[0];
  } catch (err) { return getMockVideos(1)[0]; }
};

export const fetchChannelDetails = async (id) => {
  try {
    const res = await axios.get(`${BASE_URL}/channels`, {
      params: { part: 'snippet,statistics,brandingSettings', id, key: API_KEY }
    });
    return res.data.items?.[0];
  } catch (err) {
    return {
      snippet: { title: "Mock Channel", thumbnails: { default: { url: "https://via.placeholder.com/80" } } },
      statistics: { subscriberCount: "1M" }
    };
  }
};

export const fetchPlaylistItems = async (playlistId) => {
  try {
    const res = await axios.get(`${BASE_URL}/playlistItems`, {
      params: { part: 'snippet,contentDetails', playlistId, maxResults: 50, key: API_KEY }
    });
    return res.data.items || [];
  } catch (err) { return getMockVideos(10); }
};

export const fetchChannelPlaylists = async (channelId, pageToken = "") => {
  try {
    const res = await axios.get(`${BASE_URL}/playlists`, {
      params: { part: 'snippet,contentDetails', channelId, maxResults: 20, pageToken, key: API_KEY }
    });
    return { items: res.data.items || [], nextPageToken: res.data.nextPageToken || "" };
  } catch (err) { return { items: [], nextPageToken: "" }; }
};

export const fetchChannelVideosWithDuration = async (channelId, pageToken = "") => {
  try {
    const searchRes = await axios.get(`${BASE_URL}/search`, {
      params: { part: 'snippet', channelId, maxResults: 50, order: 'date', type: 'video', pageToken, key: API_KEY }
    });

    const itemsList = searchRes.data.items || [];
    const videoIds = itemsList.map(v => v.id.videoId).filter(Boolean).join(',');
    if (!videoIds) return { items: [], nextPageToken: searchRes.data.nextPageToken || "" };

    const details = await fetchVideoDetailsBatch(videoIds);

    const items = itemsList.map(item => {
      const detail = details.find(d => d.id === item.id.videoId);
      return {
        ...item,
        contentDetails: detail?.contentDetails,
        statistics: detail?.statistics,
        liveStreamingDetails: detail?.liveStreamingDetails,
        duration: formatDuration(detail?.contentDetails?.duration)
      };
    });
    return { items, nextPageToken: searchRes.data.nextPageToken || "" };
  } catch (err) { return { items: getMockVideos(20), nextPageToken: "" }; }
};

export const fetchTrendingVideos = async (token = '', categoryId = '0') => {
  try {
    const res = await axios.get(`${BASE_URL}/videos`, {
      params: {
        part: 'snippet,contentDetails,statistics',
        chart: 'mostPopular',
        maxResults: 50,
        regionCode: 'IN',
        videoCategoryId: categoryId,
        pageToken: token,
        key: API_KEY
      }
    });

    const itemsList = res.data.items || [];
    const items = itemsList.map(item => ({
      ...item,
      duration: formatDuration(item.contentDetails?.duration)
    }));

    return { items, nextPageToken: res.data.nextPageToken || "" };
  } catch (err) {
    return { items: getMockVideos(20), nextPageToken: '' };
  }
};

export const fetchSearchVideos = async (query, token = '', duration = 'any', eventType = null) => {
  try {
    const { langCode, regionCode, langName } = getUserPreferences();
    const strictQuery = `${query} (${langName})`;

    const params = {
      part: 'snippet',
      q: strictQuery,
      maxResults: 40,
      type: 'video',
      pageToken: token,
      key: API_KEY,
      safeSearch: "moderate",
      regionCode,
      relevanceLanguage: langCode
    };

    if (eventType) params.eventType = eventType;
    else params.videoDuration = duration;

    const res = await axios.get(`${BASE_URL}/search`, { params });
    const itemsList = res.data.items || [];
    const videoIds = itemsList.map(v => v.id.videoId).filter(Boolean).join(',');

    if (!videoIds) return { items: [], nextPageToken: res.data.nextPageToken || "" };

    const details = await fetchVideoDetailsBatch(videoIds);
    const uniqueChannelIds = [...new Set(itemsList.map(v => v.snippet.channelId))].filter(Boolean);
    const channelsData = await fetchChannelsByIds(uniqueChannelIds);

    const items = itemsList.map(item => {
      const detail = details.find(d => d.id === item.id.videoId);
      const channelMatch = channelsData.find(c => c.id === item.snippet.channelId);

      return {
        ...item,
        contentDetails: detail?.contentDetails,
        statistics: detail?.statistics,
        liveStreamingDetails: detail?.liveStreamingDetails,
        duration: formatDuration(detail?.contentDetails?.duration),
        views: detail?.statistics?.viewCount,
        channelThumbnail: channelMatch?.snippet?.thumbnails?.default?.url 
      };
    });

    return { items, nextPageToken: res.data.nextPageToken || "" };
  } catch (err) {
    const type = eventType === 'live' ? 'live' : (duration === 'short' ? 'short' : 'video');
    return { items: getMockVideos(20, type), nextPageToken: '' };
  }
};

export const fetchShorts = async (pageToken = "") => {
  try {
    const res = await axios.get(`${BASE_URL}/search`, {
      params: {
        part: 'snippet',
        type: 'video',
        videoDuration: 'short',
        maxResults: 12,
        pageToken,
        q: 'educational shorts | science shorts | coding shorts',
        key: API_KEY
      }
    });

    const itemsList = res.data.items || [];
    const videoIds = itemsList.map(v => v.id.videoId).join(',');
    if (!videoIds) return { items: [], nextPageToken: res.data.nextPageToken || "" };

    const details = await fetchVideoDetailsBatch(videoIds);

    const items = itemsList.map(item => {
      const detail = details.find(d => d.id === item.id.videoId);
      return {
        ...item,
        duration: formatDuration(detail?.contentDetails?.duration)
      };
    });

    return { items, nextPageToken: res.data.nextPageToken || "" };
  } catch (error) {
    return { items: getMockVideos(12, 'short'), nextPageToken: "" };
  }
};

export const fetchLiveVideos = async () => {
  try {
    const query = "live news | coding live | science live | tech news live";
    const searchRes = await fetchSearchVideos(query, "", "any", "live");
    return searchRes.items || [];
  } catch (error) {
    return getMockVideos(5, 'live');
  }
};

export const fetchChannelsByIds = async (channelIds) => {
  if (!channelIds || channelIds.length === 0) return [];
  try {
    const idsString = channelIds.slice(0, 50).join(',');
    const res = await axios.get(`${BASE_URL}/channels`, {
      params: { part: 'snippet,statistics', id: idsString, key: API_KEY }
    });
    return res.data.items || [];
  } catch (err) { return []; }
};

export const searchChannelSpecific = async (channelId, query, pageToken = "") => {
  try {
    const res = await axios.get(`${BASE_URL}/search`, {
      params: { part: 'snippet', channelId, q: query, maxResults: 20, type: 'video', pageToken, key: API_KEY }
    });
    const itemsList = res.data.items || [];
    const videoIds = itemsList.map(v => v.id.videoId).filter(Boolean).join(',');
    if (!videoIds) return { items: [], nextPageToken: res.data.nextPageToken || "" };

    const details = await fetchVideoDetailsBatch(videoIds);
    const items = itemsList.map(item => {
      const detail = details.find(d => d.id === item.id.videoId);
      return {
        ...item,
        duration: formatDuration(detail?.contentDetails?.duration),
        views: detail?.statistics?.viewCount
      };
    });
    return { items, nextPageToken: res.data.nextPageToken || "" };
  } catch (err) { return { items: [], nextPageToken: "" }; }
};
