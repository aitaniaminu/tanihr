import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Dashboard from '../pages/Dashboard';
import { db } from '../db/indexedDB';

vi.mock('../db/indexedDB', () => ({
  db: {
    employees: { toArray: vi.fn(() => Promise.resolve([])) },
    departments: { toArray: vi.fn(() => Promise.resolve([])) },
  },
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { username: 'admin' }, logout: vi.fn() }),
}));

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.employees.toArray.mockResolvedValue([]);
    db.departments.toArray.mockResolvedValue([]);
  });

  it('should show loading state while fetching stats', () => {
    db.employees.toArray.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve([]), 100)));
    render(<Dashboard />);
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });

  it('should show error state when fetching stats fails', async () => {
    db.employees.toArray.mockRejectedValue(new Error('DB error'));
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load dashboard statistics.')).toBeInTheDocument();
    });
  });

  it('should display real total employee count from IndexedDB', async () => {
    const mockEmployees = [
      { id: 1, surname: 'A', firstName: 'B', department: 'IT', rank: 'GL-1', retirementDate: null },
      { id: 2, surname: 'C', firstName: 'D', department: 'HR', rank: 'GL-2', retirementDate: null },
      { id: 3, surname: 'E', firstName: 'F', department: 'IT', rank: 'GL-3', retirementDate: null },
    ];
    db.employees.toArray.mockResolvedValue(mockEmployees);
    db.departments.toArray.mockResolvedValue([]);

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('should display zero when no employees exist', async () => {
    db.employees.toArray.mockResolvedValue([]);
    render(<Dashboard />);

    await waitFor(() => {
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('should calculate unique department count from IndexedDB', async () => {
    const mockEmployees = [
      { id: 1, surname: 'A', firstName: 'B', department: 'IT', rank: 'GL-1', retirementDate: null },
      { id: 2, surname: 'C', firstName: 'D', department: 'HR', rank: 'GL-2', retirementDate: null },
      { id: 3, surname: 'E', firstName: 'F', department: 'IT', rank: 'GL-3', retirementDate: null },
      { id: 4, surname: 'G', firstName: 'H', department: 'Finance', rank: 'GL-4', retirementDate: null },
    ];
    db.employees.toArray.mockResolvedValue(mockEmployees);
    db.departments.toArray.mockResolvedValue([]);

    render(<Dashboard />);

    await waitFor(() => {
      const departmentCount = screen.getAllByText('3');
      expect(departmentCount.length).toBeGreaterThan(0);
    });
  });

  it('should calculate retiring soon count (within 12 months)', async () => {
    const now = new Date();
    const future6Months = new Date(now.getFullYear(), now.getMonth() + 6, now.getDate());
    const future18Months = new Date(now.getFullYear(), now.getMonth() + 18, now.getDate());
    const past = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    const mockEmployees = [
      {
        id: 1,
        surname: 'A',
        firstName: 'B',
        department: 'IT',
        rank: 'GL-1',
        retirementDate: future6Months.toISOString().split('T')[0],
      },
      {
        id: 2,
        surname: 'C',
        firstName: 'D',
        department: 'HR',
        rank: 'GL-2',
        retirementDate: future18Months.toISOString().split('T')[0],
      },
      {
        id: 3,
        surname: 'E',
        firstName: 'F',
        department: 'IT',
        rank: 'GL-3',
        retirementDate: past.toISOString().split('T')[0],
      },
      { id: 4, surname: 'G', firstName: 'H', department: 'Finance', rank: 'GL-4', retirementDate: null },
    ];
    db.employees.toArray.mockResolvedValue(mockEmployees);
    db.departments.toArray.mockResolvedValue([]);

    render(<Dashboard />);

    await waitFor(() => {
      const stats = screen.getAllByText('1');
      expect(stats.length).toBeGreaterThan(0);
    });
  });
});
