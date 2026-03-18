/**
 * Stripe Integration Service
 * Placeholder for Stripe checkout and subscription management
 */

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

export const PLANS = {
  FREE: {
    id: "free",
    name: "Free",
    price: 0,
    features: ["100 feedback/month", "Basic analytics"]
  },
  PRO: {
    id: "pro",
    name: "Pro",
    price: 29,
    features: ["Unlimited feedback", "AI Insights", "Sentiment Analysis"]
  },
  TEAM: {
    id: "team",
    name: "Team",
    price: 99,
    features: ["Everything in Pro", "Roles & Permissions", "Advanced Automation"]
  }
};

/**
 * Redirects user to Stripe Checkout
 * @param {string} planId - Plan ID to subscribe to
 */
export const createCheckoutSession = async (planId) => {
  console.log(`Creating checkout session for plan: ${planId}`);
  // In a real implementation, you would call your backend/edge function
  // which uses stripe.checkout.sessions.create()
  alert("Redirecting to Stripe Checkout... (Simulated)");
};

/**
 * Gets user's current subscription status
 * @param {string} userId - User ID
 */
export const getSubscriptionStatus = async (userId) => {
  // Mock data for now
  return {
    plan: "free",
    status: "active",
    usage: 45,
    limit: 100
  };
};
