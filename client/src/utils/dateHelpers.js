// Date format utilities for DD-MM-YYYY handling

/**
 * Parse date string to Date object
 * Supports: DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD, MM/DD/YYYY
 * @param {string} dateString - Date string in various formats
 * @returns {Date|null} - Date object or null if invalid
 */
export function parseDDMMYYYY(dateString) {
  if (!dateString) return null;

  const str = dateString.trim();
  if (!str) return null;

  // Try DD-MM-YYYY
  let match = str.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
  if (match) {
    let [, day, month, year] = match;
    day = parseInt(day);
    month = parseInt(month);
    year = parseInt(year);
    // If first number > 12, it must be day (DD-MM-YYYY)
    // If second number > 12, it must be month (MM-DD-YYYY)
    if (day > 12 && month <= 12) {
      // Already DD-MM-YYYY
    } else if (month > 12 && day <= 12) {
      [day, month] = [month, day]; // Swap
    }
    const date = new Date(year, month - 1, day);
    if (date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year) {
      return date;
    }
  }

  // Try YYYY-MM-DD
  match = str.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
  if (match) {
    const [, year, month, day] = match;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (
      date.getDate() === parseInt(day) &&
      date.getMonth() === parseInt(month) - 1 &&
      date.getFullYear() === parseInt(year)
    ) {
      return date;
    }
  }

  return null;
}

/**
 * Format Date to DD-MM-YYYY string
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} - Date in DD-MM-YYYY format
 */
export function formatDDMMYYYY(date) {
  if (!date) return '';

  const d = typeof date === 'string' ? new Date(date) : date;

  if (!(d instanceof Date) || isNaN(d.getTime())) return '';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
}

/**
 * Convert Date to ISO string (for database storage)
 * @param {Date|string} date - Date object or DD-MM-YYYY string
 * @returns {string|null} - ISO string or null
 */
export function toISODate(date) {
  if (!date) return null;

  let d;
  if (typeof date === 'string') {
    d = parseDDMMYYYY(date);
  } else {
    d = date instanceof Date ? date : new Date(date);
  }

  if (!d || isNaN(d.getTime())) return null;

  return d.toISOString().split('T')[0];
}

/**
 * Calculate age from date of birth
 * @param {Date|string} dob - Date of birth
 * @returns {number|null} - Age in years
 */
export function calculateAge(dob) {
  const birthDate = typeof dob === 'string' ? parseDDMMYYYY(dob) : dob;
  if (!birthDate) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return Math.max(0, age);
}

/**
 * Calculate years of service from first appointment date
 * @param {Date|string} firstAppointment - First appointment date
 * @param {Date|string} [endDate] - End date (optional, defaults to today)
 * @returns {number|null} - Years of service
 */
export function calculateYearsOfService(firstAppointment, endDate = null) {
  const startDate = typeof firstAppointment === 'string' ? parseDDMMYYYY(firstAppointment) : firstAppointment;
  if (!startDate) return null;

  const end = endDate ? (typeof endDate === 'string' ? parseDDMMYYYY(endDate) : endDate) : new Date();
  if (!end) return null;

  let years = end.getFullYear() - startDate.getFullYear();
  const monthDiff = end.getMonth() - startDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < startDate.getDate())) {
    years--;
  }

  return Math.max(0, years);
}

/**
 * Calculate retirement date based on Nigerian Civil Service rules
 * @param {Date|string} dob - Date of birth
 * @param {Date|string} firstAppointment - First appointment date
 * @returns {Date|null} - Retirement date
 */
export function calculateRetirementDate(dob, firstAppointment) {
  const birthDate = typeof dob === 'string' ? parseDDMMYYYY(dob) : dob;
  const startD = typeof firstAppointment === 'string' ? parseDDMMYYYY(firstAppointment) : firstAppointment;

  if (!birthDate || !startD) return null;

  // 60 years from DOB
  const retirementByAge = new Date(birthDate);
  retirementByAge.setFullYear(retirementByAge.getFullYear() + 60);

  // 35 years from first appointment
  const retirementByService = new Date(startD);
  retirementByService.setFullYear(retirementByService.getFullYear() + 35);

  // Return whichever comes first
  return retirementByAge < retirementByService ? retirementByAge : retirementByService;
}

/**
 * Calculate months until retirement
 * @param {Date|string} retirementDate - Retirement date
 * @returns {number|null} - Months to retirement
 */
export function calculateMonthsToRetirement(retirementDate) {
  const retDate = typeof retirementDate === 'string' ? parseDDMMYYYY(retirementDate) : retirementDate;
  if (!retDate) return null;

  const today = new Date();
  const months = (retDate.getFullYear() - today.getFullYear()) * 12;
  const monthDiff = retDate.getMonth() - today.getMonth();

  return months + monthDiff;
}

/**
 * Determine retirement status
 * @param {Date|string} retirementDate - Retirement date
 * @returns {string} - 'Active', 'Approaching', or 'Retired'
 */
export function getRetirementStatus(retirementDate) {
  const retDate = typeof retirementDate === 'string' ? parseDDMMYYYY(retirementDate) : retirementDate;
  if (!retDate) return 'Active';

  const today = new Date();
  if (retDate <= today) return 'Retired';

  const monthsToRet = calculateMonthsToRetirement(retDate);
  if (monthsToRet <= 12) return 'Approaching';

  return 'Active';
}

/**
 * Validate date is at least 18 years ago
 * @param {Date|string} date - Date to validate
 * @returns {boolean} - True if valid (>= 18 years old)
 */
export function isAtLeast18Years(date) {
  const d = typeof date === 'string' ? parseDDMMYYYY(date) : date;
  if (!d) return false;

  const today = new Date();
  const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());

  return d <= eighteenYearsAgo;
}

/**
 * Get current date in DD-MM-YYYY format
 * @returns {string} - Current date formatted
 */
export function getCurrentDateDDMMYYYY() {
  return formatDDMMYYYY(new Date());
}
