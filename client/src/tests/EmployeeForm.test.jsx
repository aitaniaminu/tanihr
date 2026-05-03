import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import EmployeeForm from '../pages/Employees/EmployeeForm';
import { db } from '../db/indexedDB';

const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

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
    db.departments.toArray.mockResolvedValue([]);
    db.ranks.toArray.mockResolvedValue([]);
    db.pfas.toArray.mockResolvedValue([]);
    db.salaryStructures.toArray.mockResolvedValue([]);
    db.employees.toArray.mockResolvedValue([]);
    db.employees.add.mockResolvedValue(1);
    db.employees.update.mockResolvedValue(1);
  });

  it('should show "Add New Employee" heading when no employeeId is provided', async () => {
    renderWithRouter onBack={mockOnBack} />);
    expect(await screen.findByText('Add New Employee')).toBeInTheDocument();
  });

  it('should show "Edit Employee" heading when employeeId is provided', async () => {
    const mockEmployee = {
      id: 1,
      fileNumber: 'EMP001',
      surname: 'Adebayo',
      firstName: 'Olu',
      middleName: '',
      dateOfBirth: '1980-05-15',
      sex: 'Male',
      phone: '08012345678',
      department: 'IT',
      cadre: '',
      rank: 'GL-10',
      salaryGradeLevel: '10',
      step: 2,
      appointmentType: 'Permanent',
      dateOfFirstAppointment: '2010-03-01',
      dateOfConfirmation: '2011-03-01',
      dateOfPresentAppointment: '2020-01-01',
      pfaName: 'Leadway Pensure',
      rsaPin: '1234567890123456',
      email: 'olu@example.com',
      state: 'Lagos',
      lga: 'Ikeja',
      geopoliticalZone: 'South West',
      remark: '',
      status: 'Active',
      location: 'Lagos',
      qualification: 'BSc',
      natureOfJob: 'Software Developer',
      salaryStructure: 'CONSS',
    };

    db.employees.get.mockResolvedValue(mockEmployee);

    renderWithRouter employeeId={1} onBack={mockOnBack} />);

    expect(await screen.findByText('Edit Employee')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Adebayo')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Olu')).toBeInTheDocument();
    expect(screen.getByDisplayValue('EMP001')).toBeInTheDocument();
  });

  it('should fetch employee by employeeId from IndexedDB on mount', async () => {
    const mockEmployee = {
      id: 5,
      fileNumber: 'EMP005',
      surname: 'Test',
      firstName: 'User',
      dateOfBirth: '1990-01-01',
      sex: 'Female',
      department: 'HR',
      rank: 'GL-08',
      salaryGradeLevel: '8',
      appointmentType: 'Permanent',
      dateOfFirstAppointment: '2015-06-01',
      dateOfPresentAppointment: '2020-01-01',
      pfaName: 'Stanbic',
      state: 'Lagos',
      lga: 'Ikeja',
      status: 'Active',
    };

    db.employees.get.mockResolvedValue(mockEmployee);

    renderWithRouter employeeId={5} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(db.employees.get).toHaveBeenCalledWith(5);
    });
    expect(screen.getByDisplayValue('Test')).toBeInTheDocument();
  });

  it('should create new employee when no employeeId is provided', async () => {
    renderWithRouter onBack={mockOnBack} />);

    expect(screen.getByText('Add New Employee')).toBeInTheDocument();
    expect(db.employees.get).not.toHaveBeenCalled();
  });

  it('should call onBack when cancel button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter onBack={mockOnBack} />);

    const cancelBtn = screen.getByText('Cancel');
    await user.click(cancelBtn);

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('should call onBack when back arrow button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter onBack={mockOnBack} />);

    const buttons = screen.getAllByRole('button');
    const backBtn = buttons.find((btn) => btn.closest('div')?.querySelector('svg'));
    await user.click(backBtn);

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('should show avatar upload section in Personal Information', async () => {
    renderWithRouter onBack={mockOnBack} />);

    expect(await screen.findByText('Personal Information')).toBeInTheDocument();
    expect(screen.getByLabelText(/upload photo/i)).toBeInTheDocument();
  });

  it('should load existing avatar when editing employee with avatar', async () => {
    const mockEmployee = {
      id: 1,
      fileNumber: 'EMP001',
      surname: 'Adebayo',
      firstName: 'Olu',
      middleName: '',
      dateOfBirth: '1980-05-15',
      sex: 'Male',
      phone: '08012345678',
      department: 'IT',
      cadre: '',
      rank: 'GL-10',
      salaryGradeLevel: '10',
      step: 2,
      appointmentType: 'Permanent',
      dateOfFirstAppointment: '2010-03-01',
      dateOfConfirmation: '2011-03-01',
      dateOfPresentAppointment: '2020-01-01',
      pfaName: 'Leadway Pensure',
      rsaPin: '1234567890123456',
      email: 'olu@example.com',
      state: 'Lagos',
      lga: 'Ikeja',
      geopoliticalZone: 'South West',
      remark: '',
      status: 'Active',
      location: 'Lagos',
      qualification: 'BSc',
      natureOfJob: 'Software Developer',
      salaryStructure: 'CONSS',
      avatar: 'data:image/png;base64,fakeavatar',
    };

    db.employees.get.mockResolvedValue(mockEmployee);

    renderWithRouter employeeId={1} onBack={mockOnBack} />);

    await waitFor(() => {
      const img = document.querySelector('img[alt="Employee avatar preview"]');
      expect(img).toBeInTheDocument();
      expect(img.src).toContain('fakeavatar');
    });
  });

  it('should show avatar preview after uploading a file', async () => {
    const user = userEvent.setup();
    renderWithRouter onBack={mockOnBack} />);

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
    renderWithRouter onBack={mockOnBack} />);

    await screen.findByText('Add New Employee');

    const file = new File(['dummy content'], 'photo.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/upload photo/i);
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /remove photo/i })).toBeInTheDocument();
    });
  });
});
