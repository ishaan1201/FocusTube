import { supabase } from "./supabase";

// ==========================================
// 🎬 LIKED & SAVED VIDEOS (Cloud-First)
// ==========================================

export const toggleVideoInList = async (user, video, listType = 'saved') => {
  const videoId = video.id?.videoId || video.id;
  
  if (!user) {
    console.error("Auth required. User should be at least anonymous.");
    return false;
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
  if (!user) return [];
  
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
  if (!user) return false;
  
  const bucketName = type === 'note' ? 'notes_files' : 'ai_insights_files';
  const fileName = `${videoId}_doc.txt`; // Simplified for consistent lookup

  const filePath = `${user.id}/${fileName}`;
  const fileBlob = new Blob([content], { type: 'text/plain' });
  
  const { error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, fileBlob, { upsert: true });
    
  if (error) console.error(`Error uploading ${type}:`, error);
  return !error;
};

export const fetchDocuments = async (user, type) => {
  if (!user) return [];
  
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
