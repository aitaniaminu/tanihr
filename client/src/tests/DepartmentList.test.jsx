import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DepartmentList from '../pages/Departments/DepartmentList';

vi.mock('../lib/supabase', () => {
  const mockSelect = vi.fn();
  const mockFrom = vi.fn(() => ({ select: mockSelect }));
  return {
    __esModule: true,
    from: mockFrom,
    default: { from: mockFrom },
  };
});

describe('DepartmentList', () => {
  it('should show loading state initially', () => {
    render(<DepartmentList />);
    expect(screen.getByText('Loading departments...')).toBeInTheDocument();
  });

  it('should load and display departments from Supabase', async () => {
    render(<DepartmentList />);
    await waitFor(() => {
      expect(screen.getByText('Human Resources')).toBeInTheDocument();
    });
  });

  it('should show error state when Supabase load fails', async () => {
    render(<DepartmentList />);
    await waitFor(() => {
      expect(screen.getByText('Failed to load department data. Please refresh the page.')).toBeInTheDocument();
    });
  });
});
