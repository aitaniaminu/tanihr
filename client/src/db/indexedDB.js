import Dexie from 'dexie';

export const db = new Dexie('TaniHR_DB');

db.version(2).stores({
  employees:
    '++id, fileNumber, surname, firstName, department, rank, status, retirementStatus, dateOfBirth, dateOfFirstAppointment',
  departments: '++id, &name',
  cadres: '++id, &name',
  ranks: '++id, &name',
  pfas: '++id, &name',
  salaryStructures: '++id, &name',
  states: '++id, &name',
  lgas: '++id, [name+state]',
  leaveRequests: '++id, employeeId, employeeName, leaveType, startDate, endDate, status, appliedDate',
  importLogs: '++id, date, userId, successCount, errorCount',
  users: '++id, &username, role',
});
