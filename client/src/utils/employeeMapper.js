import { formatDDMMYYYY } from './dateHelpers';

export const SUPABASE_TO_DISPLAY_FIELDS = {
  first_name: 'firstName',
  middle_name: 'middleName',
  date_of_birth: 'dateOfBirth',
  department_name: 'department',
  rank_name: 'rank',
  file_number: 'fileNumber',
  ippis_number: 'ippisNumber',
  date_of_first_appointment: 'dateOfFirstAppointment',
  date_of_confirmation: 'dateOfConfirmation',
  date_of_present_appointment: 'dateOfPresentAppointment',
  salary_grade_level: 'salaryGradeLevel',
  appointment_type: 'appointmentType',
  pfa_name: 'pfaName',
  rsa_pin: 'rsaPin',
  state_of_origin: 'state',
  lga: 'lga',
  geopolitical_zone: 'geopoliticalZone',
  avatar_url: 'avatar',
  status: 'status',
  location: 'location',
  qualification: 'qualification',
  nature_of_job: 'natureOfJob',
  salary_structure: 'salaryStructure',
  remark: 'remark',
  psn: 'psn',
  step: 'step',
  cadre: 'cadre',
  sex: 'sex',
  phone: 'phone',
  email: 'email',
};

export function mapEmployeeFromSupabase(data) {
  if (!data) return null;
  
  const mapped = { ...data };
  for (const [supabaseField, displayField] of Object.entries(SUPABASE_TO_DISPLAY_FIELDS)) {
    if (data[supabaseField] !== undefined) {
      mapped[displayField] = data[supabaseField];
    }
  }
  return mapped;
}

export function getEmployeeDisplayName(emp) {
  if (!emp) return '';
  return `${emp.surname || ''}, ${emp.firstName || emp.first_name || ''}`.replace(/^, |, $/g, '');
}

export function getEmployeeInitials(emp) {
  if (!emp) return '';
  const first = emp.surname?.charAt(0) || emp.firstName?.charAt(0) || '';
  const last = emp.firstName?.charAt(0) || emp.first_name?.charAt(0) || '';
  return `${first}${last}`;
}