/**
 * Notification Service
 * Handles Discord webhooks, Resend emails, and future Push notifications.
 */

const DISCORD_WEBHOOK_URL = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;

/**
 * Sends a notification to Discord via Webhook
 * @param {Object} item - Feedback item
 */
export const sendDiscordNotification = async (item) => {
  if (!DISCORD_WEBHOOK_URL) return;

  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [{
          title: "🚀 New Feedback Received!",
          color: 0x5865F2,
          fields: [
            { name: "User", value: item.email || "Anonymous", inline: true },
            { name: "Rating", value: `⭐ ${item.rating}/10`, inline: true },
            { name: "Pain Point", value: item.pain_point || "N/A" },
            { name: "Suggestion", value: item.suggestion || "N/A" }
          ],
          timestamp: new Date().toISOString()
        }]
      }),
    });
  } catch (error) {
    console.error("Discord notification error:", error);
  }
};

/**
 * Sends an email notification via Resend
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email content
 */
export const sendEmailNotification = async (to, subject, html) => {
  if (!RESEND_API_KEY) return;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: "FocusTube <notifications@focustube.app>",
        to: [to],
        subject: subject,
        html: html
      })
    });
  } catch (error) {
    console.error("Email notification error:", error);
  }
};

/**
 * Registers for Push Notifications (PWA)
 * Placeholder for future implementation
 */
export const registerPushNotifications = async () => {
    // Implementation for web-push will go here
    console.log("Push notification registration requested");
};
