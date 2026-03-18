import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getWatchHistory } from '../services/userData';
import { Loader2, History as HistoryIcon } from 'lucide-react';

function History() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      const data = await getWatchHistory(user);
      setItems(data);
      setLoading(false);
    };
    loadHistory();
  }, [user]);

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-white">
      <Loader2 className="animate-spin text-purple-500 mb-4" size={32} />
      <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Loading History...</p>
    </div>
  );

  return (
    <div className="p-10 max-w-5xl mx-auto text-white">
      <div className="flex items-center gap-4 mb-10">
        <HistoryIcon size={32} className="text-red-500" />
        <h1 className="text-4xl font-black tracking-tighter">Watch History</h1>
      </div>

      <div className="flex flex-col gap-6">
        {items.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/20 rounded-[2rem] border border-dashed border-white/5">
            <p className="text-zinc-500 font-medium italic">Your watch history is empty.</p>
            <Link to="/" className="inline-block mt-6 px-8 py-3 bg-white text-black rounded-xl font-bold text-sm">Start Learning</Link>
          </div>
        ) : (
          items.map((video, idx) => (
            <Link 
              to={`/video/${video.video_id || video.id}?t=${Math.floor(video.resume_time || video.resumeTime || 0)}`} 
              key={video.id || video.video_id || idx} 
              className="group flex flex-col md:flex-row gap-6 p-6 bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] hover:bg-white/5 transition-all"
            >
              <div className="relative shrink-0">
                <img src={video.thumbnail_url || video.thumbnail} className="w-full md:w-64 aspect-video rounded-2xl object-cover shadow-2xl group-hover:scale-[1.02] transition-transform duration-500" alt="thumbnail" />
                <div className="absolute bottom-3 right-3 bg-black/80 px-2 py-1 rounded-md text-[10px] font-black">{video.duration}</div>
              </div>
              
              <div className="flex flex-col justify-center flex-1">
                <h3 className="text-xl font-bold mb-2 group-hover:text-purple-400 transition-colors line-clamp-2">{video.title}</h3>
                <p className="text-zinc-500 text-sm font-medium mb-4">{video.channel_title || video.channel}</p>
                
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full text-red-500 text-[10px] font-black uppercase tracking-widest">
                    Resume at {Math.floor((video.resume_time || video.resumeTime || 0) / 60)}m {Math.floor((video.resume_time || video.resumeTime || 0) % 60)}s
                  </div>
                  <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                    Watched {new Date(video.last_watched || video.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default History;
