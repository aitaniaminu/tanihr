import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Login from '../pages/Login';

const mockFirst = vi.fn();
const mockEquals = vi.fn(() => ({ first: mockFirst }));

vi.mock('../db/indexedDB', () => ({
  db: {
    users: {
      toArray: vi.fn(),
      where: vi.fn(() => ({ equals: mockEquals })),
      add: vi.fn(),
    },
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(() => Promise.resolve('hashed_password')),
    compare: vi.fn(),
  },
}));

import { db } from '../db/indexedDB';
import bcrypt from 'bcryptjs';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.users.toArray.mockResolvedValue([]);
    mockFirst.mockReset();
    bcrypt.compare.mockReset();
    db.users.add.mockReset();
  });

  it('should render the login form with title', () => {
    render(<Login />);
    expect(screen.getByText('TaniHR')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('should have username and password inputs', () => {
    render(<Login />);
    expect(screen.getByPlaceholderText('Enter your username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
  });

  it('should show error message on failed login', async () => {
    db.users.toArray.mockResolvedValue([]);
    mockFirst.mockResolvedValue(null);
    const user = userEvent.setup();
    render(<Login />);

    await user.type(screen.getByPlaceholderText('Enter your username'), 'wrong');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'wrong');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    expect(await screen.findByText('Invalid username or password')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should disable submit button while loading', async () => {
    db.users.toArray.mockImplementation(() => new Promise(() => {}));
    const user = userEvent.setup();
    render(<Login />);

    await user.type(screen.getByPlaceholderText('Enter your username'), 'admin');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'admin123');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      const submitBtn = buttons.find((b) => b.type === 'submit');
      expect(submitBtn).toBeDisabled();
    });
  });

  it('should create default admin when no users exist', async () => {
    db.users.toArray.mockResolvedValue([]);
    mockFirst.mockResolvedValue(null);
    bcrypt.compare.mockResolvedValue(false);
    const user = userEvent.setup();
    render(<Login />);

    await user.type(screen.getByPlaceholderText('Enter your username'), 'admin');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'admin123');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => {
      expect(db.users.add).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'admin',
          role: 'admin',
        })
      );
    });
  });

  it('should navigate to dashboard on successful login', async () => {
    const mockUser = {
      id: 'admin',
      username: 'admin',
      password: 'hashed',
      role: 'admin',
      fullName: 'Admin',
    };
    db.users.toArray.mockResolvedValue([mockUser]);
    mockFirst.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    const user = userEvent.setup();
    render(<Login />);

    await user.type(screen.getByPlaceholderText('Enter your username'), 'admin');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'admin123');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  it('should have an accessible error alert', async () => {
    db.users.toArray.mockResolvedValue([]);
    mockFirst.mockResolvedValue(null);
    bcrypt.compare.mockResolvedValue(false);
    const user = userEvent.setup();
    render(<Login />);

    await user.type(screen.getByPlaceholderText('Enter your username'), 'wrong');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'wrong');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});
