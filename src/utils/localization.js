// 🌍 NEW: Automatic Localization Engine
export const getUserPreferences = () => {
  // 1. Get browser's preferred language (e.g., "hi-IN" or "en-US")
  const locale = navigator.language || "en-US";
  const langCode = locale.split('-')[0]; // extracts "hi" or "en"
  let regionCode = locale.split('-')[1]; // extracts "IN" or "US"

  // 2. Fallback: If region isn't in the language tag, guess from their Timezone
  if (!regionCode) {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === "Asia/Kolkata") regionCode = "IN";
    else if (tz.includes("Europe")) regionCode = "GB";
    else regionCode = "US"; // Default fallback
  }

  // 3. Convert code to text (e.g., "hi" -> "Hindi", "de" -> "German")
  let langName = "English";
  try {
    const displayNames = new Intl.DisplayNames(['en'], { type: 'language' });
    langName = displayNames.of(langCode);
  } catch (e) {
    console.warn("Language name parsing failed, defaulting to English");
  }

  return { langCode, regionCode, langName };
};
