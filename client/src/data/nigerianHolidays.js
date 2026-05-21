export const NIGERIAN_HOLIDAYS = [
  { date: '2026-01-01', name: "New Year's Day", scope: 'Federal' },
  { date: '2026-01-12', name: 'Id el Kabir (Sallah)', scope: 'Federal' },
  { date: '2026-02-13', name: 'Id el Maulud (Prophet\'s Birthday)', scope: 'Federal' },
  { date: '2026-04-03', name: 'Good Friday', scope: 'Federal' },
  { date: '2026-04-06', name: 'Easter Monday', scope: 'Federal' },
  { date: '2026-05-01', name: 'Workers\' Day', scope: 'Federal' },
  { date: '2026-05-27', name: 'Children\'s Day', scope: 'Federal' },
  { date: '2026-05-29', name: 'Democracy Day', scope: 'Federal' },
  { date: '2026-06-12', name: 'Democracy Day', scope: 'Federal' },
  { date: '2026-07-12', name: 'Id el Kabir (Sallah)', scope: 'Federal' },
  { date: '2026-10-01', name: 'Independence Day', scope: 'Federal' },
  { date: '2026-10-19', name: 'Id el Maulud (Prophet\'s Birthday)', scope: 'Federal' },
  { date: '2026-12-25', name: 'Christmas Day', scope: 'Federal' },
  { date: '2026-12-26', name: 'Boxing Day', scope: 'Federal' },
];

export function getHolidaysForYear(year) {
  return NIGERIAN_HOLIDAYS.filter(h => h.date.startsWith(String(year)));
}

export function isPublicHoliday(dateStr, holidays) {
  return holidays.some(h => h.date === dateStr);
}

export function getNextWorkingDay(date, holidays) {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  let attempts = 0;
  const maxAttempts = 365;
  while (attempts < maxAttempts) {
    const day = d.getDay();
    const dateStr = d.toISOString().split('T')[0];
    if (day !== 0 && day !== 6 && !isPublicHoliday(dateStr, holidays)) {
      return dateStr;
    }
    d.setDate(d.getDate() + 1);
    attempts++;
  }
  return d.toISOString().split('T')[0];
}
