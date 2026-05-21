import Dexie from 'dexie';

export const db = new Dexie('TaniHR_DB');

db.version(8).stores({
  organizations: '++id, &name',
  employees:
    '++id, &fileNumber, ippisNumber, psn, surname, firstName, departmentName, cadre, rankName, status, managerId',
  departments: '++id, &name, parentId, hodId',
  cadres: '++id, &name',
  ranks: '++id, &name, level',
  pfas: '++id, &name',
  salaryStructures: '++id, &name',
  states: '++id, &name, capital, zone',
  lgas: '++id, [name+state]',
  leaveTypes: '++id, &name',
  leaveRequests:
    '++id, employeeId, leaveType, startDate, endDate, status, approvedBy',
  leaveBalances: '++id, employeeId, leaveTypeId, year',
  attendanceLogs: '++id, employeeId, date, clockIn, clockOut',
  publicHolidays: '++id, date, scope',
  importLogs: '++id, date, userId, successCount, errorCount',
  users: '++id, &username, roles, primaryRole, email, lastLogin, createdAt',
  documents: '++id, employeeId, type, fileName, uploadedAt',
  employeeSkills: '++id, employeeId, name, category, level, dateObtained, dateExpires',
  employeeCertifications: '++id, employeeId, name, provider, status, dateObtained, dateExpires',
  employeeDocuments: '++id, employeeId, documentType, fileName, fileUrl',
  employeeContracts: '++id, employeeId, contractType, effectiveDate, status',
  auditLog: '++id, tableName, recordId, operation, changedAt, changedBy',
  loginHistory: '++id, userId, username, action, success, createdAt',
  userSessions: '++id, userId, sessionToken, isActive, createdAt, expiresAt',
  jobPostings: '++id, &referenceNumber, title, department, status, postedDate, closingDate',
  candidates: '++id, jobId, firstName, lastName, email, phone, status, appliedDate',
  candidatePipeline: '++id, candidateId, stage, notes, updatedAt',
  disciplineCases: '++id, caseNumber, employeeId, offenseCategory, status, reportedDate',
  promotions: '++id, promotionNumber, employeeId, newRank, effectiveDate, isActing',
  postings: '++id, postingNumber, employeeId, fromDepartment, toDepartment, postingType, effectiveDate',
  offboardings: '++id, offboardingNumber, employeeId, type, stage, noticeDate, lastWorkingDay',
  appraisalCycles: '++id, name, year, period, status, startDate, endDate',
  appraisals: '++id, cycleId, employeeId, reviewerId, overallRating, status, submittedDate',
  appraisalGoals: '++id, appraisalId, description, target, achieved, weight, rating',
  appraisalFeedback: '++id, appraisalId, fromEmployeeId, toEmployeeId, feedback, category, createdAt',
  trainingCourses: '++id, title, provider, category, duration, cost, status, startDate, endDate',
  trainingEnrollments: '++id, courseId, employeeId, status, enrollmentDate, completionDate, score',
  expenses: '++id, employeeId, category, amount, description, status, submittedDate, approvedBy, approvedDate',
}).upgrade(tx => {
  return tx.table('departments').toCollection().modify(dept => {
    if (dept.parentId === undefined) dept.parentId = null;
    if (dept.hodId === undefined) dept.hodId = null;
  });
}).upgrade(tx => {
  return tx.table('users').toCollection().modify(user => {
    if (user.role && !user.roles) {
      user.roles = [user.role];
      user.primaryRole = user.role;
    } else if (!user.roles) {
      user.roles = ['employee'];
      user.primaryRole = 'employee';
    }
  });
}).upgrade(tx => {
  return tx.table('organizations').toCollection().modify(org => {
    if (!org.name) org.name = 'Tani Nigeria Ltd';
  });
});
