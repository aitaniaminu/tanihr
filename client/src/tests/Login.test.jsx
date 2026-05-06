import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Login from '../pages/Login';
import { SettingsProvider } from '../context/SettingsContext';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    login: vi.fn(() => Promise.resolve({ success: false, error: 'Invalid credentials' })),
    logout: vi.fn(),
    user: null,
    loading: false,
    isAuthenticated: false,
  })),
  AuthProvider: ({ children }) => children,
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

const renderWithProviders = (ui) => {
  return render(
    <SettingsProvider>
      {ui}
    </SettingsProvider>
  );
};

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render the login form with title', () => {
    renderWithProviders(<Login />);
    expect(screen.getByText('TaniHR')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('should have email and password inputs', () => {
    renderWithProviders(<Login />);
    expect(screen.getByPlaceholderText('Enter your email or username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
  });

  it('should have submit button', () => {
    renderWithProviders(<Login />);
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('should show Tani Nigeria Ltd notice', () => {
    renderWithProviders(<Login />);
    expect(screen.getByText(/Powered by Tani Nigeria Ltd/)).toBeInTheDocument();
  });
});