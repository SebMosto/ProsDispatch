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
    (profileRepository.get as unknown as Mock).mockResolvedValue({ data: mockProfile, error: null });

    render(<SettingsPage />);

    expect(await screen.findByDisplayValue('John Doe')).toBeInTheDocument();
    expect(await screen.findByDisplayValue('Acme Corp')).toBeInTheDocument();
    expect(screen.getByLabelText('settings.profile.email')).toHaveValue('test@example.com');

    expect(profileRepository.get).toHaveBeenCalledWith(mockUser.id);
  });

  it('updates profile on submit', async () => {
    const mockProfile = { full_name: 'John Doe', business_name: 'Acme Corp' };
    (profileRepository.get as unknown as Mock).mockResolvedValue({ data: mockProfile, error: null });
    (profileRepository.update as unknown as Mock).mockResolvedValue({ data: { ...mockProfile, full_name: 'Jane Doe' }, error: null });

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('settings.profile.fullName')).toHaveValue('John Doe');
    });

    const nameInput = screen.getByLabelText('settings.profile.fullName');
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

    const saveButton = screen.getByRole('button', { name: 'settings.profile.save' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(profileRepository.update).toHaveBeenCalledWith(mockUser.id, expect.objectContaining({
        full_name: 'Jane Doe',
        business_name: 'Acme Corp',
      }));
    });

    expect(mockRefreshProfile).toHaveBeenCalledTimes(1);
    expect(screen.getByText('settings.success')).toBeInTheDocument();
  });
});
