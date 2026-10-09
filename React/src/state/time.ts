// Appointment times are shown and entered in the viewer's own time zone; the stored value stays a UTC instant.
export function toPickerDate(instant: string): Date {
  return new Date(instant);
}
export function fromPickerDate(value: Date): string {
  if (!Number.isFinite(value.getTime())) throw new Error('Enter a valid appointment date and time.');
  return value.toISOString();
}
export const addHours = (instant: string, hours: number) => new Date(Date.parse(instant) + hours * 3600000).toISOString();
export const formatDate = (instant: string) => new Intl.DateTimeFormat('en-US', {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(instant));
export const formatDay = (instant: string) => new Intl.DateTimeFormat('en-US', {month:'short',day:'numeric',year:'numeric'}).format(new Date(instant));
export const formatTime = (instant: string) => new Intl.DateTimeFormat('en-US', {hour:'numeric',minute:'2-digit'}).format(new Date(instant));
export const viewerTimeZone = () => new Intl.DateTimeFormat().resolvedOptions().timeZone;
