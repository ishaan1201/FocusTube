import { supabase } from "./supabase";

// ==========================================
// 🎬 LIKED & SAVED VIDEOS (Tables vs Local)
// ==========================================

export const toggleVideoInList = async (user, video, listType = 'saved') => {
  const videoId = video.id?.videoId || video.id;
  
  // ☁️ AUTHENTICATED: Use Supabase Database
  if (user) {
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
      return false; // Returns false meaning "removed"
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
      return true; // Returns true meaning "added"
    }
  } 
  
  // 🏠 GUEST MODE: Use LocalStorage
  else {
    const storageKey = `focus_${listType}_videos`;
    let list = JSON.parse(localStorage.getItem(storageKey) || "[]");
    
    const existingIdx = list.findIndex(v => v.video_id === videoId);
    
    if (existingIdx > -1) {
      list.splice(existingIdx, 1);
      localStorage.setItem(storageKey, JSON.stringify(list));
      return false; // Removed
    } else {
      list.unshift({
        video_id: videoId,
        title: video.snippet?.title || video.title,
        thumbnail_url: video.snippet?.thumbnails?.high?.url || video.thumbnail_url,
        duration: video.duration || '0:00',
        saved_at: new Date().toISOString()
      });
      localStorage.setItem(storageKey, JSON.stringify(list));
      return true; // Added
    }
  }
};

export const fetchVideoList = async (user, listType = 'saved') => {
  if (user) {
    const { data, error } = await supabase
      .from('saved_videos')
      .select('*')
      .eq('user_id', user.id)
      .eq('list_type', listType)
      .order('saved_at', { ascending: false });
    return error ? [] : data;
  } else {
    return JSON.parse(localStorage.getItem(`focus_${listType}_videos`) || "[]");
  }
};


// ==========================================
// 📝 NOTES & AI INSIGHTS (Buckets vs Local)
// ==========================================

export const saveDocument = async (user, content, type, videoId) => {
  const bucketName = type === 'note' ? 'notes_files' : 'ai_insights_files';
  const fileName = `${videoId}_${Date.now()}.txt`; 

  // ☁️ AUTHENTICATED: Upload to Supabase Storage Bucket
  if (user) {
    const filePath = `${user.id}/${fileName}`;
    // Convert text content to a Blob for upload
    const fileBlob = new Blob([content], { type: 'text/plain' });
    
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileBlob, { upsert: true });
      
    if (error) console.error(`Error uploading ${type}:`, error);
    return !error;
  } 
  
  // 🏠 GUEST MODE: Save string to LocalStorage
  else {
    const storageKey = `focus_${type}s`; // e.g., focus_notes
    let list = JSON.parse(localStorage.getItem(storageKey) || "[]");
    
    // Check if a note for this video already exists and update it, else add new
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
};

export const fetchDocuments = async (user, type) => {
  const bucketName = type === 'note' ? 'notes_files' : 'ai_insights_files';

  if (user) {
    // 1. List all files in the user's folder
    const { data: files, error } = await supabase.storage
      .from(bucketName)
      .list(user.id);
      
    if (error || !files) return [];

    // 2. Download the content of each file
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
  } else {
    return JSON.parse(localStorage.getItem(`focus_${type}s`) || "[]");
  }
};
