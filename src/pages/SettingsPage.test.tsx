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

// Mock PageLoader
vi.mock('../components/ui/PageLoader', () => ({
  PageLoader: () => <div data-testid="page-loader">Loading...</div>,
}));

describe('SettingsPage', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };
  const mockProfile = { full_name: 'John Doe', business_name: 'Acme Corp' };
  const mockRefreshProfile = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as unknown as Mock).mockReturnValue({
      user: mockUser,
      refreshProfile: mockRefreshProfile,
      profile: mockProfile,
      subscriptionStatus: 'trialing',
      trialDaysRemaining: 14,
    });
  });

  it('displays profile data from auth context', async () => {
    render(<SettingsPage />);

    expect(await screen.findByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('updates profile on submit', async () => {
    (profileRepository.update as unknown as Mock).mockResolvedValue({
      data: { ...mockProfile, full_name: 'Jane Doe' },
      error: null
    });

    render(<SettingsPage />);

    await screen.findByDisplayValue('John');

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

  it('renders safely when user is missing', async () => {
    (useAuth as unknown as Mock).mockReturnValue({
      user: null,
      refreshProfile: mockRefreshProfile,
      profile: null,
      subscriptionStatus: 'trialing',
      trialDaysRemaining: 14,
    });

    render(<SettingsPage />);
    expect(await screen.findByText('settings.title')).toBeInTheDocument();
  });

  it('displays an error message if profile update fails', async () => {
    (profileRepository.update as unknown as Mock).mockResolvedValue({
      data: null,
      error: { message: 'Update failed' }
    });

    render(<SettingsPage />);

    await screen.findByDisplayValue('John');

    const saveButton = screen.getByRole('button', { name: 'settings.profile.save' });
    fireEvent.click(saveButton);

    expect(await screen.findByText('settings.profile.error')).toBeInTheDocument();
    expect(mockRefreshProfile).not.toHaveBeenCalled();
  });
});
