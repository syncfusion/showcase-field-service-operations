const easternParts = new Intl.DateTimeFormat('en-US', {timeZone: 'America/New_York', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hourCycle:'h23'});
function parts(date: Date): number[] {
  const values = Object.fromEntries(easternParts.formatToParts(date).map(p => [p.type,p.value]));
  return ['year','month','day','hour','minute'].map(key => Number(values[key]));
}
export function toEasternWallTime(instant: string): Date {
  const [year, month, day, hour, minute] = parts(new Date(instant));
  return new Date(year, month - 1, day, hour, minute);
}
// The calendar displays Eastern wall time; never let the reviewer's device offset change a booking.
export function fromEasternWallTime(wall: Date): string {
  if (!Number.isFinite(wall.getTime())) throw new Error('Enter a valid appointment date and time.');
  const desired = [wall.getFullYear(), wall.getMonth()+1, wall.getDate(), wall.getHours(), wall.getMinutes()];
  const utc = Date.UTC(desired[0],desired[1]-1,desired[2],desired[3],desired[4]);
  const matches = [4,5].map(offset => new Date(utc + offset*3600000)).filter(date => parts(date).every((value,index)=>value === desired[index]));
  if (matches.length !== 1) throw new Error('This Eastern time is ambiguous or unavailable during a daylight-saving change. Choose another time.');
  return matches[0].toISOString();
}
export const formatDate = (instant: string) => new Intl.DateTimeFormat('en-US', {timeZone:'America/New_York',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(instant));
