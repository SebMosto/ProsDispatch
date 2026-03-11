import { describe, it, expect, vi } from 'vitest';

// This is a lightweight unit-style test that focuses on the subscription
// update logic by mocking out the external Stripe and Supabase dependencies.

vi.mock('https://esm.sh/stripe@14.14.0?target=deno', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      webhooks: {
        constructEvent: vi.fn((body: string) => JSON.parse(body)),
      },
      subscriptions: {
        retrieve: vi.fn(async () => ({
          status: 'past_due',
          current_period_end: Math.floor(Date.now() / 1000),
        })),
      },
    })),
  };
});

describe('stripe-webhook-handler subscription events', () => {
  it('updates profile on customer.subscription.updated with past_due', async () => {
    const updates: Record<string, unknown> = {};

    const mockFrom = vi.fn().mockReturnValue({
      update: vi.fn().mockImplementation((input) => {
        Object.assign(updates, input);
        return {
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }),
    });

    const mockCreateClient = vi.fn().mockReturnValue({
      from: mockFrom,
    });

    const mockEnv = {
      STRIPE_SECRET_KEY: 'sk_test',
      STRIPE_WEBHOOK_SECRET: 'whsec_test',
      SUPABASE_URL: 'http://localhost',
      SUPABASE_SERVICE_ROLE_KEY: 'service_role',
    };

    const handlerModule = await import('./index.ts');

    const body = JSON.stringify({
      id: 'evt_1',
      type: 'customer.subscription.updated',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          customer: 'cus_123',
          status: 'past_due',
          current_period_end: Math.floor(Date.now() / 1000),
        },
      },
    });

    const req = new Request('http://localhost', {
      method: 'POST',
      headers: {
        'stripe-signature': 'test_signature',
      },
      body,
    });

    const res = await (handlerModule as unknown as (req: Request) => Promise<Response>)(req);

    expect(res.status).toBe(200);
    expect(updates.subscription_status).toBe('past_due');
  });
});

