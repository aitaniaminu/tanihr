import Dexie from 'dexie';

export const db = new Dexie('TaniHR_DB');

db.version(4).stores({
  employees:
    '++id, fileNumber, surname, firstName, department, rank, status, retirementStatus, dateOfBirth, dateOfFirstAppointment, managerId',
  departments: '++id, &name, parentId',
  cadres: '++id, &name',
  ranks: '++id, &name',
  pfas: '++id, &name',
  salaryStructures: '++id, &name',
  states: '++id, &name',
  lgas: '++id, [name+state]',
  leaveRequests:
    '++id, employeeId, employeeName, leaveType, startDate, endDate, status, appliedDate',
  importLogs: '++id, date, userId, successCount, errorCount',
  users: '++id, &username, role',
  documents: '++id, employeeId, type, fileName, uploadedAt',
  auditLog: '++id, employeeId, field, oldValue, newValue, changedAt, changedBy',
}).upgrade(tx => {
  return tx.table('departments').toCollection().modify(dept => {
    if (dept.parentId === undefined) dept.parentId = null;
  });
});
