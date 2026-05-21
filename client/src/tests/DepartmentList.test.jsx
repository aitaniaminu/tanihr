import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DepartmentList from '../pages/Departments/DepartmentList';

const mockSelect = vi.fn();

vi.mock('../lib/supabase', () => {
  return {
    __esModule: true,
    default: {
      from: vi.fn(() => ({ select: mockSelect })),
    },
  };
});

describe('DepartmentList', () => {
  beforeEach(() => {
    mockSelect.mockReset();
  });

  it('should show loading state initially', () => {
    render(<DepartmentList />);
    expect(screen.getByText('Loading departments...')).toBeInTheDocument();
  });

  it('should load and display departments from Supabase', async () => {
    mockSelect
      .mockResolvedValueOnce({ data: [{ id: 1, name: 'Human Resources', hod_id: null, employees: null }], error: null })
      .mockResolvedValueOnce({ data: [], error: null });

    render(<DepartmentList />);
    await waitFor(() => {
      expect(screen.getByText('Human Resources')).toBeInTheDocument();
    });
  });

  it('should show error state when Supabase load fails', async () => {
    mockSelect.mockRejectedValue(new Error('Network error'));

    render(<DepartmentList />);
    await waitFor(() => {
      expect(screen.getByText('Failed to load department data. Please refresh the page.')).toBeInTheDocument();
    });
  });
});
