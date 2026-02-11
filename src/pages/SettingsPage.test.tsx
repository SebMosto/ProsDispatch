import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';
import SettingsPage from './SettingsPage';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('../lib/auth', () => ({
  useAuth: vi.fn(),
}));

// Mock PageLoader
vi.mock('../components/ui/PageLoader', () => ({
  PageLoader: () => <div data-testid="page-loader">Loading...</div>,
}));

describe('SettingsPage', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };
  const mockRefreshProfile = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as unknown as Mock).mockReturnValue({ 
      user: mockUser,
      refreshProfile: mockRefreshProfile,
    });
  });

  it('fetches and displays profile data', async () => {
    const mockProfile = { full_name: 'John Doe', business_name: 'Acme Corp' };

    const singleMock = vi.fn().mockResolvedValue({ data: mockProfile, error: null });
    const eqMock = vi.fn().mockReturnValue({ single: singleMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
    (supabase.from as unknown as Mock).mockReturnValue({ select: selectMock });

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('settings.profile.fullName')).toHaveValue('John Doe');
      expect(screen.getByLabelText('settings.profile.businessName')).toHaveValue('Acme Corp');
      expect(screen.getByLabelText('settings.profile.email')).toHaveValue('test@example.com');
    });

    expect(supabase.from).toHaveBeenCalledWith('profiles');
  });

  it('updates profile on submit', async () => {
    const mockProfile = { full_name: 'John Doe', business_name: 'Acme Corp' };

    const singleMock = vi.fn().mockResolvedValue({ data: mockProfile, error: null });
    const selectEqMock = vi.fn().mockReturnValue({ single: singleMock });
    const selectMock = vi.fn().mockReturnValue({ eq: selectEqMock });

    const updateEqMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: updateEqMock });

    (supabase.from as unknown as Mock).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: selectMock,
          update: updateMock,
        };
      }
      return {};
    });

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('settings.profile.fullName')).toHaveValue('John Doe');
    });

    const nameInput = screen.getByLabelText('settings.profile.fullName');
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

    const saveButton = screen.getByRole('button', { name: 'settings.profile.save' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({
        full_name: 'Jane Doe',
        business_name: 'Acme Corp',
      }));
    });

    expect(mockRefreshProfile).toHaveBeenCalledTimes(1);
    expect(screen.getByText('settings.profile.success')).toBeInTheDocument();
  });
});
