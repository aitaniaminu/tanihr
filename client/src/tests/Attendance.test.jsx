import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { SettingsProvider } from '../context/SettingsContext';
import Attendance from '../pages/Attendance';

const mockEmployees = [
  { id: 'emp-1', surname: 'Doe', firstName: 'John', department: 'HR' },
  { id: 'emp-2', surname: 'Smith', firstName: 'Jane', department: 'IT' },
];

const mockAttendanceLogs = [
  { id: 'att-1', employeeId: 'emp-1', date: '2026-05-20', clockIn: '2026-05-20T08:00:00Z', clockOut: '2026-05-20T17:00:00Z' },
  { id: 'att-2', employeeId: 'emp-2', date: '2026-05-20', clockIn: '2026-05-20T09:00:00Z', clockOut: '2026-05-20T18:00:00Z' },
  { id: 'att-3', employeeId: 'emp-1', date: '2026-05-19', clockIn: '2026-05-19T08:30:00Z', clockOut: '2026-05-19T16:30:00Z' },
];

vi.mock('../db/indexedDB', () => ({
  db: {
    employees: {
      toArray: vi.fn(() => Promise.resolve(mockEmployees)),
    },
    attendanceLogs: {
      toArray: vi.fn(() => Promise.resolve(mockAttendanceLogs)),
      add: vi.fn(() => Promise.resolve('new-att')),
      update: vi.fn(() => Promise.resolve()),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          first: vi.fn(() => Promise.resolve(null)),
        })),
      })),
    },
  },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'emp-1', username: 'admin', role: 'Super Admin' },
    isAuthenticated: true,
  })),
}));

const renderWithProviders = (ui) => {
  return render(
    <BrowserRouter>
      <SettingsProvider>
        {ui}
      </SettingsProvider>
    </BrowserRouter>
  );
};

describe('Attendance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders attendance header', async () => {
    renderWithProviders(<Attendance />);
    expect(await screen.findByRole('heading', { name: /^attendance$/i })).toBeInTheDocument();
  });

  test('shows clock in and clock out buttons', async () => {
    renderWithProviders(<Attendance />);
    expect(await screen.findByRole('button', { name: /clock in/i })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /clock out/i })).toBeInTheDocument();
  });

  test('shows attendance stats cards', async () => {
    renderWithProviders(<Attendance />);
    expect(await screen.findByText(/hours today/i)).toBeInTheDocument();
    expect(await screen.findByText(/this week/i)).toBeInTheDocument();
    expect(await screen.findByText(/this month/i)).toBeInTheDocument();
  });

  test('shows attendance history table', async () => {
    renderWithProviders(<Attendance />);
    expect(await screen.findByText(/attendance history/i)).toBeInTheDocument();
  });

  test('shows employee selector', async () => {
    renderWithProviders(<Attendance />);
    expect(await screen.findByRole('combobox')).toBeInTheDocument();
  });

  test('shows date picker filter fields', async () => {
    renderWithProviders(<Attendance />);
    const dateInputs = await screen.findAllByDisplayValue('');
    expect(dateInputs.length).toBeGreaterThanOrEqual(2);
  });

  test('clock in button is enabled when not clocked in', async () => {
    renderWithProviders(<Attendance />);
    const clockInBtn = await screen.findByRole('button', { name: /clock in/i });
    expect(clockInBtn).not.toBeDisabled();
  });

  test('displays attendance records in table', async () => {
    renderWithProviders(<Attendance />);
    expect(await screen.findByText(/attendance history/i)).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /employee/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /clock in/i })).toBeInTheDocument();
  });
});
