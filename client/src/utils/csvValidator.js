import Papa from 'papaparse';
import { db } from '../db/indexedDB';
import { parseDDMMYYYY, toISODate, calculateRetirementDate, getRetirementStatus, isAtLeast18Years } from '../utils/dateHelpers';
import { getLGAsForState, getGeoPoliticalZone } from '../data/nigerianData';

const CSV_HEADERS = [
  'File Number', 'IPPIS', 'PSN', 'Surname', 'First Name', 'Middle Name', 'Dob', 'Sex', 'Phone',
  'Department', 'Cadre', 'Rank', 'Salary Grade Level', 'Step', 'Type Of Appointment',
  'Date Of First Appointment', 'Date Of Confirmation', 'Date Of Present Appointment',
  'PFA Name', 'RSA Pin', 'Email', 'State', 'LGA', 'Geo Political Zone', 'Remark',
  'Status', 'Location', 'Age On Entry', 'Qualification', 'Nature Of Job', 'Salary Structure'
];

export function downloadTemplate() {
  // Create proper CSV header row by joining with commas
  const headerRow = CSV_HEADERS.join(',');
  const csv = headerRow;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'employee_import_template.csv';
  link.click();
}

export async function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (error) => reject(error)
    });
  });
}

export async function validateAndImport(rows) {
  const results = {
    valid: [],
    invalid: [],
    autoCreatedReferences: []
  };

  // Get existing file numbers for uniqueness check
  const existingEmployees = await db.employees.toArray();
  const existingFileNumbers = new Set(existingEmployees.map(e => e.fileNumber));

  // Get existing references
  const existingDepartments = await db.departments.toArray();
  const existingRanks = await db.ranks.toArray();
  const existingPFAs = await db.pfas.toArray();
  const existingStates = await db.states.toArray();
  const existingLGAs = await db.lgas.toArray();

  const departmentNames = new Set(existingDepartments.map(d => d.name.toLowerCase()));
  const rankNames = new Set(existingRanks.map(r => r.name.toLowerCase()));
  const pfaNames = new Set(existingPFAs.map(p => p.name.toLowerCase()));
  const stateNames = new Set(existingStates.map(s => s.name.toLowerCase()));
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // Account for header and 0-index
    const errors = [];

    // Validate File Number
    if (!row['File Number']?.trim()) {
      errors.push('[File Number] is required');
    } else if (existingFileNumbers.has(row['File Number'].trim())) {
      errors.push(`[File Number] "${row['File Number']}" already exists`);
    }

    // Validate DOB
    const dob = parseDDMMYYYY(row['Dob']);
    if (!dob) {
      errors.push('[Dob] Invalid date format. Expected DD-MM-YYYY');
    } else if (!isAtLeast18Years(dob)) {
      errors.push('[Dob] Employee must be at least 18 years old');
    }

    // Validate Date of First Appointment
    const firstAppt = parseDDMMYYYY(row['Date Of First Appointment']);
    if (!firstAppt) {
      errors.push('[Date Of First Appointment] Invalid date format. Expected DD-MM-YYYY');
    } else if (dob && firstAppt <= dob) {
      errors.push('[Date Of First Appointment] must be after Date of Birth');
    }

    // Validate Date of Present Appointment
    const presentAppt = parseDDMMYYYY(row['Date Of Present Appointment']);
    if (!presentAppt) {
      errors.push('[Date Of Present Appointment] Invalid date format. Expected DD-MM-YYYY');
    } else if (firstAppt && presentAppt < firstAppt) {
      errors.push('[Date Of Present Appointment] cannot be before Date of First Appointment');
    }

    // Validate required fields
    const requiredFields = ['Surname', 'First Name', 'Department', 'Rank', 'Salary Grade Level', 'Type Of Appointment', 'PFA Name', 'State', 'LGA', 'Status'];
    for (const field of requiredFields) {
      if (!row[field]?.trim()) {
        errors.push(`[${field}] is required`);
      }
    }

    // Validate Sex
    if (row['Sex'] && !['Male', 'Female', 'Other'].includes(row['Sex'])) {
      errors.push('[Sex] must be Male, Female, or Other');
    }

    // Validate State/LGA
    if (row['State']) {
      const stateLGAs = getLGAsForState(row['State']);
      if (stateLGAs.length === 0) {
        errors.push(`[State] "${row['State']}" is not a valid Nigerian state`);
      } else if (row['LGA'] && !stateLGAs.includes(row['LGA'])) {
        errors.push(`[LGA] "${row['LGA']}" is not valid for ${row['State']}`);
      }
    }

    // Validate RSA Pin (optional, but if present must be 16-18 alphanumeric)
    const rsaPin = row['RSA Pin']?.trim();
    if (rsaPin && !/^[A-Za-z0-9]{16,18}$/.test(rsaPin)) {
      errors.push('[RSA Pin] must be 16-18 alphanumeric characters');
    }

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

  for (const row of validRows) {
    // Auto-create references if they don't exist
    const deptName = row['Department']?.trim();
    const existingDept = await db.departments.where('name').equals(deptName).first();
    if (!existingDept && deptName) {
      await db.departments.add({ name: deptName });
      autoCreatedRefs.push({ type: 'Department', name: deptName });
    }

    const rankName = row['Rank']?.trim();
    const existingRank = await db.ranks.where('name').equals(rankName).first();
    if (!existingRank && rankName) {
      await db.ranks.add({ name: rankName });
      autoCreatedRefs.push({ type: 'Rank', name: rankName });
    }

    const pfaName = row['PFA Name']?.trim();
    const existingPFA = await db.pfas.where('name').equals(pfaName).first();
    if (!existingPFA && pfaName) {
      await db.pfas.add({ name: pfaName });
      autoCreatedRefs.push({ type: 'PFA', name: pfaName });
    }

    const stateName = row['State']?.trim();
    const existingState = await db.states.where('name').equals(stateName).first();
    if (!existingState && stateName) {
      await db.states.add({ name: stateName });
      autoCreatedRefs.push({ type: 'State', name: stateName });
    }

    const lgaName = row['LGA']?.trim();
    if (lgaName && stateName) {
      const existingLGA = await db.lgas.where({ name: lgaName, state: stateName }).first();
      if (!existingLGA) {
        await db.lgas.add({ name: lgaName, state: stateName });
        autoCreatedRefs.push({ type: 'LGA', name: lgaName, state: stateName });
      }
    }

    // Calculate retirement date and status
    const retirementDate = calculateRetirementDate(row['Dob'], row['Date Of First Appointment']);
    const retirementStatus = getRetirementStatus(retirementDate);

    // Create employee record
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
      updatedAt: new Date().toISOString()
    };

    await db.employees.add(employee);
  }

  // Log the import
  await db.importLogs.add({
    date: new Date().toISOString(),
    userId: 'admin',
    successCount: validRows.length,
    errorCount: 0,
    autoCreatedReferences: autoCreatedRefs
  });

  return autoCreatedRefs;
}

export default {
  downloadTemplate,
  parseCSV,
  validateAndImport,
  importValidRecords
};
