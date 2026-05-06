import supabase from './supabase';
import { db } from '../db/indexedDB';

const TABLES = ['departments', 'ranks', 'pfas', 'salary_structures', 'states', 'employees'];

let isOnline = navigator.onLine;
let syncInProgress = false;

window.addEventListener('online', () => {
  isOnline = true;
  syncFromSupabase();
});

window.addEventListener('offline', () => {
  isOnline = false;
});

export function getOnlineStatus() {
  return isOnline;
}

export async function syncFromSupabase(addLog) {
  if (syncInProgress) return;
  syncInProgress = true;
  
  const log = addLog || ((msg) => console.log(msg));
  
  try {
    log('Starting offline sync...');
    
    await syncTable('departments', db.departments, mapDepartment, log);
    await syncTable('ranks', db.ranks, mapRank, log);
    await syncTable('pfas', db.pfas, mapPFA, log);
    await syncTable('salary_structures', db.salaryStructures, mapSalaryStructure, log);
    await syncTable('states', db.states, mapState, log);
    await syncTable('employees', db.employees, mapEmployee, log);
    
    log('Initial sync complete');
    subscribeToChanges(log);
    
  } catch (error) {
    log(`Sync error: ${error.message}`);
  } finally {
    syncInProgress = false;
  }
}

async function syncTable(supabaseTable, indexedDBTable, mapper, log) {
  log(`Syncing ${supabaseTable}...`);
  
  let allData = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;
  
  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    
    const { data, error } = await supabase
      .from(supabaseTable)
      .select('*')
      .range(from, to);
    
    if (error) {
      log(`Error fetching ${supabaseTable}: ${error.message}`);
      return;
    }
    
    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allData = [...allData, ...data];
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    }
  }
  
  if (allData.length === 0) {
    log(`No data in ${supabaseTable}`);
    return;
  }
  
  const mapped = allData.map(mapper);
  await indexedDBTable.clear();
  await indexedDBTable.bulkAdd(mapped);
  
  log(`Synced ${mapped.length} ${supabaseTable}`);
}

function mapDepartment(row) {
  return { id: row.id, name: row.name, parentId: row.parent_id || null };
}

function mapRank(row) {
  return { id: row.id, name: row.name, level: row.level || 1 };
}

function mapPFA(row) {
  return { id: row.id, name: row.name };
}

function mapSalaryStructure(row) {
  return { id: row.id, name: row.name };
}

function mapState(row) {
  return { id: row.id, name: row.name, geopoliticalZone: row.geopolitical_zone };
}

function mapEmployee(row) {
  return {
    id: row.id,
    fileNumber: row.file_number,
    ippisNumber: row.ippis_number,
    psn: row.psn,
    surname: row.surname,
    firstName: row.first_name,
    middleName: row.middle_name,
    dateOfBirth: row.date_of_birth,
    sex: row.sex,
    phone: row.phone,
    email: row.email,
    department: row.department_name,
    rank: row.rank_name,
    cadre: row.cadre,
    salaryGradeLevel: row.salary_grade_level,
    step: row.step ? parseInt(row.step) : null,
    appointmentType: row.appointment_type,
    dateOfFirstAppointment: row.date_of_first_appointment,
    dateOfConfirmation: row.date_of_confirmation,
    dateOfPresentAppointment: row.date_of_present_appointment,
    pfaName: row.pfa_name,
    rsaPin: row.rsa_pin,
    state: row.state_of_origin,
    lga: row.lga,
    geopoliticalZone: row.geopolitical_zone,
    remark: row.remark,
    status: row.status,
    location: row.location,
    qualification: row.qualification,
    natureOfJob: row.nature_of_job,
    salaryStructure: row.salary_structure,
    ageOnEntry: row.age_on_entry,
    avatar: row.avatar_url,
    retirementDate: row.retirement_date,
  };
}

let subscriptions = [];

function subscribeToChanges(log) {
  subscriptions.forEach(sub => sub.unsubscribe());
  subscriptions = [];
  
  TABLES.forEach(table => {
    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => handleChange(table, payload, log)
      )
      .subscribe();
    
    subscriptions.push(channel);
  });
  
  log('Subscribed to real-time changes');
}

async function handleChange(table, payload, log) {
  const { eventType, new: newRecord, old: oldRecord } = payload;
  
  const tableMap = {
    departments: db.departments,
    ranks: db.ranks,
    pfas: db.pfas,
    salary_structures: db.salaryStructures,
    states: db.states,
    employees: db.employees,
  };
  
  const mapperMap = {
    departments: mapDepartment,
    ranks: mapRank,
    pfas: mapPFA,
    salary_structures: mapSalaryStructure,
    states: mapState,
    employees: mapEmployee,
  };
  
  const idbTable = tableMap[table];
  const mapper = mapperMap[table];
  
  if (!idbTable) return;
  
  try {
    if (eventType === 'INSERT') {
      await idbTable.add(mapper(newRecord));
      log(`${table}: INSERT ${newRecord.id}`);
    } else if (eventType === 'UPDATE') {
      await idbTable.put(mapper(newRecord));
      log(`${table}: UPDATE ${newRecord.id}`);
    } else if (eventType === 'DELETE') {
      await idbTable.delete(oldRecord.id);
      log(`${table}: DELETE ${oldRecord.id}`);
    }
  } catch (error) {
    log(`Error handling ${eventType} in ${table}: ${error.message}`);
  }
}

export async function clearAllData() {
  await db.employees.clear();
  await db.departments.clear();
  await db.ranks.clear();
  await db.pfas.clear();
  await db.salaryStructures.clear();
  await db.states.clear();
}