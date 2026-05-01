import Papa from 'papaparse';
import { db } from '../db/indexedDB';
import {
  parseDDMMYYYY,
  toISODate,
  calculateRetirementDate,
  getRetirementStatus,
  isAtLeast18Years,
} from '../utils/dateHelpers';
import { getLGAsForState, getGeoPoliticalZone } from '../data/nigerianData';

const CSV_HEADERS = [
  'File Number',
  'IPPIS',
  'PSN',
  'Surname',
  'First Name',
  'Middle Name',
  'Dob',
  'Sex',
  'Phone',
  'Department',
  'Cadre',
  'Rank',
  'Salary Grade Level',
  'Step',
  'Type Of Appointment',
  'Date Of First Appointment',
  'Date Of Confirmation',
  'Date Of Present Appointment',
  'PFA Name',
  'RSA Pin',
  'Email',
  'State',
  'LGA',
  'Geo Political Zone',
  'Remark',
  'Status',
  'Location',
  'Age On Entry',
  'Qualification',
  'Nature Of Job',
  'Salary Structure',
];

export function downloadTemplate() {
  const headerRow = CSV_HEADERS.join(',');
  const blob = new Blob([headerRow], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'employee_import_template.csv';
  link.click();
}

export async function parseCSV(file) {
  if (file.size > 15 * 1024 * 1024) {
    throw new Error('File size exceeds 15MB limit');
  }
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (error) => reject(error),
    });
  });
}

export async function validateAndImport(rows) {
  const results = {
    valid: [],
    invalid: [],
    autoCreatedReferences: [],
  };

  const existingEmployees = await db.employees.toArray();
  const existingFileNumbers = new Set(existingEmployees.map((e) => e.fileNumber));

  const existingDepartments = await db.departments.toArray();
  const existingRanks = await db.ranks.toArray();
  const existingPFAs = await db.pfas.toArray();

  const departmentNames = new Set(existingDepartments.map((d) => d.name.toLowerCase()));
  const rankNames = new Set(existingRanks.map((r) => r.name.toLowerCase()));
  const pfaNames = new Set(existingPFAs.map((p) => p.name.toLowerCase()));

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;
    const errors = [];

    // Debug: log first row's date format
    if (i === 0) {
      console.log('CSV Date format samples ->', {
        Dob: JSON.stringify(row['Dob']),
        FirstAppt: JSON.stringify(row['Date Of First Appointment']),
        PresentAppt: JSON.stringify(row['Date Of Present Appointment']),
      });
    }

    // Core required fields only
    if (!row['File Number']?.trim()) {
      errors.push('[File Number] is required');
    } else if (existingFileNumbers.has(row['File Number'].trim())) {
      errors.push(`[File Number] "${row['File Number']}" already exists`);
    }

    if (!row['Surname']?.trim()) {
      errors.push('[Surname] is required');
    }

    if (!row['First Name']?.trim()) {
      errors.push('[First Name] is required');
    }

    // Dates are required but parsed leniently
    const dob = parseDDMMYYYY(row['Dob']);
    if (!dob) {
      errors.push('[Dob] Invalid or missing date');
    }

    const firstAppt = parseDDMMYYYY(row['Date Of First Appointment']);
    if (!firstAppt) {
      errors.push('[Date Of First Appointment] Invalid or missing date');
    } else if (dob && firstAppt <= dob) {
      errors.push('[Date Of First Appointment] must be after Date of Birth');
    }

    const presentAppt = parseDDMMYYYY(row['Date Of Present Appointment']);
    if (!presentAppt) {
      errors.push('[Date Of Present Appointment] Invalid or missing date');
    } else if (firstAppt && presentAppt < firstAppt) {
      errors.push('[Date Of Present Appointment] cannot be before Date of First Appointment');
    }

    // Department, Rank, Salary Grade Level required
    if (!row['Department']?.trim()) {
      errors.push('[Department] is required');
    }

    if (!row['Rank']?.trim()) {
      errors.push('[Rank] is required');
    }

    if (!row['Salary Grade Level']?.trim()) {
      errors.push('[Salary Grade Level] is required');
    }

    if (!row['Type Of Appointment']?.trim()) {
      errors.push('[Type Of Appointment] is required');
    }

    if (!row['State']?.trim()) {
      errors.push('[State] is required');
    }

    if (!row['LGA']?.trim()) {
      errors.push('[LGA] is required');
    }

    if (!row['Status']?.trim()) {
      errors.push('[Status] is required');
    }

    // Sex optional but validate if present
    if (row['Sex'] && !['Male', 'Female', 'Other'].includes(row['Sex'])) {
      errors.push('[Sex] must be Male, Female, or Other');
    }

    // Strict LGA matching against Nigerian state data (case-insensitive)
    if (row['State']?.trim()) {
      const stateLGAs = getLGAsForState(row['State'].trim());
      if (stateLGAs.length === 0) {
        errors.push(`[State] "${row['State']}" is not a valid Nigerian state`);
      } else if (row['LGA']?.trim()) {
        const lgaNorm = row['LGA'].trim().toLowerCase();
        const match = stateLGAs.some((l) => l.toLowerCase() === lgaNorm);
        if (!match) {
          errors.push(`[LGA] "${row['LGA']}" is not valid for ${row['State']}`);
        }
      }
    }

    // RSA Pin optional, no validation
    // PFA Name optional, no validation

    if (errors.length > 0) {
      results.invalid.push({ row: rowNum, data: row, errors });
    } else {
      results.valid.push(row);
    }
  }

  return results;
}

export async function importValidRecords(validRows) {
  const autoCreatedRefs = [];

  const existingDepartments = await db.departments.toArray();
  const existingRanks = await db.ranks.toArray();
  const existingPFAs = await db.pfas.toArray();
  const existingStates = await db.states.toArray();

  const deptMap = new Map(existingDepartments.map((d) => [d.name.toLowerCase(), d]));
  const rankMap = new Map(existingRanks.map((r) => [r.name.toLowerCase(), r]));
  const pfaMap = new Map(existingPFAs.map((p) => [p.name.toLowerCase(), p]));
  const stateMap = new Map(existingStates.map((s) => [s.name.toLowerCase(), s]));

  try {
    await db.transaction(
      'rw',
      db.employees,
      db.departments,
      db.ranks,
      db.pfas,
      db.states,
      db.lgas,
      db.importLogs,
      async () => {
        for (const row of validRows) {
          const deptName = row['Department']?.trim();
          if (deptName && !deptMap.has(deptName.toLowerCase())) {
            await db.departments.add({ name: deptName });
            autoCreatedRefs.push({ type: 'Department', name: deptName });
            deptMap.set(deptName.toLowerCase(), { name: deptName });
          }

          const rankName = row['Rank']?.trim();
          if (rankName && !rankMap.has(rankName.toLowerCase())) {
            await db.ranks.add({ name: rankName });
            autoCreatedRefs.push({ type: 'Rank', name: rankName });
            rankMap.set(rankName.toLowerCase(), { name: rankName });
          }

          const pfaName = row['PFA Name']?.trim();
          if (pfaName && !pfaMap.has(pfaName.toLowerCase())) {
            await db.pfas.add({ name: pfaName });
            autoCreatedRefs.push({ type: 'PFA', name: pfaName });
            pfaMap.set(pfaName.toLowerCase(), { name: pfaName });
          }

          const stateName = row['State']?.trim();
          if (stateName && !stateMap.has(stateName.toLowerCase())) {
            await db.states.add({ name: stateName });
            autoCreatedRefs.push({ type: 'State', name: stateName });
            stateMap.set(stateName.toLowerCase(), { name: stateName });
          }

          const lgaName = row['LGA']?.trim();
          if (lgaName && stateName) {
            const existingLGA = await db.lgas.where({ name: lgaName, state: stateName }).first();
            if (!existingLGA) {
              await db.lgas.add({ name: lgaName, state: stateName });
              autoCreatedRefs.push({ type: 'LGA', name: lgaName, state: stateName });
            }
          }

          const retirementDate = calculateRetirementDate(row['Dob'], row['Date Of First Appointment']);
          const retirementStatus = getRetirementStatus(retirementDate);

          const employee = {
            fileNumber: row['File Number']?.trim(),
            ippisNumber: row['IPPIS']?.trim() || null,
            psn: row['PSN']?.trim() || null,
            surname: row['Surname']?.trim(),
            firstName: row['First Name']?.trim(),
            middleName: row['Middle Name']?.trim() || null,
            dateOfBirth: toISODate(row['Dob']),
            sex: row['Sex'] || null,
            phone: row['Phone']?.trim() || null,
            department: row['Department']?.trim(),
            cadre: row['Cadre']?.trim() || null,
            rank: row['Rank']?.trim(),
            salaryGradeLevel: row['Salary Grade Level']?.trim(),
            step: row['Step'] ? parseInt(row['Step']) : null,
            appointmentType: row['Type Of Appointment']?.trim(),
            dateOfFirstAppointment: toISODate(row['Date Of First Appointment']),
            dateOfConfirmation: row['Date Of Confirmation'] ? toISODate(row['Date Of Confirmation']) : null,
            dateOfPresentAppointment: toISODate(row['Date Of Present Appointment']),
            retirementDate: retirementDate ? toISODate(retirementDate) : null,
            pfaName: row['PFA Name']?.trim(),
            rsaPin: row['RSA Pin']?.trim() || null,
            email: row['Email']?.trim() || null,
            state: row['State']?.trim(),
            lga: row['LGA']?.trim(),
            geopoliticalZone: row['Geo Political Zone']?.trim() || getGeoPoliticalZone(row['State']),
            remark: row['Remark']?.trim() || null,
            status: row['Status']?.trim() || 'Active',
            location: row['Location']?.trim() || null,
            qualification: row['Qualification']?.trim() || null,
            natureOfJob: row['Nature Of Job']?.trim() || null,
            salaryStructure: row['Salary Structure']?.trim() || null,
            retirementStatus,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          await db.employees.add(employee);
        }

        const storedUser = sessionStorage.getItem('tanihr_user');
        let userId = 'admin';
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            userId = parsed.username || parsed.id || 'admin';
          } catch {
            userId = 'admin';
          }
        }

        const errorCount = 0;
        await db.importLogs.add({
          date: new Date().toISOString(),
          userId,
          successCount: validRows.length,
          errorCount,
          autoCreatedReferences: autoCreatedRefs,
        });
      }
    );
  } catch (error) {
    console.error('Import transaction failed:', error);
    throw error;
  }

  return autoCreatedRefs;
}

export default {
  downloadTemplate,
  parseCSV,
  validateAndImport,
  importValidRecords,
  downloadFailedRecords,
};

export function downloadFailedRecords(invalidRecords, originalHeaders) {
  if (!invalidRecords || invalidRecords.length === 0) return;

  const headers = ['Failure Reason', ...originalHeaders];
  const rows = headers.join(',');

  const csvRows = invalidRecords
    .map((item) => {
      const reason = item.errors.join('; ');
      const values = originalHeaders.map((h) => {
        const val = item.data[h] || '';
        // Escape values that contain commas or quotes
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      });
      // Escape reason
      const escapedReason = reason.includes(',') || reason.includes('"') ? `"${reason.replace(/"/g, '""')}"` : reason;
      return [escapedReason, ...values].join(',');
    })
    .join('\n');

  const csvContent = rows + '\n' + csvRows + '\n';
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `failed_records_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
}
