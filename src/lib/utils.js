// cleanstring trims the string and returns null if its empty after trimming
export function cleanString(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

// returns cleaned string or empty string
export function cleanStringOrEmpty(value) {
  return cleanString(value) ?? "";
}

// lower case clean string, used everywhere we key on email.
export function cleanEmail(value) {
  return cleanString(value)?.toLowerCase() ?? null;
}
