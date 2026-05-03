import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Login from '../pages/Login';

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

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the login form with title', () => {
    render(<Login />);
    expect(screen.getByText('TaniHR')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('should have email and password inputs', () => {
    render(<Login />);
    expect(screen.getByPlaceholderText('admin or admin@tanihr.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
  });

  it('should have submit button', () => {
    render(<Login />);
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('should show Supabase authentication notice', () => {
    render(<Login />);
    expect(screen.getByText(/Powered by Supabase/)).toBeInTheDocument();
  });
});