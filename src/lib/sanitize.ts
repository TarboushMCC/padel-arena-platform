export function sanitizeText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/<[^>]+>/g, "").trim();
}

export function sanitizeNullableText(value: unknown): string | null {
  const text = sanitizeText(value);
  return text.length ? text : null;
}
