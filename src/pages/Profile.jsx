import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../services/supabase";
import { motion } from "framer-motion";
import { 
  User, Camera, Mail, Save, Loader2, ArrowLeft, 
  Shield, Twitter, Github, Globe, Image as ImageIcon,
  LogOut
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [twitter, setTwitter] = useState("");
  const [github, setGithub] = useState("");
  const [website, setWebsite] = useState("");
  
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState("");
  const [banner, setBanner] = useState(null);
  const [bannerPreview, setBannerPreview] = useState("");
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.full_name || "");
      setBio(profile.bio || "");
      setPreview(profile.avatar_url || "");
      setBannerPreview(profile.banner_url || "");
      setTwitter(profile.twitter_url || "");
      setGithub(profile.github_url || "");
      setWebsite(profile.website_url || "");
    }
  }, [profile]);

  const uploadFile = async (file, bucket) => {
    if (!file) return null;
    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/${Date.now()}-${Math.random()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error(`Upload error in ${bucket}:`, uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let avatar_url = preview;
      let banner_url = bannerPreview;

      if (avatar) {
        const uploadedAvatar = await uploadFile(avatar, "avatars");
        if (uploadedAvatar) avatar_url = uploadedAvatar;
      }

      if (banner) {
        const uploadedBanner = await uploadFile(banner, "avatars"); // Using avatars bucket for simplicity or create 'banners'
        if (uploadedBanner) banner_url = uploadedBanner;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: name,
          bio,
          avatar_url,
          banner_url,
          twitter_url: twitter,
          github_url: github,
          website_url: website,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (error) throw error;
      
      await refreshProfile();
      alert("Identity updated! 🚀");
    } catch (error) {
      console.error(error);
      alert("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-white">
        <div className="text-center">
           <Loader2 className="animate-spin mx-auto mb-4" />
           <p>Authenticating...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-black text-white pb-20 relative overflow-x-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/[0.03] blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/[0.03] blur-[120px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-10">
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors font-bold text-xs uppercase tracking-widest"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-full border border-red-500/20 transition-all font-bold text-[10px] uppercase tracking-widest"
            >
              <LogOut size={14} /> Logout
            </button>
            <div className="flex items-center gap-2 bg-zinc-900/50 px-3 py-1 rounded-full border border-white/5 h-fit">
              <Shield size={14} className="text-purple-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{profile?.role || 'Member'}</span>
            </div>
          </div>
        </div>

        {/* IDENTITY LAYER CARD */}
        <div className="bg-zinc-900/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/50">
          
          {/* BANNER SECTION */}
          <div className="relative group h-48 md:h-64 bg-zinc-800">
            <img 
              src={bannerPreview || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop"} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              alt="Banner"
            />
            <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm">
              <div className="flex flex-col items-center">
                <ImageIcon size={32} className="text-white mb-2" />
                <span className="text-xs font-black uppercase tracking-widest">Update Banner</span>
              </div>
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setBanner(file);
                    setBannerPreview(URL.createObjectURL(file));
                  }
                }}
                className="hidden" 
              />
            </label>
          </div>

          <div className="px-8 md:px-12 pb-12 relative">
            {/* AVATAR OVER BANNER */}
            <div className="relative -mt-16 md:-mt-20 mb-8 inline-block group">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-[6px] border-[#0c0c0c] overflow-hidden bg-zinc-900 shadow-2xl relative">
                <img
                  src={preview || `https://ui-avatars.com/api/?name=${name || user.email}&background=random`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  alt="Avatar"
                />
                <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera size={24} className="text-white mb-1" />
                  <span className="text-[10px] font-black uppercase">Change</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setAvatar(file);
                        setPreview(URL.createObjectURL(file));
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
              {/* LEFT COL: INFO */}
              <div className="md:col-span-7 space-y-8">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-4 mb-2 block">Username</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your display name"
                    className="w-full px-6 py-5 bg-black/40 border border-white/5 rounded-3xl text-white focus:outline-none focus:border-purple-500/50 transition-all text-xl font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-4 mb-2 block">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell the community about your journey..."
                    className="w-full px-6 py-5 bg-black/40 border border-white/5 rounded-3xl text-white focus:outline-none focus:border-purple-500/50 transition-all min-h-[140px] text-lg leading-relaxed resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-4 mb-2 block">Email (Private)</label>
                  <div className="flex items-center gap-4 px-6 py-5 bg-zinc-950/30 border border-white/5 rounded-3xl opacity-50">
                    <Mail size={18} className="text-zinc-600" />
                    <span className="text-zinc-400 font-medium">{user?.email}</span>
                  </div>
                </div>
              </div>

              {/* RIGHT COL: SOCIALS */}
              <div className="md:col-span-5 space-y-8">
                <div className="bg-black/20 p-8 rounded-[2rem] border border-white/5 h-fit">
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400 mb-6 flex items-center gap-2">
                    Connect Socials
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="relative">
                      <Twitter className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                      <input
                        value={twitter}
                        onChange={(e) => setTwitter(e.target.value)}
                        placeholder="Twitter Handle"
                        className="w-full pl-12 pr-4 py-3 bg-black/40 border border-white/5 rounded-xl text-sm focus:border-blue-400/50 outline-none transition-all"
                      />
                    </div>

                    <div className="relative">
                      <Github className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                      <input
                        value={github}
                        onChange={(e) => setGithub(e.target.value)}
                        placeholder="GitHub Username"
                        className="w-full pl-12 pr-4 py-3 bg-black/40 border border-white/5 rounded-xl text-sm focus:border-white/50 outline-none transition-all"
                      />
                    </div>

                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                      <input
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="Personal Website"
                        className="w-full pl-12 pr-4 py-3 bg-black/40 border border-white/5 rounded-xl text-sm focus:border-green-400/50 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full group relative overflow-hidden bg-white text-black py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-2xl shadow-white/10"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : (
                    <>
                      <Save size={20} />
                      <span>Sync Identity</span>
                    </>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <p className="text-center text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] mt-12 opacity-30">
          Curio Protocol v2.0 • Session ID: {user.id.slice(0,8)}
        </p>
      </div>
    </div>
  );
}
