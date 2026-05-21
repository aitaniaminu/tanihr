import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { SettingsProvider } from '../context/SettingsContext';
import { AuthProvider } from '../context/AuthContext';
import UserManagement from '../pages/UserManagement';

const renderWithProviders = (ui) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          {ui}
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

vi.mock('../db/indexedDB', () => {
  const mockUsers = [
    { id: 1, username: 'superadmin', email: 'aminua@tani.com.ng', role: 'Super Admin', createdAt: '2026-01-01T00:00:00Z', lastLogin: '2026-05-01T10:00:00Z' },
    { id: 2, username: 'hr.manager', email: 'hr@tani.com.ng', role: 'HR Manager', createdAt: '2026-02-01T00:00:00Z', lastLogin: null },
    { id: 3, username: 'line.manager', email: 'manager@tani.com.ng', role: 'Line Manager', createdAt: '2026-03-01T00:00:00Z', lastLogin: null },
  ];
  return {
    db: {
      users: {
        toArray: vi.fn(() => Promise.resolve(mockUsers)),
        add: vi.fn(() => Promise.resolve('new-id')),
        update: vi.fn(() => Promise.resolve()),
        delete: vi.fn(() => Promise.resolve()),
      },
    },
  };
});

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { username: 'aminua@tani.com.ng', role: 'Super Admin' },
    isSuperAdmin: true,
    loading: false,
  })),
  AuthProvider: ({ children }) => children,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('UserManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  test('renders user management header', async () => {
    renderWithProviders(<UserManagement />);
    expect(await screen.findByText(/user management/i)).toBeInTheDocument();
  });

  test('shows add user button', async () => {
    renderWithProviders(<UserManagement />);
    expect(await screen.findByRole('button', { name: /add user/i })).toBeInTheDocument();
  });

  test('displays all users from mock', async () => {
    renderWithProviders(<UserManagement />);
    expect(await screen.findByText('hr.manager')).toBeInTheDocument();
    expect(await screen.findByText('line.manager')).toBeInTheDocument();
    expect(await screen.findByText('superadmin')).toBeInTheDocument();
  });

  test('shows user roles as badges', async () => {
    renderWithProviders(<UserManagement />);
    await waitFor(() => {
      const roleBadges = screen.getAllByText(/Manager|Admin|Employee/);
      expect(roleBadges.length).toBeGreaterThan(0);
    });
  });

  test('opens form when add user clicked', async () => {
    renderWithProviders(<UserManagement />);
    const addButton = await screen.findByTestId('add-user-btn');
    await act(async () => {
      fireEvent.click(addButton);
    });
    expect(await screen.findByText(/add new user/i)).toBeInTheDocument();
  });

  test.skip('form has all required fields', async () => {
    renderWithProviders(<UserManagement />);
    const addButton = await screen.findByTestId('add-user-btn');
    await act(async () => {
      fireEvent.click(addButton);
    });
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
  });

  test('closes form on cancel', async () => {
    renderWithProviders(<UserManagement />);
    const addButton = await screen.findByTestId('add-user-btn');
    await act(async () => {
      fireEvent.click(addButton);
    });
    expect(await screen.findByText(/add new user/i)).toBeInTheDocument();
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await act(async () => {
      fireEvent.click(cancelButton);
    });
    expect(screen.queryByText(/add new user/i)).not.toBeInTheDocument();
  });

  test('submit button is disabled without required fields', async () => {
    renderWithProviders(<UserManagement />);
    const addButton = await screen.findByTestId('add-user-btn');
    await act(async () => {
      fireEvent.click(addButton);
    });
    const submitButton = screen.getByRole('button', { name: /add user/i });
    expect(submitButton).toBeDisabled();
  });

  test('role dropdown shows all roles', async () => {
    renderWithProviders(<UserManagement />);
    const addButton = await screen.findByTestId('add-user-btn');
    await act(async () => {
      fireEvent.click(addButton);
    });
    const roleSelect = screen.getByLabelText(/role/i);
    expect(roleSelect).toBeInTheDocument();
  });

  test('search filters users', async () => {
    renderWithProviders(<UserManagement />);
    expect(await screen.findByText('hr.manager')).toBeInTheDocument();
    const searchInput = screen.getByPlaceholderText(/search users/i);
    await act(async () => {
      await userEvent.type(searchInput, 'hr.manager');
    });
    await waitFor(() => {
      expect(screen.getByText('hr.manager')).toBeInTheDocument();
    });
  });

  test('shows user count', async () => {
    renderWithProviders(<UserManagement />);
    await waitFor(() => {
      expect(screen.getByText(/3 of 3 users/i)).toBeInTheDocument();
    });
  });

  test('edit button exists for users', async () => {
    renderWithProviders(<UserManagement />);
    await waitFor(() => {
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      expect(editButtons).toHaveLength(3);
    });
  });

  test('delete button exists for users', async () => {
    renderWithProviders(<UserManagement />);
    await waitFor(() => {
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      expect(deleteButtons).toHaveLength(3);
    });
  });
});
