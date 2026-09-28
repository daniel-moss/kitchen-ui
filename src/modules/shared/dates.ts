// The two date formats the side panels use. Shared since 2026-09-28, when the
// Warranty panel needed the same LONG format the Equipment panel already had.
// Both take an ISO string (the db's date shape) and follow the US rule: month
// first, year always shown.

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/**
 * "January 1, 2026" — the LONG format, used by the General details modules
 * (Daniel, 2026-09-28: "the general details carries full date").
 */
export function formatLongDate(iso: string): string {
  const date = new Date(iso);
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/**
 * "Jan 1, 2026" — the SHORT format with the year, used by the warranty ranges
 * and by every History / Files caption (Daniel, 2026-09-28: "the warranty
 * carries the short version with the year").
 */
export function formatShortDate(iso: string): string {
  const date = new Date(iso);
  return `${MONTHS[date.getMonth()].slice(0, 3)} ${date.getDate()}, ${date.getFullYear()}`;
}
