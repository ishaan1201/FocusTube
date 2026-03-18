import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../services/supabase";
import { 
  User, Camera, Mail, Save, Loader2, ArrowLeft, 
  Shield, Twitter, Github, Globe, Image as ImageIcon,
  LogOut, Cloud, Smartphone, Lock, AlertTriangle, Zap
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();

  // --- REGULAR PROFILE STATE ---
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [twitter, setTwitter] = useState("");
  const [github, setGithub] = useState("");
  const [website, setWebsite] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState("");
  const [banner, setBanner] = useState(null);
  const [bannerPreview, setBannerPreview] = useState("");
  
  // --- UPGRADE GUEST STATE ---
  const [upgradeEmail, setUpgradeEmail] = useState("");
  const [upgradePassword, setUpgradePassword] = useState("");
  const [upgradeName, setUpgradeName] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile && !user?.is_anonymous) {
      setName(profile.full_name || "");
      setBio(profile.bio || "");
      setPreview(profile.avatar_url || "");
      setBannerPreview(profile.banner_url || "");
      setTwitter(profile.twitter_url || "");
      setGithub(profile.github_url || "");
      setWebsite(profile.website_url || "");
    }
  }, [profile, user]);

  // --- UPGRADE GUEST HANDLER ---
  const handleUpgradeAccount = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Attach email and password to the anonymous UUID
      const { data, error: upgradeError } = await supabase.auth.updateUser({
        email: upgradeEmail,
        password: upgradePassword,
      });

      if (upgradeError) {
        if (upgradeError.status === 429) {
          throw new Error("Rate limit exceeded. Please wait a few minutes before trying to upgrade again.");
        }
        throw upgradeError;
      }

      // 2. Update the profile table with their new username
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: upgradeName, role: 'user' })
        .eq("id", user.id);

      if (profileError) throw profileError;

      alert("Account upgraded! Check your email for a verification link. ☁️");
      await refreshProfile();
      window.location.reload(); 
    } catch (error) {
      console.error(error);
      alert(error.message || "Failed to upgrade account.");
    } finally {
      setLoading(false);
    }
  };

  // --- REGULAR PROFILE HANDLERS ---
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

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (loading) return;
    setLoading(true);
    try {
      let avatar_url = preview;
      let banner_url = bannerPreview;

      if (avatar) {
        const uploadedAvatar = await uploadFile(avatar, "avatars");
        if (uploadedAvatar) avatar_url = uploadedAvatar;
      }

      if (banner) {
        const uploadedBanner = await uploadFile(banner, "avatars");
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

      if (error) {
        if (error.status === 429) {
          throw new Error("You're saving too fast! Please wait a moment.");
        }
        throw error;
      }
      
      await refreshProfile();
      alert("Identity updated! 🚀");
    } catch (error) {
      console.error(error);
      alert(error.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
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

  // ==========================================
  // 🛡️ GUEST MODE UI (Upgrade Screen)
  // ==========================================
  if (user.is_anonymous) {
    return (
      <div className="min-h-screen bg-black text-white pb-20 relative overflow-x-hidden pt-10 px-4">
        {/* Background Decorative Elements */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute top-[10%] left-[20%] w-[30%] h-[30%] bg-orange-600/[0.05] blur-[120px] rounded-full" />
          <div className="absolute bottom-[10%] right-[20%] w-[30%] h-[30%] bg-blue-600/[0.05] blur-[120px] rounded-full" />
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors font-bold text-xs uppercase tracking-widest">
              <ArrowLeft size={16} /> Back
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-full border border-red-500/20 transition-all font-bold text-[10px] uppercase tracking-widest">
              <LogOut size={14} /> Clear Session
            </button>
          </div>

          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-black mb-4">Claim Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Identity</span></h1>
            <p className="text-zinc-400 max-w-xl mx-auto text-lg">You are currently browsing in Guest Mode. Upgrade to a free account to secure your notes, insights, and saved videos forever.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* PROS & CONS PANEL */}
            <div className="space-y-6">
              <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-red-400 mb-6 flex items-center gap-2">
                  <AlertTriangle size={18} /> Current Status: Guest Mode
                </h3>
                <ul className="space-y-4 text-zinc-400">
                  <li className="flex gap-3 items-start"><Smartphone size={20} className="shrink-0 text-zinc-500" /> <span>Data is locked to this specific device and browser.</span></li>
                  <li className="flex gap-3 items-start"><Lock size={20} className="shrink-0 text-zinc-500" /> <span>If you clear your browser cache, <strong>all notes and saved videos will be permanently deleted.</strong></span></li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-8 shadow-2xl">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-purple-400 mb-6 flex items-center gap-2">
                  <Zap size={18} /> Upgraded Account Benefits
                </h3>
                <ul className="space-y-4 text-zinc-300">
                  <li className="flex gap-3 items-start"><Cloud size={20} className="shrink-0 text-purple-400" /> <span><strong>Cloud Sync:</strong> Access your Vault and History from your phone, laptop, or any device.</span></li>
                  <li className="flex gap-3 items-start"><Shield size={20} className="shrink-0 text-purple-400" /> <span><strong>Secure Backup:</strong> Never lose a study note or AI insight again.</span></li>
                  <li className="flex gap-3 items-start"><User size={20} className="shrink-0 text-purple-400" /> <span><strong>Personalized AI:</strong> FocusTube learns your study habits for better recommendations.</span></li>
                </ul>
              </div>
            </div>

            {/* UPGRADE FORM PANEL */}
            <div className="bg-zinc-900/80 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 shadow-2xl">
              <h2 className="text-2xl font-bold mb-6">Create Account</h2>
              <form onSubmit={handleUpgradeAccount} className="space-y-5">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-4 mb-2 block">Username</label>
                  <input
                    required
                    value={upgradeName}
                    onChange={(e) => setUpgradeName(e.target.value)}
                    placeholder="e.g., Ishaan"
                    className="w-full px-6 py-4 bg-black/40 border border-white/5 rounded-2xl text-white focus:outline-none focus:border-purple-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-4 mb-2 block">Email Address</label>
                  <input
                    required
                    type="email"
                    value={upgradeEmail}
                    onChange={(e) => setUpgradeEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-6 py-4 bg-black/40 border border-white/5 rounded-2xl text-white focus:outline-none focus:border-purple-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-4 mb-2 block">Secure Password</label>
                  <input
                    required
                    type="password"
                    minLength={6}
                    value={upgradePassword}
                    onChange={(e) => setUpgradePassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-6 py-4 bg-black/40 border border-white/5 rounded-2xl text-white focus:outline-none focus:border-purple-500/50 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-500/25 flex justify-center"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : "Upgrade Account Now"}
                </button>
              </form>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 👤 REGULAR REGISTERED USER UI 
  // ==========================================
  return (
    <div className="min-h-screen bg-black text-white pb-20 relative overflow-x-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/[0.03] blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/[0.03] blur-[120px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-10">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors font-bold text-xs uppercase tracking-widest">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="flex items-center gap-3">
            <button onClick={handleLogout} className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-full border border-red-500/20 transition-all font-bold text-[10px] uppercase tracking-widest">
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
            <img src={bannerPreview || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop"} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Banner" />
            <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm">
              <div className="flex flex-col items-center">
                <ImageIcon size={32} className="text-white mb-2" />
                <span className="text-xs font-black uppercase tracking-widest">Update Banner</span>
              </div>
              <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files[0]; if (file) { setBanner(file); setBannerPreview(URL.createObjectURL(file)); } }} className="hidden" />
            </label>
          </div>

          <div className="px-8 md:px-12 pb-12 relative">
            {/* AVATAR OVER BANNER */}
            <div className="relative -mt-16 md:-mt-20 mb-8 inline-block group">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-[6px] border-[#0c0c0c] overflow-hidden bg-zinc-900 shadow-2xl relative">
                <img src={preview || `https://ui-avatars.com/api/?name=${name || user.email}&background=random`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Avatar" />
                <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera size={24} className="text-white mb-1" />
                  <span className="text-[10px] font-black uppercase">Change</span>
                  <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files[0]; if (file) { setAvatar(file); setPreview(URL.createObjectURL(file)); } }} className="hidden" />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
              {/* LEFT COL: INFO */}
              <div className="md:col-span-7 space-y-8">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-4 mb-2 block">Username</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your display name" className="w-full px-6 py-5 bg-black/40 border border-white/5 rounded-3xl text-white focus:outline-none focus:border-purple-500/50 transition-all text-xl font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-4 mb-2 block">Bio</label>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell the community about your journey..." className="w-full px-6 py-5 bg-black/40 border border-white/5 rounded-3xl text-white focus:outline-none focus:border-purple-500/50 transition-all min-h-[140px] text-lg leading-relaxed resize-none" />
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
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400 mb-6 flex items-center gap-2">Connect Socials</h3>
                  <div className="space-y-4">
                    <div className="relative">
                      <Twitter className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                      <input value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="Twitter Handle" className="w-full pl-12 pr-4 py-3 bg-black/40 border border-white/5 rounded-xl text-sm focus:border-blue-400/50 outline-none transition-all" />
                    </div>
                    <div className="relative">
                      <Github className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                      <input value={github} onChange={(e) => setGithub(e.target.value)} placeholder="GitHub Username" className="w-full pl-12 pr-4 py-3 bg-black/40 border border-white/5 rounded-xl text-sm focus:border-white/50 outline-none transition-all" />
                    </div>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                      <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Personal Website" className="w-full pl-12 pr-4 py-3 bg-black/40 border border-white/5 rounded-xl text-sm focus:border-green-400/50 outline-none transition-all" />
                    </div>
                  </div>
                </div>

                <button onClick={handleSave} disabled={loading} className="w-full group relative overflow-hidden bg-white text-black py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-2xl shadow-white/10">
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
      </div>
    </div>
  );
}
