import supabase from './supabase';
import { db } from '../db/indexedDB';

const SYNC_TABLES = ['departments', 'ranks', 'pfas', 'salary_structures', 'states', 'employees'];

let isOnline = navigator.onLine;
let isSyncing = false;
let isSyncingFromSupabase = false;
let syncStatus = 'idle';
let syncLogs = [];
let lastSyncTime = null;
let subscriptions = [];
let syncQueue = [];
let syncQueueTimer = null;
const SYNC_QUEUE_DELAY = 2000;

let listeners = [];

function notifyListeners() {
  listeners.forEach(fn => fn({ isOnline, isSyncing, syncStatus, syncLogs, lastSyncTime }));
}

export function onSyncStatusChange(fn) {
  listeners.push(fn);
  fn({ isOnline, isSyncing, syncStatus, syncLogs, lastSyncTime });
  return () => { listeners = listeners.filter(l => l !== fn); };
}

function addLog(msg) {
  const entry = `[${new Date().toLocaleTimeString()}] ${msg}`;
  syncLogs.push(entry);
  if (syncLogs.length > 100) syncLogs = syncLogs.slice(-100);
  notifyListeners();
}

window.addEventListener('online', () => {
  isOnline = true;
  addLog('Connection restored, syncing...');
  startBidirectionalSync();
});

window.addEventListener('offline', () => {
  isOnline = false;
  addLog('Connection lost, working offline');
  notifyListeners();
});

export function getOnlineStatus() {
  return isOnline;
}

export function getSyncStatus() {
  return { isOnline, isSyncing, syncStatus, syncLogs, lastSyncTime };
}

export async function initializeSync() {
  addLog('Initializing bidirectional sync...');

  if (!isOnline) {
    addLog('Offline mode - sync will start when connection restored');
    syncStatus = 'offline';
    notifyListeners();
    return;
  }

  const empCount = await db.employees.count();

  if (empCount === 0) {
    addLog('IndexedDB empty - performing initial sync from Supabase...');
    await syncFromSupabase();
  } else {
    addLog(`IndexedDB has ${empCount} employees - subscribing to real-time updates`);
  }

  setupSupabaseSubscriptions();
  setupDexieHooks();

  syncStatus = 'active';
  lastSyncTime = new Date();
  notifyListeners();
  addLog('Bidirectional sync active');
}

export async function startBidirectionalSync() {
  if (isSyncing) return;
  await initializeSync();
}

async function syncFromSupabase() {
  if (isSyncing) return;
  isSyncing = true;
  isSyncingFromSupabase = true;
  syncStatus = 'syncing-from-supabase';
  notifyListeners();

  try {
    await syncTable('departments', db.departments, mapDepartment);
    await syncTable('ranks', db.ranks, mapRank);
    await syncTable('pfas', db.pfas, mapPFA);
    await syncTable('salary_structures', db.salaryStructures, mapSalaryStructure);
    await syncTable('states', db.states, mapState);
    await syncTable('employees', db.employees, mapEmployee);

    addLog('Initial sync from Supabase complete');
    lastSyncTime = new Date();
  } catch (error) {
    addLog(`Sync error: ${error.message}`);
  } finally {
    isSyncing = false;
    isSyncingFromSupabase = false;
    syncStatus = 'active';
    notifyListeners();
  }
}

async function syncTable(supabaseTable, indexedDBTable, mapper) {
  addLog(`Fetching ${supabaseTable}...`);

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
      addLog(`Error fetching ${supabaseTable}: ${error.message}`);
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
    addLog(`No data in ${supabaseTable}`);
    return;
  }

  const mapped = allData.map(mapper);
  await indexedDBTable.clear();
  await indexedDBTable.bulkAdd(mapped);

  addLog(`Synced ${mapped.length} ${supabaseTable}`);
}

function mapDepartment(row) {
  return { id: row.id, name: row.name, parentId: row.parent_id || null, hodId: row.hod_id || null };
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
  return { id: row.id, name: row.name, capital: row.capital, zone: row.zone, geopoliticalZone: row.geopolitical_zone };
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
    ageOnEntry: row.ageOnEntry,
    avatar: row.avatar_url,
    retirementDate: row.retirement_date,
  };
}

function mapEmployeeToSupabase(emp) {
  return {
    file_number: emp.fileNumber || '',
    ippis_number: emp.ippisNumber || null,
    psn: emp.psn || null,
    surname: emp.surname || '',
    first_name: emp.firstName || '',
    middle_name: emp.middleName || null,
    date_of_birth: emp.dateOfBirth || null,
    sex: emp.sex || null,
    phone: emp.phone || null,
    email: emp.email || null,
    department_name: emp.department || null,
    cadre: emp.cadre || null,
    rank_name: emp.rank || null,
    salary_grade_level: emp.salaryGradeLevel || null,
    step: emp.step?.toString() || null,
    appointment_type: emp.appointmentType || 'Permanent',
    date_of_first_appointment: emp.dateOfFirstAppointment || null,
    date_of_confirmation: emp.dateOfConfirmation || null,
    date_of_present_appointment: emp.dateOfPresentAppointment || null,
    pfa_name: emp.pfaName || null,
    rsa_pin: emp.rsaPin || null,
    state_of_origin: emp.state || null,
    lga: emp.lga || null,
    geopolitical_zone: emp.geopoliticalZone || null,
    remark: emp.remark || null,
    status: emp.status || 'Active',
    location: emp.location || null,
    qualification: emp.qualification || null,
    nature_of_job: emp.natureOfJob || null,
    salary_structure: emp.salaryStructure || null,
    age_on_entry: emp.ageOnEntry || null,
    avatar_url: emp.avatar || null,
    retirement_date: emp.retirementDate || null,
  };
}

function setupSupabaseSubscriptions() {
  subscriptions.forEach(sub => sub.unsubscribe());
  subscriptions = [];

  SYNC_TABLES.forEach(table => {
    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => handleSupabaseChange(table, payload)
      )
      .subscribe();

    subscriptions.push(channel);
  });

  addLog('Subscribed to Supabase real-time changes');
}

async function handleSupabaseChange(table, payload) {
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
      addLog(`Supabase → IndexedDB: ${table} INSERT ${newRecord.id}`);
    } else if (eventType === 'UPDATE') {
      await idbTable.put(mapper(newRecord));
      addLog(`Supabase → IndexedDB: ${table} UPDATE ${newRecord.id}`);
    } else if (eventType === 'DELETE') {
      await idbTable.delete(oldRecord.id);
      addLog(`Supabase → IndexedDB: ${table} DELETE ${oldRecord.id}`);
    }
  } catch (error) {
    if (error.name === 'ConstraintError') {
      await idbTable.put(mapper(newRecord));
    } else {
      addLog(`Error handling ${eventType} in ${table}: ${error.message}`);
    }
  }
}

function setupDexieHooks() {
  const hookTableMap = {
    employees: { table: db.employees, supabaseTable: 'employees', toSupabase: mapEmployeeToSupabase, conflictKey: 'file_number' },
    departments: { table: db.departments, supabaseTable: 'departments', toSupabase: (d) => ({ name: d.name, parent_id: d.parentId, hod_id: d.hodId }), conflictKey: 'name' },
    ranks: { table: db.ranks, supabaseTable: 'ranks', toSupabase: (r) => ({ name: r.name, level: r.level }), conflictKey: 'name' },
    pfas: { table: db.pfas, supabaseTable: 'pfas', toSupabase: (p) => ({ name: p.name }), conflictKey: 'name' },
    salary_structures: { table: db.salaryStructures, supabaseTable: 'salary_structures', toSupabase: (s) => ({ name: s.name }), conflictKey: 'name' },
  };

  Object.entries(hookTableMap).forEach(([key, config]) => {
    config.table.hook('creating', function (primKey, obj, trans) {
      if (!isSyncingFromSupabase && isOnline) {
        queueSyncToSupabase(config.supabaseTable, obj, 'upsert', config.toSupabase, config.conflictKey);
      }
    });

    config.table.hook('updating', function (modifications, primKey, obj, trans) {
      if (!isSyncingFromSupabase && isOnline) {
        queueSyncToSupabase(config.supabaseTable, { ...obj, ...modifications }, 'upsert', config.toSupabase, config.conflictKey);
      }
    });

    config.table.hook('deleting', function (primKey, obj, trans) {
      if (!isSyncingFromSupabase && isOnline) {
        queueSyncToSupabase(config.supabaseTable, obj, 'delete', config.toSupabase, config.conflictKey);
      }
    });
  });

  addLog('Dexie hooks configured for automatic sync to Supabase');
}

function queueSyncToSupabase(supabaseTable, record, operation, mapper, conflictKey) {
  syncQueue.push({ supabaseTable, record, operation, mapper, conflictKey });

  if (syncQueueTimer) clearTimeout(syncQueueTimer);

  syncQueueTimer = setTimeout(() => {
    flushSyncQueue();
  }, SYNC_QUEUE_DELAY);
}

async function flushSyncQueue() {
  if (syncQueue.length === 0) return;

  const batch = [...syncQueue];
  syncQueue = [];

  addLog(`Syncing ${batch.length} change(s) to Supabase...`);

  for (const item of batch) {
    try {
      const mapped = item.mapper(item.record);

      if (item.operation === 'delete') {
        const conflictValue = item.record[item.conflictKey];
        if (conflictValue) {
          await supabase.from(item.supabaseTable).delete().eq(item.conflictKey, conflictValue);
        }
      } else {
        await supabase.from(item.supabaseTable).upsert(mapped, { onConflict: item.conflictKey });
      }
    } catch (error) {
      addLog(`Sync to Supabase error: ${error.message}`);
    }
  }

  addLog(`Synced ${batch.length} change(s) to Supabase`);
  lastSyncTime = new Date();
  notifyListeners();
}

export async function triggerFullSync() {
  if (isSyncing) return;
  addLog('Manual full sync triggered');

  await syncFromSupabase();

  if (!isOnline) {
    addLog('Cannot sync to Supabase - offline');
    return;
  }

  addLog('Syncing IndexedDB → Supabase...');

  const employees = await db.employees.toArray();
  let synced = 0;

  for (const emp of employees) {
    try {
      await supabase.from('employees').upsert(mapEmployeeToSupabase(emp), { onConflict: 'file_number' });
      synced++;
    } catch (error) {
      addLog(`Error syncing employee: ${error.message}`);
    }
  }

  addLog(`Full sync complete: ${synced}/${employees.length} employees synced`);
  lastSyncTime = new Date();
  syncStatus = 'active';
  notifyListeners();
}

export async function clearAllData() {
  await db.employees.clear();
  await db.departments.clear();
  await db.ranks.clear();
  await db.pfas.clear();
  await db.salaryStructures.clear();
  await db.states.clear();
  addLog('All local data cleared');
}

export function stopSync() {
  subscriptions.forEach(sub => sub.unsubscribe());
  subscriptions = [];
  if (syncQueueTimer) clearTimeout(syncQueueTimer);
  syncQueue = [];
  addLog('Sync stopped');
}
