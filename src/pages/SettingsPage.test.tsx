import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';
import SettingsPage from './SettingsPage';
import { useAuth } from '../lib/auth';
import { profileRepository } from '../repositories/profileRepository';

// Mock dependencies
const mockT = (key: string) => key;
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: {
      language: 'en',
      changeLanguage: vi.fn().mockResolvedValue(undefined),
    },
  }),
}));

vi.mock('../repositories/profileRepository', () => ({
  profileRepository: {
    get: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('../lib/auth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../repositories/profileRepository', () => ({
  profileRepository: {
    get: vi.fn(),
    update: vi.fn(),
  },
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
      profile: null,
      subscriptionStatus: 'trialing',
      trialDaysRemaining: 14,
    });
  });

  it('displays profile data from auth context', async () => {
    const mockProfile = { full_name: 'John Doe', business_name: 'Acme Corp' };
    (useAuth as unknown as Mock).mockReturnValue({
      user: mockUser,
      refreshProfile: mockRefreshProfile,
      profile: mockProfile,
      subscriptionStatus: 'trialing',
      trialDaysRemaining: 14,
    });

    render(<SettingsPage />);

    expect(await screen.findByDisplayValue('John')).toBeInTheDocument();
    expect(await screen.findByDisplayValue('Doe')).toBeInTheDocument();
    expect(await screen.findByDisplayValue('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('updates profile on submit', async () => {
    const mockProfile = { full_name: 'John Doe', business_name: 'Acme Corp' };
    (useAuth as unknown as Mock).mockReturnValue({
      user: mockUser,
      refreshProfile: mockRefreshProfile,
      profile: mockProfile,
      subscriptionStatus: 'trialing',
      trialDaysRemaining: 14,
    });
    (profileRepository.update as unknown as Mock).mockResolvedValue({ data: { ...mockProfile, full_name: 'Jane Doe' }, error: null });

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    });

    const firstNameInput = screen.getByLabelText('settings.fields.firstName');
    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

    const saveButton = screen.getByRole('button', { name: 'settings.profile.save' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(profileRepository.update).toHaveBeenCalledWith(mockUser.id, expect.objectContaining({
        full_name: 'Jane Doe',
        business_name: 'Acme Corp',
      }));
    });

    expect(mockRefreshProfile).toHaveBeenCalledTimes(1);
    expect(screen.getByText('settings.profile.success')).toBeInTheDocument();
  });

  it('displays an error message if profile update fails', async () => {
    const mockProfile = { full_name: 'John Doe', business_name: 'Acme Corp' };
    (useAuth as unknown as Mock).mockReturnValue({
      user: mockUser,
      refreshProfile: mockRefreshProfile,
      profile: mockProfile,
      subscriptionStatus: 'trialing',
      trialDaysRemaining: 14,
    });
    (profileRepository.update as unknown as Mock).mockResolvedValue({ 
      data: null, 
      error: { message: 'Update failed' } 
    });

    render(<SettingsPage />);

    // Wait for form to be populated
    await screen.findByDisplayValue('John');

    const saveButton = screen.getByRole('button', { name: 'settings.profile.save' });
    fireEvent.click(saveButton);

    // Check for error message
    expect(await screen.findByText('settings.profile.error')).toBeInTheDocument();
    expect(mockRefreshProfile).not.toHaveBeenCalled();
  });
});
