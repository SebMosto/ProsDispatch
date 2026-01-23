import { loadStripe } from '@stripe/stripe-js';

// Load the publishable key from the environment
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublicKey) {
  console.warn('Stripe publishable key is missing. Payment features will be disabled.');
}

// Initialize Stripe Promise (Singleton pattern to avoid reloading script)
export const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;
