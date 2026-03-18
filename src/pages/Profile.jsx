import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../services/supabase";
import { motion } from "framer-motion";
import { User, Camera, Mail, Save, Loader2, ArrowLeft, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.full_name || "");
      setBio(profile.bio || "");
      setPreview(profile.avatar_url || "");
    }
  }, [profile]);

  const uploadAvatar = async () => {
    if (!avatar) return preview;

    const fileExt = avatar.name.split(".").pop();
    // Use a path that matches our RLS policy: folder name should be user.id
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, avatar, { upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      alert(`Upload failed: ${uploadError.message}`);
      return preview;
    }

    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const avatar_url = await uploadAvatar();

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: name,
          bio: bio,
          avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (error) throw error;
      
      await refreshProfile();
      alert("Profile updated! ✨");
    } catch (error) {
      console.error(error);
      alert("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <User size={40} className="text-zinc-500" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Sign in to continue</h2>
          <p className="text-zinc-500 mb-8">You need an account to customize your profile and save progress.</p>
          <button 
            onClick={() => navigate("/auth")}
            className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <div className="flex items-center justify-between mb-10">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors font-bold text-sm uppercase tracking-widest"
          >
            <ArrowLeft size={18} /> Back
          </button>
          <div className="flex items-center gap-2 bg-zinc-900/50 px-3 py-1 rounded-full border border-white/5">
            <Shield size={14} className="text-purple-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{profile?.role || 'Member'}</span>
          </div>
        </div>

        <div className="bg-zinc-900/40 backdrop-blur-2xl border border-white/5 p-8 md:p-12 rounded-[2.5rem] shadow-2xl relative">
          <h1 className="text-4xl font-black mb-10 tracking-tighter">Profile Settings</h1>

          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-12 group">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/5 shadow-2xl relative">
                <img
                  src={preview || `https://ui-avatars.com/api/?name=${name || user.email}&background=random`}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
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
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-2 border border-dashed border-white/10 rounded-full -z-10" 
              />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-4 mb-2 block">Username</label>
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your display name"
                  className="w-full pl-14 pr-6 py-5 bg-black/40 border border-white/5 rounded-3xl text-white focus:outline-none focus:border-purple-500/50 transition-all text-lg font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-4 mb-2 block">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us your focus journey..."
                className="w-full px-6 py-5 bg-black/40 border border-white/5 rounded-3xl text-white focus:outline-none focus:border-purple-500/50 transition-all min-h-[120px] text-lg font-medium resize-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-4 mb-2 block">Email Address</label>
              <div className="relative opacity-50">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                <input
                  value={user?.email}
                  disabled
                  className="w-full pl-14 pr-6 py-5 bg-zinc-950/50 border border-white/5 rounded-3xl text-zinc-400 cursor-not-allowed"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full mt-10 group relative overflow-hidden bg-white text-black py-5 rounded-3xl font-black uppercase tracking-[0.2em] text-sm transition-all active:scale-95 flex items-center justify-center gap-3 shadow-2xl shadow-white/5"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  <Save size={20} />
                  <span>Save Profile Changes</span>
                </>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            </button>
          </div>
        </div>
        
        <p className="text-center text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em] mt-12 opacity-40">
          FocusTube ID: {user.id}
        </p>
      </motion.div>
    </div>
  );
}
