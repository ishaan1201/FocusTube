import { supabase } from "./supabase";

// ==========================================
// 🎬 LIKED & SAVED VIDEOS (Cloud-First)
// ==========================================

export const toggleVideoInList = async (user, video, listType = 'saved') => {
  const videoId = video.id?.videoId || video.id;
  
  if (!user) {
    // 🏠 FALLBACK TO LOCAL FOR GUESTS IF ANON AUTH IS DISABLED
    const storageKey = `focus_${listType}_videos`;
    let list = JSON.parse(localStorage.getItem(storageKey) || "[]");
    const existingIdx = list.findIndex(v => (v.video_id || v.id) === videoId);
    
    if (existingIdx > -1) {
      list.splice(existingIdx, 1);
      localStorage.setItem(storageKey, JSON.stringify(list));
      return false;
    } else {
      list.unshift({
        video_id: videoId,
        title: video.snippet?.title || video.title,
        thumbnail_url: video.snippet?.thumbnails?.high?.url || video.thumbnail_url,
        duration: video.duration || '0:00',
        saved_at: new Date().toISOString()
      });
      localStorage.setItem(storageKey, JSON.stringify(list));
      return true;
    }
  }

  // ☁️ CLOUD: Use Supabase Database
  // 1. Check if it already exists
  const { data: existing } = await supabase
    .from('saved_videos')
    .select('id')
    .eq('user_id', user.id)
    .eq('video_id', videoId)
    .eq('list_type', listType)
    .single();

  if (existing) {
    // 2a. If exists, remove it (Toggle OFF)
    await supabase.from('saved_videos').delete().eq('id', existing.id);
    return false;
  } else {
    // 2b. If not, insert it (Toggle ON)
    await supabase.from('saved_videos').insert([{
      user_id: user.id,
      video_id: videoId,
      title: video.snippet?.title || video.title,
      thumbnail_url: video.snippet?.thumbnails?.high?.url || video.thumbnail_url,
      duration: video.duration || '0:00',
      list_type: listType
    }]);
    return true;
  }
};

export const fetchVideoList = async (user, listType = 'saved') => {
  if (!user) {
    return JSON.parse(localStorage.getItem(`focus_${listType}_videos`) || "[]");
  }
  
  const { data, error } = await supabase
    .from('saved_videos')
    .select('*')
    .eq('user_id', user.id)
    .eq('list_type', listType)
    .order('saved_at', { ascending: false });
    
  return error ? [] : data;
};


// ==========================================
// 📝 NOTES & AI INSIGHTS (Storage-First)
// ==========================================

export const saveDocument = async (user, content, type, videoId) => {
  console.log(`Saving ${type} for video ${videoId}`, { hasUser: !!user });
  if (!user) {
    const storageKey = `focus_${type}s`;
    let list = JSON.parse(localStorage.getItem(storageKey) || "[]");
    const existingIdx = list.findIndex(item => item.videoId === videoId);
    if (existingIdx > -1) {
      list[existingIdx].content = content;
      list[existingIdx].updatedAt = new Date().toISOString();
    } else {
      list.push({ videoId, content, updatedAt: new Date().toISOString() });
    }
    localStorage.setItem(storageKey, JSON.stringify(list));
    return true;
  }
  
  const bucketName = type === 'note' ? 'notes_files' : 'ai_insights_files';
  // Standardize the type check: 'note' vs 'ai_insight'
  const finalBucket = (type === 'note' || type === 'notes') ? 'notes_files' : 'ai_insights_files';
  const fileName = `${videoId}_doc.txt`; 

  const filePath = `${user.id}/${fileName}`;
  const fileBlob = new Blob([content], { type: 'text/plain' });
  
    const { error } = await supabase.storage
      .from(finalBucket)
      .upload(filePath, fileBlob, { upsert: true });
      
    if (error) console.error(`Error uploading ${type} to ${finalBucket}:`, error);
    else console.log(`Successfully uploaded ${type} to ${finalBucket}`);
  return !error;
};

export const fetchDocuments = async (user, type) => {
  if (!user) {
    return JSON.parse(localStorage.getItem(`focus_${type}s`) || "[]");
  }
  
  const bucketName = type === 'note' ? 'notes_files' : 'ai_insights_files';

  try {
    const { data: files, error } = await supabase.storage
      .from(bucketName)
      .list(user.id);
      
    if (error || !files) return [];

    const documents = await Promise.all(files.map(async (file) => {
      const { data: blob } = await supabase.storage
        .from(bucketName)
        .download(`${user.id}/${file.name}`);
        
      const content = blob ? await blob.text() : "";
      return { 
        fileName: file.name, 
        videoId: file.name.split('_')[0], 
        content, 
        updatedAt: file.created_at 
      };
    }));
    
    return documents;
  } catch (err) {
    console.error(err);
    return [];
  }
};
