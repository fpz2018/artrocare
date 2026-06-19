// Small date helpers for the fitness tracker. All dates are stored as
// ISO `YYYY-MM-DD` strings so they sort and compare as plain strings.

export function todayISO() {
  const d = new Date();
  // Use local time, not UTC, so "today" matches the user's wall clock.
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d - tz).toISOString().slice(0, 10);
}

const WEEKDAYS = [
  'Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag',
];
const MONTHS = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
];

// "Woensdag, 20 juni 2026"
export function formatDutchDate(iso) {
  const d = iso ? new Date(iso + 'T00:00:00') : new Date();
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// "20 jun" — compact label for charts/tables.
export function formatShort(iso) {
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

// ISO dates (Mon..Sun) for the week containing `iso`.
export function weekDates(iso = todayISO()) {
  const d = new Date(iso + 'T00:00:00');
  const day = (d.getDay() + 6) % 7; // 0 = Monday
  const monday = new Date(d);
  monday.setDate(d.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(monday);
    x.setDate(monday.getDate() + i);
    const tz = x.getTimezoneOffset() * 60000;
    return new Date(x - tz).toISOString().slice(0, 10);
  });
}

export const WEEKDAY_LETTERS = ['M', 'D', 'W', 'D', 'V', 'Z', 'Z'];

// Hours elapsed since an ISO timestamp, as a float.
export function hoursSince(isoTimestamp) {
  if (!isoTimestamp) return 0;
  return (Date.now() - new Date(isoTimestamp).getTime()) / 3600000;
}
