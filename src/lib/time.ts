export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60)
    .toString()
    .padStart(2, "0");
  const m = (normalized % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function addMinutesToTime(time: string, delta: number): string {
  return minutesToTime(parseTimeToMinutes(time) + delta);
}

export function durationBetween(startTime: string, endTime: string): number {
  let diff = parseTimeToMinutes(endTime) - parseTimeToMinutes(startTime);
  if (diff <= 0) {
    diff += 1440;
  }
  return diff;
}

export function rangesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  const aStart = parseTimeToMinutes(startA);
  const aEnd = parseTimeToMinutes(endA);
  const bStart = parseTimeToMinutes(startB);
  const bEnd = parseTimeToMinutes(endB);
  return aStart < bEnd && bStart < aEnd;
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function toDateOnly(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}
