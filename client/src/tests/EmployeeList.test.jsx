import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EmployeeList from '../pages/Employees/EmployeeList';
import { db } from '../db/indexedDB';

vi.mock('../db/indexedDB', () => {
  const mockDb = {
    employees: { toArray: vi.fn(() => Promise.resolve([])) },
  };
  return { db: mockDb };
});

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams(''), vi.fn()],
}));

describe('EmployeeList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.employees.toArray.mockResolvedValue([]);
  });

  const mockEmployees = [
    {
      id: 1,
      fileNumber: 'EMP001',
      surname: 'Adebayo',
      firstName: 'Olu',
      department: 'IT',
      rank: 'GL-10',
      retirementDate: null,
    },
    {
      id: 2,
      fileNumber: 'EMP002',
      surname: 'Balogun',
      firstName: 'Kemi',
      department: 'HR',
      rank: 'GL-08',
      retirementDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // ~6 months
    },
    {
      id: 3,
      fileNumber: 'EMP003',
      surname: 'Chukwu',
      firstName: 'Emeka',
      department: 'Finance',
      rank: 'GL-12',
      retirementDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // retired
    },
  ];

  it('should show loading state initially', () => {
    db.employees.toArray.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve([]), 100)));
    render(<EmployeeList />);
    expect(screen.getByText('Loading employees...')).toBeInTheDocument();
  });

  it('should load and display employees from IndexedDB', async () => {
    db.employees.toArray.mockResolvedValue(mockEmployees);
    render(<EmployeeList />);

    await waitFor(() => {
      expect(screen.getByText('Adebayo, Olu')).toBeInTheDocument();
    });
    expect(screen.getByText('EMP001')).toBeInTheDocument();
    expect(screen.getAllByText('IT')[0]).toBeInTheDocument();
    expect(screen.getByText('GL-10')).toBeInTheDocument();
  });

  it('should show error state when DB load fails', async () => {
    db.employees.toArray.mockRejectedValue(new Error('DB error'));
    render(<EmployeeList />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load employee data. Please refresh the page.')).toBeInTheDocument();
    });
    expect(screen.getByText('Refresh page')).toBeInTheDocument();
  });

  it('should show empty state when no employees exist', async () => {
    db.employees.toArray.mockResolvedValue([]);
    render(<EmployeeList />);

    await waitFor(() => {
      expect(screen.getByText('No employees found. Import CSV or add manually.')).toBeInTheDocument();
    });
  });

  it('should filter employees by surname', async () => {
    db.employees.toArray.mockResolvedValue(mockEmployees);
    render(<EmployeeList />);

    await waitFor(() => {
      expect(screen.getByText('Adebayo, Olu')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText('Search employees');
    await userEvent.type(searchInput, 'Chukwu');

    expect(screen.getByText('Chukwu, Emeka')).toBeInTheDocument();
    expect(screen.queryByText('Adebayo, Olu')).not.toBeInTheDocument();
  });

  it('should filter employees by first name', async () => {
    db.employees.toArray.mockResolvedValue(mockEmployees);
    render(<EmployeeList />);

    await waitFor(() => {
      expect(screen.getByText('Adebayo, Olu')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText('Search employees');
    await userEvent.type(searchInput, 'Kemi');

    expect(screen.getByText('Balogun, Kemi')).toBeInTheDocument();
    expect(screen.queryByText('Adebayo, Olu')).not.toBeInTheDocument();
  });

  it('should filter employees by file number', async () => {
    db.employees.toArray.mockResolvedValue(mockEmployees);
    render(<EmployeeList />);

    await waitFor(() => {
      expect(screen.getByText('EMP001')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText('Search employees');
    await userEvent.type(searchInput, 'EMP003');

    expect(screen.getByText('EMP003')).toBeInTheDocument();
    expect(screen.queryByText('EMP001')).not.toBeInTheDocument();
  });

  it('should show no results message when search has no matches', async () => {
    db.employees.toArray.mockResolvedValue(mockEmployees);
    render(<EmployeeList />);

    await waitFor(() => {
      expect(screen.getByText('Adebayo, Olu')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText('Search employees');
    await userEvent.type(searchInput, 'NonExistent');

    expect(screen.getByText('No employees match your filters.')).toBeInTheDocument();
  });

  it('should show Active status for employees without retirement date', async () => {
    db.employees.toArray.mockResolvedValue(mockEmployees);
    render(<EmployeeList />);

    await waitFor(() => {
      const table = screen.getByRole('table');
      expect(within(table).getByText('Active')).toBeInTheDocument();
    });
  });

  it('should show Retired status for past retirement date', async () => {
    db.employees.toArray.mockResolvedValue(mockEmployees);
    render(<EmployeeList />);

    await waitFor(() => {
      const table = screen.getByRole('table');
      expect(within(table).getByText('Retired')).toBeInTheDocument();
    });
  });

  it('should show Approaching status for retirement within 12 months', async () => {
    db.employees.toArray.mockResolvedValue(mockEmployees);
    render(<EmployeeList />);

    await waitFor(() => {
      expect(screen.getByText(/Approaching/)).toBeInTheDocument();
    });
  });
});
