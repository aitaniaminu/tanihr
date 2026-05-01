import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DepartmentList from '../pages/Departments/DepartmentList';
import { db } from '../db/indexedDB';

vi.mock('../db/indexedDB', () => {
  const mockDb = {
    departments: {
      toArray: vi.fn(() => Promise.resolve([])),
      add: vi.fn(() => Promise.resolve(1)),
      update: vi.fn(() => Promise.resolve()),
      delete: vi.fn(() => Promise.resolve()),
    },
    employees: {
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          count: vi.fn(() => Promise.resolve(0)),
        })),
      })),
    },
  };
  return { db: mockDb };
});

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

describe('DepartmentList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.departments.toArray.mockResolvedValue([]);
    db.employees.where.mockReturnValue({
      equals: vi.fn(() => ({
        count: vi.fn(() => Promise.resolve(0)),
      })),
    });
  });

  const mockDepartments = [
    { id: 1, name: 'Human Resources' },
    { id: 2, name: 'Finance' },
    { id: 3, name: 'ICT' },
  ];

  it('should show loading state initially', () => {
    db.departments.toArray.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve([]), 100)));
    render(<DepartmentList />);
    expect(screen.getByText('Loading departments...')).toBeInTheDocument();
  });

  it('should load and display departments from IndexedDB', async () => {
    db.departments.toArray.mockResolvedValue(mockDepartments);
    render(<DepartmentList />);

    await waitFor(() => {
      expect(screen.getByText('Human Resources')).toBeInTheDocument();
    });
    expect(screen.getByText('Finance')).toBeInTheDocument();
    expect(screen.getByText('ICT')).toBeInTheDocument();
  });

  it('should show error state when DB load fails', async () => {
    db.departments.toArray.mockRejectedValue(new Error('DB error'));
    render(<DepartmentList />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load department data. Please refresh the page.')).toBeInTheDocument();
    });
  });

  it('should show empty state when no departments exist', async () => {
    db.departments.toArray.mockResolvedValue([]);
    render(<DepartmentList />);

    await waitFor(() => {
      expect(screen.getByText('No departments found. Add your first department.')).toBeInTheDocument();
    });
  });

  it('should show employee count per department', async () => {
    db.departments.toArray.mockResolvedValue(mockDepartments);
    db.employees.where.mockReturnValue({
      equals: vi.fn(() => ({
        count: vi.fn(() => Promise.resolve(5)),
      })),
    });
    render(<DepartmentList />);

    await waitFor(() => {
      expect(screen.getByText('Human Resources')).toBeInTheDocument();
    });
    expect(screen.getAllByText('5').length).toBeGreaterThan(0);
  });

  it('should open add modal when clicking Add Department', async () => {
    db.departments.toArray.mockResolvedValue(mockDepartments);
    render(<DepartmentList />);

    await waitFor(() => {
      expect(screen.getByText('Human Resources')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /add department/i });
    await userEvent.click(addButton);

    expect(screen.getByRole('heading', { name: 'Add Department' })).toBeInTheDocument();
    expect(screen.getByLabelText('Department name')).toBeInTheDocument();
  });

  it('should add a new department via modal', async () => {
    db.departments.toArray.mockResolvedValue(mockDepartments);
    render(<DepartmentList />);

    await waitFor(() => {
      expect(screen.getByText('Human Resources')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /add department/i });
    await userEvent.click(addButton);

    const input = screen.getByLabelText('Department name');
    await userEvent.type(input, 'Procurement');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(db.departments.add).toHaveBeenCalledWith({ name: 'Procurement' });
    });
  });

  it('should show validation error for empty department name', async () => {
    db.departments.toArray.mockResolvedValue(mockDepartments);
    render(<DepartmentList />);

    await waitFor(() => {
      expect(screen.getByText('Human Resources')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /add department/i });
    await userEvent.click(addButton);

    const saveButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(saveButton);

    expect(screen.getByText('Department name is required.')).toBeInTheDocument();
  });

  it('should show duplicate error when adding existing department', async () => {
    db.departments.toArray.mockResolvedValue(mockDepartments);
    db.departments.add.mockRejectedValue(new Error('Key already exists'));
    render(<DepartmentList />);

    await waitFor(() => {
      expect(screen.getByText('Human Resources')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /add department/i });
    await userEvent.click(addButton);

    const input = screen.getByLabelText('Department name');
    await userEvent.type(input, 'Finance');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('A department with this name already exists.')).toBeInTheDocument();
    });
  });

  it('should open edit modal when clicking edit button', async () => {
    db.departments.toArray.mockResolvedValue(mockDepartments);
    render(<DepartmentList />);

    await waitFor(() => {
      expect(screen.getByText('Human Resources')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await userEvent.click(editButtons[0]);

    expect(screen.getByText('Edit Department')).toBeInTheDocument();
    const input = screen.getByLabelText('Department name');
    expect(input).toHaveValue('Human Resources');
  });

  it('should update a department via edit modal', async () => {
    db.departments.toArray.mockResolvedValue(mockDepartments);
    render(<DepartmentList />);

    await waitFor(() => {
      expect(screen.getByText('Human Resources')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await userEvent.click(editButtons[0]);

    const input = screen.getByLabelText('Department name');
    await userEvent.clear(input);
    await userEvent.type(input, 'People & Culture');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(db.departments.update).toHaveBeenCalledWith(1, { name: 'People & Culture' });
    });
  });

  it('should open delete confirmation when clicking delete button', async () => {
    db.departments.toArray.mockResolvedValue(mockDepartments);
    render(<DepartmentList />);

    await waitFor(() => {
      expect(screen.getByText('Human Resources')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await userEvent.click(deleteButtons[0]);

    expect(screen.getByText('Delete Department')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
  });

  it('should delete a department after confirmation', async () => {
    db.departments.toArray.mockResolvedValue(mockDepartments);
    render(<DepartmentList />);

    await waitFor(() => {
      expect(screen.getByText('Human Resources')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await userEvent.click(deleteButtons[0]);

    const modal = screen.getByText('Delete Department').closest('.fixed');
    const confirmButton = within(modal).getByRole('button', { name: 'Delete' });
    await userEvent.click(confirmButton);

    await waitFor(() => {
      expect(db.departments.delete).toHaveBeenCalledWith(1);
    });
  });

  it('should filter departments by search term', async () => {
    db.departments.toArray.mockResolvedValue(mockDepartments);
    render(<DepartmentList />);

    await waitFor(() => {
      expect(screen.getByText('Human Resources')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText('Search departments');
    await userEvent.type(searchInput, 'Finance');

    expect(screen.getByText('Finance')).toBeInTheDocument();
    expect(screen.queryByText('Human Resources')).not.toBeInTheDocument();
  });

  it('should show no results message when search has no matches', async () => {
    db.departments.toArray.mockResolvedValue(mockDepartments);
    render(<DepartmentList />);

    await waitFor(() => {
      expect(screen.getByText('Human Resources')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText('Search departments');
    await userEvent.type(searchInput, 'NonExistent');

    expect(screen.getByText('No departments match your search.')).toBeInTheDocument();
  });

  it('should allow seeding default departments', async () => {
    db.departments.toArray.mockResolvedValue([]);
    render(<DepartmentList />);

    await waitFor(() => {
      expect(screen.getByText('No departments found. Add your first department.')).toBeInTheDocument();
    });

    const seedButton = screen.getByRole('button', { name: /seed default departments/i });
    await userEvent.click(seedButton);

    await waitFor(() => {
      expect(db.departments.add).toHaveBeenCalledTimes(12);
    });
  });
});
