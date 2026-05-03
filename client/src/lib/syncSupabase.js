import supabase from '../lib/supabase';
import { db } from '../db/indexedDB';

export async function syncEmployeesToSupabase(addLog) {
  const log = addLog || ((msg) => console.log(msg));
  
  try {
    log('Loading from IndexedDB...');
    
    const employees = await db.employees.toArray();
    const departments = await db.departments.toArray();
    const ranks = await db.ranks.toArray();
    const pfas = await db.pfas.toArray();
    const salaryStructures = await db.salaryStructures.toArray();
    
    log(`Found: ${employees.length} employees, ${departments.length} depts, ${ranks.length} ranks`);
    
    // Test connection first
    log('Testing Supabase connection...');
    const test = await supabase.from('organizations').select('count');
    if (test.error) {
      log(`Connection test failed: ${test.error.message}`);
      return { success: 0, failed: employees.length, error: test.error.message };
    }
    log('Supabase connection OK');
    
    // Sync reference data (using name as text, no UUIDs for simplicity)
    log('Syncing departments...');
    for (const d of departments) {
      await supabase.from('departments').upsert({ 
        name: d.name || 'Unknown' 
      }, { onConflict: 'name' });
    }
    log(`Done: ${departments.length} departments`);
    
    log('Syncing ranks...');
    for (const r of ranks) {
      const level = parseInt(String(r.name).replace(/\D/g,'')) || 1;
      await supabase.from('ranks').upsert({ 
        name: r.name || 'Unknown', 
        level 
      }, { onConflict: 'name' });
    }
    log(`Done: ${ranks.length} ranks`);
    
    log('Syncing PFAs...');
    for (const p of pfas) {
      await supabase.from('pfas').upsert({ 
        name: p.name || 'Unknown' 
      }, { onConflict: 'name' });
    }
    log(`Done: ${pfas.length} PFAs`);
    
    log('Syncing salary structures...');
    for (const s of salaryStructures) {
      await supabase.from('salary_structures').upsert({ 
        name: s.name || 'Unknown' 
      }, { onConflict: 'name' });
    }
    log(`Done: ${salaryStructures.length} salary structures`);
    
    // Sync employees (batch)
    log(`Syncing ${employees.length} employees...`);
    let success = 0;
    let failed = 0;
    
    // Process in batches of 50
    for (let i = 0; i < employees.length; i += 50) {
      const batch = employees.slice(i, i + 50);
      
      const empData = batch.map(emp => ({
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
      }));
      
      // Insert one by one to avoid duplicate conflict in batch
      for (const empRow of empData) {
        const { error } = await supabase.from('employees').upsert(empRow, { onConflict: 'file_number' });
        if (error) {
          log(`Error: ${error.message} for ${empRow.file_number}`);
        }
      }
      
      success += batch.length;
      log(`Progress: ${success}/${employees.length}`);
    }
    
    log(`SYNC COMPLETE: ${success} success, ${failed} failed`);
    return { success, failed };
    
  } catch (error) {
    log(`FATAL: ${error.message}`);
    return { success: 0, failed: 0, error: error.message };
  }
}