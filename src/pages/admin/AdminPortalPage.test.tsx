import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import AdminPortalPage from './AdminPortalPage';

vi.mock('../../lib/auth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('AdminPortalPage', () => {
  it('redirects non-admin users', () => {
    vi.mocked(useAuth).mockReturnValue({
      profile: { role: 'contractor' },
      loading: false,
    } as unknown as ReturnType<typeof useAuth>);

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<AdminPortalPage />} />
          <Route path="/" element={<div data-testid="home">Home</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('home')).toBeInTheDocument();
  });

  it('renders metrics for admin users', async () => {
    vi.mocked(useAuth).mockReturnValue({
      profile: { role: 'admin' },
      loading: false,
    } as unknown as ReturnType<typeof useAuth>);

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [{
        total_users: 150,
        active_subscriptions: 45,
        total_jobs: 320,
        total_revenue_cents: 1500000,
      }],
      error: null,
    } as unknown as ReturnType<typeof supabase.rpc>);

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<AdminPortalPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
    });
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('320')).toBeInTheDocument();
    expect(screen.getByText('$15000.00')).toBeInTheDocument();
  });
});
