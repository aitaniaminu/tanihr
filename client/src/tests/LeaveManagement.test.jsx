import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { SettingsProvider } from '../context/SettingsContext';
import { AuthProvider } from '../context/AuthContext';
import LeaveManagement from '../pages/LeaveManagement';

vi.mock('../db/indexedDB', () => {
  const mockLeaveTypes = [
    { id: 1, name: 'Annual Leave', daysAllowed: 30, isPaid: true },
    { id: 2, name: 'Sick Leave', daysAllowed: 10, isPaid: true },
    { id: 3, name: 'Maternity Leave', daysAllowed: 84, isPaid: true },
  ];
  const mockRequests = [
    { id: 'req-1', employeeId: 'emp-1', leaveType: 'Annual', startDate: '2026-06-01', endDate: '2026-06-05', days: 5, status: 'Pending', employeeName: 'Doe, John' },
    { id: 'req-2', employeeId: 'emp-2', leaveType: 'Sick', startDate: '2026-07-01', endDate: '2026-07-03', days: 3, status: 'Approved', employeeName: 'Smith, Jane' },
  ];
  const mockHolidays = [
    { id: 1, date: '2026-01-01', name: "New Year's Day", scope: 'Federal' },
    { id: 2, date: '2026-12-25', name: 'Christmas Day', scope: 'Federal' },
  ];
  return {
    db: {
      leaveTypes: {
        toArray: vi.fn(() => Promise.resolve(mockLeaveTypes)),
        bulkAdd: vi.fn(() => Promise.resolve()),
        count: vi.fn(() => Promise.resolve(mockLeaveTypes.length)),
      },
      leaveRequests: {
        toArray: vi.fn(() => Promise.resolve(mockRequests)),
        update: vi.fn(() => Promise.resolve()),
        add: vi.fn(() => Promise.resolve('new-id')),
      },
      employees: {
        toArray: vi.fn(() => Promise.resolve([
          { id: 'emp-1', surname: 'Doe', firstName: 'John', department: 'HR' },
          { id: 'emp-2', surname: 'Smith', firstName: 'Jane', department: 'IT' },
        ])),
      },
      publicHolidays: {
        toArray: vi.fn(() => Promise.resolve(mockHolidays)),
        count: vi.fn(() => Promise.resolve(mockHolidays.length)),
        bulkAdd: vi.fn(() => Promise.resolve()),
      },
    },
  };
});

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { username: 'admin', role: 'Super Admin', roles: ['super_admin'] },
    loading: false,
    hasPermission: vi.fn(() => true),
    isSuperAdmin: true,
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

describe('LeaveManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  test('renders leave management header', async () => {
    renderWithProviders(<LeaveManagement />);
    expect(await screen.findByText(/leave management/i)).toBeInTheDocument();
  });

  test('shows stats cards', async () => {
    renderWithProviders(<LeaveManagement />);
    expect(await screen.findByText(/total requests/i)).toBeInTheDocument();
    const statsSection = screen.getByText(/total requests/i).closest('.grid');
    expect(within(statsSection).getByText('2')).toBeInTheDocument();
    expect(within(statsSection).getByText(/pending/i)).toBeInTheDocument();
    expect(within(statsSection).getByText(/approved/i)).toBeInTheDocument();
  });

  test('shows Request Leave button', async () => {
    renderWithProviders(<LeaveManagement />);
    expect(await screen.findByRole('button', { name: /request leave/i })).toBeInTheDocument();
  });

  test('shows tabs: Requests, Balances, Public Holidays', async () => {
    renderWithProviders(<LeaveManagement />);
    expect(await screen.findByRole('button', { name: /requests/i })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /balances/i })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /public holidays/i })).toBeInTheDocument();
  });

  test('opens leave request form when button clicked', async () => {
    renderWithProviders(<LeaveManagement />);
    fireEvent.click(await screen.findByTestId('request-leave-btn'));
    expect(await screen.findByTestId('form-heading')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /leave type/i })).toBeInTheDocument();
  });

  test('switches to Balances tab', async () => {
    renderWithProviders(<LeaveManagement />);
    fireEvent.click(await screen.findByRole('button', { name: /balances/i }));
    expect(await screen.findByText(/doe, john/i)).toBeInTheDocument();
  });

  test('switches to Public Holidays tab', async () => {
    renderWithProviders(<LeaveManagement />);
    fireEvent.click(await screen.findByRole('button', { name: /public holidays/i }));
    expect(await screen.findByText(/new year/i)).toBeInTheDocument();
  });

  test('closes form on cancel', async () => {
    renderWithProviders(<LeaveManagement />);
    fireEvent.click(await screen.findByTestId('request-leave-btn'));
    expect(await screen.findByTestId('form-heading')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('cancel-form'));
    expect(screen.queryByTestId('form-heading')).not.toBeInTheDocument();
  });

  test('form has employee select, dates, reason fields', async () => {
    renderWithProviders(<LeaveManagement />);
    fireEvent.click(await screen.findByTestId('request-leave-btn'));
    expect(screen.getByRole('combobox', { name: /employee/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/reason/i)).toBeInTheDocument();
  });

  test('submit button exists in form', async () => {
    renderWithProviders(<LeaveManagement />);
    fireEvent.click(await screen.findByTestId('request-leave-btn'));
    expect(screen.getByRole('button', { name: /submit request/i })).toBeInTheDocument();
  });

  test('leave type dropdown shows all types', async () => {
    renderWithProviders(<LeaveManagement />);
    fireEvent.click(await screen.findByTestId('request-leave-btn'));
    expect(screen.getByRole('option', { name: /annual leave/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /sick leave/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /maternity leave/i })).toBeInTheDocument();
  });

  test('shows existing leave requests in list', async () => {
    renderWithProviders(<LeaveManagement />);
    expect(await screen.findByText(/doe, john/i)).toBeInTheDocument();
    expect(await screen.findByText(/smith, jane/i)).toBeInTheDocument();
  });

  test('public holidays tab shows seeded holidays', async () => {
    renderWithProviders(<LeaveManagement />);
    fireEvent.click(await screen.findByRole('button', { name: /public holidays/i }));
    expect(await screen.findByText(/new year.*day/i)).toBeInTheDocument();
    expect(await screen.findByText(/christmas day/i)).toBeInTheDocument();
  });

  test('shows rejection reason modal on reject click', async () => {
    renderWithProviders(<LeaveManagement />);
    const rejectButtons = await screen.findAllByText('Reject');
    fireEvent.click(rejectButtons[0]);
    expect(await screen.findByText(/reason for rejection/i)).toBeInTheDocument();
  });

  test('status filter dropdown is present', async () => {
    renderWithProviders(<LeaveManagement />);
    expect(await screen.findByRole('combobox', { name: /filter by status/i })).toBeInTheDocument();
  });

  test('shows next working day info in form', async () => {
    renderWithProviders(<LeaveManagement />);
    fireEvent.click(await screen.findByTestId('request-leave-btn'));
    expect(await screen.findByText(/next working day/i)).toBeInTheDocument();
  });

  test('rejects leave with reason', async () => {
    renderWithProviders(<LeaveManagement />);
    const rejectButtons = await screen.findAllByText('Reject');
    fireEvent.click(rejectButtons[0]);
    const textarea = await screen.findByRole('textbox', { name: /reason for rejection/i });
    await userEvent.type(textarea, 'Insufficient documentation');
    fireEvent.click(screen.getByText('Reject Request'));
    const { db } = await import('../db/indexedDB');
    await waitFor(() => {
      expect(db.leaveRequests.update).toHaveBeenCalledWith('req-1', expect.objectContaining({
        status: 'Rejected',
        rejectionReason: 'Insufficient documentation',
      }));
    });
  });

  test('approve updates status and tracks approver', async () => {
    renderWithProviders(<LeaveManagement />);
    const approveButtons = await screen.findAllByText('Approve');
    fireEvent.click(approveButtons[0]);
    const { db } = await import('../db/indexedDB');
    await waitFor(() => {
      expect(db.leaveRequests.update).toHaveBeenCalledWith('req-1', expect.objectContaining({
        status: 'Approved',
        approvedBy: 'admin',
      }));
    });
  });
});
