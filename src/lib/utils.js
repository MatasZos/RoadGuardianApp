// Tiny shared helpers used by both API routes and pages.

export function cleanString(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

// Same as cleanString but returns "" instead of null. Handy for $set updates
// where we want an empty field rather than `null`.
export function cleanStringOrEmpty(value) {
  return cleanString(value) ?? "";
}

// Lower-cased clean string, used everywhere we key on email.
export function cleanEmail(value) {
  return cleanString(value)?.toLowerCase() ?? null;
}
