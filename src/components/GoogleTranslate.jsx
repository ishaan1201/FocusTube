import { useEffect, useState } from "react";
import { Globe, ChevronDown } from "lucide-react";

// 🌍 Curated List of Languages
const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi (हिंदी)" },
  { code: "bn", label: "Bengali (বাংলা)" },
  { code: "mr", label: "Marathi (मराठी)" },
  { code: "te", label: "Telugu (తెలుగు)" },
  { code: "ta", label: "Tamil (தமிழ்)" },
  { code: "gu", label: "Gujarati (ગુજરાતી)" },
  { code: "kn", label: "Kannada (ಕನ್ನಡ)" },
  { code: "ml", label: "Malayalam (മലയാളം)" },
  { code: "pa", label: "Punjabi (ਪੰਜਾਬੀ)" },
  { code: "ur", label: "Urdu (اردو)" },
  { code: "or", label: "Odia (ଓଡ଼ିଆ)" },
  { code: "as", label: "Assamese (অসমীয়া)" }
];

const GoogleTranslate = () => {
  const [currentLang, setCurrentLang] = useState("en");

  // 1️⃣ Check existing language cookie on load
  useEffect(() => {
    const cookies = document.cookie.split(";");
    const langCookie = cookies.find(c => c.trim().startsWith("googtrans="));

    if (langCookie) {
      // Cookie format is usually "/auto/hi" or "/en/hi"
      const val = langCookie.split("=")[1];
      const parts = val.split("/");
      const code = parts[2]; // /auto/CODE
      if (code) setCurrentLang(code);
    }
  }, []);

  // 2️⃣ Handle Language Change
  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setCurrentLang(newLang);

    // 🍪 CLEAR OLD COOKIES (Fixes conflict issues)
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;

    // 🍪 SET NEW COOKIE (Simple & Robust)
    // Using '/auto/' as source is often safer than '/en/'
    document.cookie = `googtrans=/auto/${newLang}; path=/;`;

    // Reload to force Google to pick up the new cookie and translate
    window.location.reload();
  };

  return (
    <div style={styles.wrapper}>
      {/* 🕵️ HIDDEN: The real Google Widget */}
      <div id="google_translate_element" style={{ display: "none" }}></div>

      {/* ✨ VISIBLE: Custom Dropdown */}
      <div style={styles.customSelectWrapper}>
        <Globe size={16} style={styles.icon} />

        <select
          value={currentLang}
          onChange={handleLanguageChange}
          style={styles.select}
        >
          {LANGUAGES.map((lang) => (
            // ✅ FIXED: Added specific background styles for options
            <option key={lang.code} value={lang.code} style={styles.option}>
              {lang.label}
            </option>
          ))}
        </select>

        <ChevronDown size={14} style={styles.arrow} />
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    display: "inline-block",
  },
  customSelectWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    background: "#222",
    border: "1px solid #333",
    borderRadius: "8px",
    padding: "0 10px",
    minWidth: "180px",
    height: "40px",
    transition: "0.2s",
  },
  icon: {
    color: "#aaa",
    marginRight: "10px",
    pointerEvents: "none",
  },
  select: {
    appearance: "none",
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: "14px",
    fontWeight: "500",
    width: "100%",
    height: "100%",
    cursor: "pointer",
    outline: "none",
    zIndex: 2,
  },
  // ✅ NEW OPTION STYLE
  option: {
    backgroundColor: "#1a1a1a", // Dark background for the dropdown list
    color: "white",             // White text
    padding: "10px"
  },
  arrow: {
    color: "#666",
    position: "absolute",
    right: "10px",
    pointerEvents: "none",
  },
};

export default GoogleTranslate;