export function makeBookingReference(date = new Date()): string {
  const y = date.getFullYear().toString().slice(-2);
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  const random = Math.floor(100000 + Math.random() * 900000);
  return `PA-${y}${m}${d}-${random}`;
}
