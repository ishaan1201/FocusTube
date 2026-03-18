import React, { useState } from "react";
import { Search, Settings, User, Menu, Pause, Play, Sparkles, VolumeX, Mic, MicOff, UserCircle, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GoogleTranslate from "./GoogleTranslate";
import GlobalAIChat from "./GlobalAIChat";
import ThemeToggle from "./ThemeToggle";

export default function Header({ toggleSidebar, onSearch, timer, bgVideoId, setBgVideoId }) {
  const [input, setInput] = useState("");
  const [showAIChat, setShowAIChat] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const handleSearchSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    onSearch(input);
    navigate("/");
  };

  const startVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Your browser doesn't support voice recognition. Try Chrome!");
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      onSearch(transcript);
      navigate("/");
    };
    recognition.start();
  };

  const handleProfileClick = async () => {
    if (user) {
      navigate("/profile");
    } else {
      navigate("/auth");
    }
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <header className="h-16 border-b border-border bg-surface text-primary flex items-center justify-between px-4 sticky top-0 z-40 transition-colors duration-300">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-2 hover:bg-base rounded-xl transition-colors"
        >
          <Menu size={20} className="text-primary" />
        </button>

        {timer && timer.sessionStarted ? (
          <button
            onClick={() => timer.setIsActive(!timer.isActive)}
            className={`flex items-center gap-3 px-4 py-2 border border-border rounded-full transition-all ${timer.isActive ? "bg-accent/10" : "bg-base"}`}
          >
            {timer.isActive ? <Pause size={18} className="text-accent" /> : <Play size={18} className="text-green-500" />}
            <span className="font-mono font-bold text-sm tracking-tighter">{formatTime(timer.timeLeft)}</span>
          </button>
        ) : (
          <div className="hidden sm:flex flex-col cursor-pointer" onClick={() => { onSearch(""); navigate("/"); }}>
            <h2 className="text-accent font-black text-xl tracking-tighter leading-none">Curio</h2>
            <span className="text-[8px] font-bold uppercase tracking-widest text-muted mt-1">Focus System</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center bg-base border border-border px-4 py-2 rounded-full w-96 focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/20 transition-all">
        <Search size={16} className="text-muted mr-2" />
        <input 
          type="text" 
          placeholder="Search FocusTube..." 
          className="bg-transparent border-none outline-none w-full text-sm text-primary placeholder:text-muted"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="button" onClick={startVoiceSearch} className={`ml-2 transition-colors ${isListening ? "text-accent" : "text-muted hover:text-primary"}`}>
           {isListening ? <MicOff size={16} /> : <Mic size={16} />}
        </button>
      </form>

      <div className="flex items-center gap-2 sm:gap-4">
        {bgVideoId && (
          <button onClick={() => setBgVideoId(null)} className="p-2 bg-accent/10 rounded-full text-accent hover:bg-accent/20 transition-all">
            <VolumeX size={18} />
          </button>
        )}

        <button 
          onClick={() => setShowAIChat(!showAIChat)} 
          className={`p-2 rounded-xl transition-all ${showAIChat ? "bg-accent text-white shadow-lg shadow-accent/20" : "hover:bg-base text-primary"}`}
        >
          <Sparkles size={20} />
        </button>

        {showAIChat && <GlobalAIChat onClose={() => setShowAIChat(false)} />}

        <div className="hidden sm:block">
          <GoogleTranslate />
        </div>

        <ThemeToggle />

        <button className="p-2 hover:bg-base rounded-xl transition-colors relative text-primary">
          <Bell size={20} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-accent rounded-full border-2 border-surface"></span>
        </button>

        <div onClick={handleProfileClick} className="w-9 h-9 rounded-full bg-gradient-to-tr from-accent to-indigo-500 p-[2px] cursor-pointer hover:scale-105 transition-transform active:scale-95">
          <div className="w-full h-full rounded-full border-2 border-surface overflow-hidden bg-base flex items-center justify-center">
             {user && (profile?.avatar_url || user.user_metadata?.avatar_url) ? (
               <img src={profile?.avatar_url || user.user_metadata?.avatar_url} className="w-full h-full object-cover" alt="pfp" />
             ) : (
               <span className="text-xs font-black text-primary">
                 {profile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
               </span>
             )}
          </div>
        </div>
      </div>
    </header>
  );
}
