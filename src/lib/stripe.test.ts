import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the stripe-js library
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn().mockResolvedValue({ elements: vi.fn() }),
}));

describe('Stripe Initialization', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should not initialize Stripe when key is missing', async () => {
    // Simulate missing key
    vi.stubEnv('VITE_STRIPE_PUBLISHABLE_KEY', '');

    // Re-import module to trigger top-level execution
    const { stripePromise } = await import('./stripe');

    expect(stripePromise).toBeNull();
  });

  it('should initialize Stripe when key is present', async () => {
    // Simulate present key
    vi.stubEnv('VITE_STRIPE_PUBLISHABLE_KEY', 'pk_test_mock_key');

    const { stripePromise } = await import('./stripe');

    expect(stripePromise).not.toBeNull();
    const stripe = await stripePromise;
    expect(stripe).toBeDefined();
  });
});
