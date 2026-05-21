import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import EmployeeForm from '../pages/Employees/EmployeeForm';
import { db } from '../db/indexedDB';

const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

const { mockSupabase } = vi.hoisted(() => {
  const employeeData = { current: null };

  const makeQB = (data, error) => {
    const p = error ? Promise.resolve({ data, error }) : Promise.resolve({ data, error: null });
    return Object.assign(p, {
      select: vi.fn(() => makeQB(data, error)),
      eq: vi.fn(() => makeQB(data, error)),
      single: vi.fn(() => {
        if (Array.isArray(data)) {
          const singleData = data.length > 0 ? data[0] : null;
          const singleError = data.length === 0 ? { message: 'Result contains 0 rows' } : null;
          return makeQB(singleData, singleError);
        }
        return makeQB(data, error);
      }),
      order: vi.fn(() => makeQB(data, error)),
      insert: vi.fn(() => makeQB(null)),
      update: vi.fn(() => makeQB(null)),
      delete: vi.fn(() => makeQB(null)),
      upsert: vi.fn(() => makeQB(null)),
    });
  };

  const mockSupabase = {
    from: vi.fn((table) =>
      table === 'employees' && employeeData.current
        ? makeQB(employeeData.current, null)
        : makeQB([], null)
    ),
    setEmployeeData: (data) => { employeeData.current = data; },
    clearEmployeeData: () => { employeeData.current = null; },
  };

  return { mockSupabase };
});

vi.mock('../lib/supabase', () => ({
  default: mockSupabase,
  supabase: mockSupabase,
}));

vi.mock('../db/indexedDB', () => {
  const mockDb = {
    departments: { toArray: vi.fn(() => Promise.resolve([])) },
    ranks: { toArray: vi.fn(() => Promise.resolve([])) },
    pfas: { toArray: vi.fn(() => Promise.resolve([])) },
    salaryStructures: { toArray: vi.fn(() => Promise.resolve([])) },
    employees: { 
      toArray: vi.fn(() => Promise.resolve([])),
      add: vi.fn(() => Promise.resolve(1)), 
      update: vi.fn(() => Promise.resolve(1)), 
      get: vi.fn() 
    },
    auditLog: {
      add: vi.fn(() => Promise.resolve(1)),
    },
  };
  return { db: mockDb };
});

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: { username: 'testuser' } })),
}));

vi.mock('../data/nigerianData', () => ({
  nigerianStates: [{ name: 'Lagos', lgas: ['Ikeja', 'Epe'] }],
  getLGAsForState: vi.fn(() => ['Ikeja', 'Epe']),
  getGeoPoliticalZone: vi.fn(() => 'South West'),
  defaultPFAs: [],
  defaultDepartments: [],
  defaultRanks: [],
  defaultSalaryStructures: [],
  defaultSites: ['Headquarters (Kano)', 'Abuja Office'],
}));

describe('EmployeeForm', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.clearEmployeeData();
    db.departments.toArray.mockResolvedValue([]);
    db.ranks.toArray.mockResolvedValue([]);
    db.pfas.toArray.mockResolvedValue([]);
    db.salaryStructures.toArray.mockResolvedValue([]);
    db.employees.toArray.mockResolvedValue([]);
    db.employees.add.mockResolvedValue(1);
    db.employees.update.mockResolvedValue(1);
  });

  it('should show "Add New Employee" heading when no employeeId is provided', async () => {
    renderWithRouter(<EmployeeForm onBack={mockOnBack} />);
    expect(await screen.findByText('Add New Employee')).toBeInTheDocument();
  });

  it('should show "Edit Employee" heading when employeeId is provided', async () => {
    const mockEmployee = {
      id: 1,
      file_number: 'EMP001',
      surname: 'Adebayo',
      first_name: 'Olu',
      sex: 'Male',
      phone: '08012345678',
      department_name: 'IT',
      cadre: '',
      rank_name: 'GL-10',
      salary_grade_level: '10',
      step: 2,
      appointment_type: 'Permanent',
      date_of_first_appointment: '2010-03-01',
      date_of_confirmation: '2011-03-01',
      date_of_present_appointment: '2020-01-01',
      pfa_name: 'Leadway Pensure',
      rsa_pin: '1234567890123456',
      email: 'olu@example.com',
      state_of_origin: 'Lagos',
      lga: 'Ikeja',
      geopolitical_zone: 'South West',
      status: 'Active',
      location: 'Lagos',
      supervisor_name: 'Aminua Tani',
    };

    mockSupabase.setEmployeeData([mockEmployee]);

    renderWithRouter(<EmployeeForm employeeId={1} onBack={mockOnBack} />);

    expect(await screen.findByText('Edit Employee')).toBeInTheDocument();
  });

  it('should fetch employee by employeeId from Supabase on mount and display data', async () => {
    const mockEmployee = {
      id: 5,
      file_number: 'EMP005',
      surname: 'Test',
      first_name: 'User',
      sex: 'Female',
      department_name: 'HR',
      rank_name: 'GL-08',
      salary_grade_level: '8',
      appointment_type: 'Permanent',
      date_of_first_appointment: '2015-06-01',
      date_of_present_appointment: '2020-01-01',
      pfa_name: 'Stanbic',
      state_of_origin: 'Lagos',
      lga: 'Ikeja',
      status: 'Active',
    };

    mockSupabase.setEmployeeData([mockEmployee]);

    renderWithRouter(<EmployeeForm employeeId={5} onBack={mockOnBack} />);

    expect(await screen.findByText('Edit Employee')).toBeInTheDocument();
  });

  it('should create new employee when no employeeId is provided', async () => {
    renderWithRouter(<EmployeeForm onBack={mockOnBack} />);

    expect(screen.getByText('Add New Employee')).toBeInTheDocument();
    expect(db.employees.get).not.toHaveBeenCalled();
  });

  it('should call onBack when cancel button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<EmployeeForm onBack={mockOnBack} />);

    const cancelBtn = screen.getByText('Cancel');
    await user.click(cancelBtn);

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('should call onBack when back arrow button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<EmployeeForm onBack={mockOnBack} />);

    const buttons = screen.getAllByRole('button');
    const backBtn = buttons.find((btn) => btn.closest('div')?.querySelector('svg'));
    await user.click(backBtn);

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('should show avatar upload section in Personal Information', async () => {
    renderWithRouter(<EmployeeForm onBack={mockOnBack} />);

    expect(await screen.findByText('Personal Information')).toBeInTheDocument();
    expect(screen.getByLabelText(/upload photo/i)).toBeInTheDocument();
  });

  it('should load existing avatar when editing employee with avatar', async () => {
    const mockEmployee = {
      id: 1,
      file_number: 'EMP001',
      surname: 'Adebayo',
      first_name: 'Olu',
      sex: 'Male',
      phone: '08012345678',
      department_name: 'IT',
      cadre: '',
      rank_name: 'GL-10',
      salary_grade_level: '10',
      step: 2,
      appointment_type: 'Permanent',
      date_of_first_appointment: '2010-03-01',
      date_of_confirmation: '2011-03-01',
      date_of_present_appointment: '2020-01-01',
      pfa_name: 'Leadway Pensure',
      rsa_pin: '1234567890123456',
      email: 'olu@example.com',
      state_of_origin: 'Lagos',
      lga: 'Ikeja',
      geopolitical_zone: 'South West',
      status: 'Active',
      location: 'Lagos',
      avatar_url: 'data:image/png;base64,fakeavatar',
    };

    mockSupabase.setEmployeeData([mockEmployee]);

    renderWithRouter(<EmployeeForm employeeId={1} onBack={mockOnBack} />);

    await waitFor(() => {
      const img = document.querySelector('img[alt="Employee avatar preview"]');
      expect(img).toBeInTheDocument();
      expect(img.src).toContain('fakeavatar');
    });
  });

  it('should show avatar preview after uploading a file', async () => {
    const user = userEvent.setup();
    renderWithRouter(<EmployeeForm onBack={mockOnBack} />);

    await screen.findByText('Add New Employee');

    const file = new File(['dummy content'], 'photo.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/upload photo/i);
    await user.upload(input, file);

    await waitFor(() => {
      const img = document.querySelector('img[alt="Employee avatar preview"]');
      expect(img).toBeInTheDocument();
      expect(img.src).toContain('data:image/jpeg');
    });
  });

  it('should show remove button after avatar is uploaded', async () => {
    const user = userEvent.setup();
    renderWithRouter(<EmployeeForm onBack={mockOnBack} />);

    await screen.findByText('Add New Employee');

    const file = new File(['dummy content'], 'photo.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/upload photo/i);
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /remove photo/i })).toBeInTheDocument();
    });
  });
});
