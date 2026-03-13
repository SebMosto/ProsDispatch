import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import StripeConnectPage from './StripeConnectPage';

vi.mock('../lib/auth', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@example.com' },
    refreshProfile: vi.fn(),
  }),
}));

vi.mock('../repositories/profileRepository', () => ({
  profileRepository: {
    getStripeConnect: vi.fn().mockResolvedValue({
      data: {
        stripe_connect_id: null,
        stripe_connect_onboarded: false,
      },
      error: null,
    }),
  },
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { url: 'https://example.com' }, error: null }),
    },
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('StripeConnectPage', () => {
  it('renders connect CTA when not connected', async () => {
    render(<StripeConnectPage />);

    expect(await screen.findByText('settings.stripe.cta')).toBeInTheDocument();
    expect(screen.getByText('settings.stripe.connect')).toBeInTheDocument();
  });
});

