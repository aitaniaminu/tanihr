import Dexie from 'dexie';

export const db = new Dexie('TaniHR_DB');

db.version(1).stores({
  employees: '++id, fileNumber, surname, firstName, department, rank, status, retirementStatus, dateOfBirth, dateOfFirstAppointment, retirementDate, ippisNumber, psn, state, geopoliticalZone',
  departments: '++id, name',
  cadres: '++id, name',
  ranks: '++id, name',
  pfas: '++id, name',
  salaryStructures: '++id, name',
  states: '++id, name, geopoliticalZone',
  lgas: '++id, name, state',
  leaveRequests: '++id, employeeId, employeeFileNumber, leaveType, status, startDate, endDate',
  importLogs: '++id, importedAt, user, successCount, errorCount, autoCreatedReferences'
});

export default db;
