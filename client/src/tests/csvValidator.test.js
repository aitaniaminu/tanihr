import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateAndImport, importValidRecords } from '../utils/csvValidator';
import { db } from '../db/indexedDB';

const mockWhereChain = () => ({ equals: vi.fn(() => ({ first: vi.fn(() => Promise.resolve(null)) })) });

vi.mock('../db/indexedDB', () => ({
  db: {
    employees: { toArray: vi.fn(() => Promise.resolve([])), add: vi.fn(() => Promise.resolve(1)) },
    departments: { toArray: vi.fn(() => Promise.resolve([])), where: vi.fn(), add: vi.fn(() => Promise.resolve(1)) },
    ranks: { toArray: vi.fn(() => Promise.resolve([])), where: vi.fn(), add: vi.fn(() => Promise.resolve(1)) },
    pfas: { toArray: vi.fn(() => Promise.resolve([])), where: vi.fn(), add: vi.fn(() => Promise.resolve(1)) },
    states: { toArray: vi.fn(() => Promise.resolve([])), where: vi.fn(), add: vi.fn(() => Promise.resolve(1)) },
    lgas: { where: vi.fn(() => ({ first: vi.fn(() => Promise.resolve(null)) })), add: vi.fn(() => Promise.resolve(1)) },
    importLogs: { add: vi.fn(() => Promise.resolve(1)) },
    transaction: vi.fn().mockImplementation(async function (...args) {
      const callback = args[args.length - 1];
      return callback();
    }),
  },
}));

vi.mock('../data/nigerianData', () => ({
  getLGAsForState: vi.fn((state) => (state === 'Lagos' ? ['Ikeja', 'Epe'] : [])),
  getGeoPoliticalZone: vi.fn(() => 'South West'),
}));

describe('csvValidator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.departments.where.mockImplementation(mockWhereChain);
    db.ranks.where.mockImplementation(mockWhereChain);
    db.pfas.where.mockImplementation(mockWhereChain);
    db.states.where.mockImplementation(mockWhereChain);
  });

  describe('validateAndImport', () => {
    it('should validate a correct row as valid', async () => {
      const rows = [
        {
          'File Number': 'EMP001',
          Surname: 'Ade',
          'First Name': 'John',
          Dob: '15-05-1980',
          Sex: 'Male',
          Department: 'IT',
          Rank: 'GL-10',
          'Salary Grade Level': '10',
          'Type Of Appointment': 'Permanent',
          'Date Of First Appointment': '01-03-2010',
          'Date Of Present Appointment': '01-01-2020',
          'PFA Name': 'Leadway',
          State: 'Lagos',
          LGA: 'Ikeja',
          Status: 'Active',
        },
      ];

      const result = await validateAndImport(rows);
      expect(result.valid).toHaveLength(1);
      expect(result.invalid).toHaveLength(0);
    });

    it('should reject row with missing required fields', async () => {
      const rows = [
        {
          'File Number': '',
          Surname: '',
          'First Name': '',
          Dob: '',
          Sex: '',
          Department: '',
          Rank: '',
          'Salary Grade Level': '',
          'Type Of Appointment': '',
          'Date Of First Appointment': '',
          'Date Of Present Appointment': '',
          'PFA Name': '',
          State: '',
          LGA: '',
          Status: '',
        },
      ];

      const result = await validateAndImport(rows);
      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].errors.length).toBeGreaterThan(5);
    });

    it('should reject duplicate file numbers', async () => {
      db.employees.toArray.mockResolvedValue([{ fileNumber: 'EMP001' }]);
      const rows = [
        {
          'File Number': 'EMP001',
          Surname: 'Ade',
          'First Name': 'John',
          Dob: '15-05-1980',
          Sex: 'Male',
          Department: 'IT',
          Rank: 'GL-10',
          'Salary Grade Level': '10',
          'Type Of Appointment': 'Permanent',
          'Date Of First Appointment': '01-03-2010',
          'Date Of Present Appointment': '01-01-2020',
          'PFA Name': 'Leadway',
          State: 'Lagos',
          LGA: 'Ikeja',
          Status: 'Active',
        },
      ];

      const result = await validateAndImport(rows);
      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].errors[0]).toContain('already exists');
    });

    it('should reject invalid date format', async () => {
      const rows = [
        {
          'File Number': 'EMP001',
          Surname: 'Ade',
          'First Name': 'John',
          Dob: 'not-a-date',
          Sex: 'Male',
          Department: 'IT',
          Rank: 'GL-10',
          'Salary Grade Level': '10',
          'Type Of Appointment': 'Permanent',
          'Date Of First Appointment': '01-03-2010',
          'Date Of Present Appointment': '2020-01-01',
          'PFA Name': 'Leadway',
          State: 'Lagos',
          LGA: 'Ikeja',
          Status: 'Active',
        },
      ];

      const result = await validateAndImport(rows);
      expect(result.valid).toHaveLength(0);
      expect(result.invalid[0].errors.some((e) => e.includes('Invalid'))).toBe(true);
    });

    it('should accept YYYY-MM-DD date format', async () => {
      const rows = [
        {
          'File Number': 'EMP002',
          Surname: 'Ade',
          'First Name': 'John',
          Dob: '1980-05-15',
          Sex: 'Male',
          Department: 'IT',
          Rank: 'GL-10',
          'Salary Grade Level': '10',
          'Type Of Appointment': 'Permanent',
          'Date Of First Appointment': '2010-03-01',
          'Date Of Present Appointment': '2020-01-01',
          State: 'Lagos',
          LGA: 'Ikeja',
          Status: 'Active',
        },
      ];

      const result = await validateAndImport(rows);
      expect(result.valid).toHaveLength(1);
      expect(result.invalid).toHaveLength(0);
    });

    it('should accept DD/MM/YYYY date format', async () => {
      const rows = [
        {
          'File Number': 'EMP003',
          Surname: 'Ade',
          'First Name': 'John',
          Dob: '15/05/1980',
          Sex: 'Male',
          Department: 'IT',
          Rank: 'GL-10',
          'Salary Grade Level': '10',
          'Type Of Appointment': 'Permanent',
          'Date Of First Appointment': '01/03/2010',
          'Date Of Present Appointment': '01/01/2020',
          State: 'Lagos',
          LGA: 'Ikeja',
          Status: 'Active',
        },
      ];

      const result = await validateAndImport(rows);
      expect(result.valid).toHaveLength(1);
      expect(result.invalid).toHaveLength(0);
    });
  });

  describe('importValidRecords', () => {
    it('should import valid records and log the import', async () => {
      const validRows = [
        {
          'File Number': 'EMP001',
          Surname: 'Ade',
          'First Name': 'John',
          Dob: '15-05-1980',
          Sex: 'Male',
          Department: 'IT',
          Rank: 'GL-10',
          'Salary Grade Level': '10',
          'Type Of Appointment': 'Permanent',
          'Date Of First Appointment': '01-03-2010',
          'Date Of Present Appointment': '01-01-2020',
          'PFA Name': 'Leadway',
          State: 'Lagos',
          LGA: 'Ikeja',
          Status: 'Active',
        },
      ];

      const result = await importValidRecords(validRows);

      expect(db.transaction).toHaveBeenCalled();
      expect(db.employees.add).toHaveBeenCalled();
      expect(db.importLogs.add).toHaveBeenCalled();

      const logCall = db.importLogs.add.mock.calls[0][0];
      expect(logCall.date).toBeDefined();
      expect(logCall.userId).toBeDefined();
      expect(logCall.successCount).toBe(1);
      expect(logCall.errorCount).toBe(0);
      expect(Array.isArray(logCall.autoCreatedReferences)).toBe(true);
    });

    it('should use logged-in user for import log', async () => {
      sessionStorage.setItem('tanihr_user', JSON.stringify({ username: 'testuser', role: 'admin' }));

      const validRows = [
        {
          'File Number': 'EMP002',
          Surname: 'Test',
          'First Name': 'User',
          Dob: '15-05-1990',
          Sex: 'Female',
          Department: 'HR',
          Rank: 'GL-08',
          'Salary Grade Level': '8',
          'Type Of Appointment': 'Permanent',
          'Date Of First Appointment': '01-06-2015',
          'Date Of Present Appointment': '01-01-2020',
          'PFA Name': 'Stanbic',
          State: 'Lagos',
          LGA: 'Ikeja',
          Status: 'Active',
        },
      ];

      await importValidRecords(validRows);

      const logCall = db.importLogs.add.mock.calls[0][0];
      expect(logCall.userId).toBe('testuser');

      sessionStorage.removeItem('tanihr_user');
    });
  });
});
