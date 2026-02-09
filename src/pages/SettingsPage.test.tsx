import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest';
import SettingsPage from './SettingsPage';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
vi.mock('../lib/auth');
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null }))
      }))
    }))
  }
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en', changeLanguage: vi.fn().mockResolvedValue(undefined) } }),
}));

// Mock LanguageSwitcher since it uses window.location.reload
vi.mock('../components/LanguageSwitcher', () => ({
  default: () => <div data-testid="language-switcher">Language Switcher</div>
}));

describe('SettingsPage', () => {
  const mockUseAuth = useAuth as unknown as Mock;
  const mockSupabase = supabase as unknown as { from: Mock };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', email: 'test@example.com' },
      profile: {
        id: 'user-123',
        full_name: 'Test User',
        business_name: 'Test Business',
        email: 'test@example.com',
        role: 'contractor',
        stripe_account_id: null
      },
      signOut: vi.fn(),
      loading: false,
    });
  });

  it('renders profile form with existing values', () => {
    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );

    expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Business')).toBeInTheDocument();
  });

  it('submits profile update', async () => {
    const updateMock = vi.fn(() => ({
      eq: vi.fn(() => ({ error: null }))
    }));

    mockSupabase.from.mockReturnValue({
      update: updateMock
    });

    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );

    const nameInput = screen.getByLabelText('profile.field.full_name');
    fireEvent.change(nameInput, { target: { value: 'Updated Name' } });

    const saveButton = screen.getByText('common.save');
    fireEvent.click(saveButton);

    await waitFor(() => {
        expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({
            full_name: 'Updated Name'
        }));
    });

    expect(screen.getByText('common.success')).toBeInTheDocument();
  });

  it('calls signOut when sign out button is clicked', () => {
    const signOutMock = vi.fn();
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123' },
      profile: {},
      signOut: signOutMock,
      loading: false,
    });

    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );

    const signOutButton = screen.getByText('auth.dashboard.signOut');
    fireEvent.click(signOutButton);

    expect(signOutMock).toHaveBeenCalled();
  });

  it('displays Stripe Connect info if connected', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123' },
      profile: {
        id: 'user-123',
        stripe_account_id: 'acct_12345',
        stripe_customer_id: 'cus_12345'
      },
      signOut: vi.fn(),
      loading: false,
    });

    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );

    expect(screen.getByText('settings.stripe.title')).toBeInTheDocument();
    expect(screen.getByText('acct_12345')).toBeInTheDocument();
    expect(screen.getByText('cus_12345')).toBeInTheDocument();
  });
});
