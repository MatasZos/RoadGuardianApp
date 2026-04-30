// Utility functions for the emergency page.
export function prettify(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}
export function isClosedStatus(status) {
  return status === "resolved" || status === "cancelled";
}
export function markerColorForIncident(status) {
  // Red = freshly reported / waiting for help
  if (status === "reported" || status === "dispatching") return "#ef4444";
  // Green = a helper has claimed it / on the way
  if (status === "rider_responding" || status === "help_on_the_way") return "#22c55e";
  // Amber = victim has confirmed the helper has arrived / is being helped
  if (status === "assistance_received") return "#f59e0b";
  // Grey = closed 
  if (status === "resolved" || status === "cancelled") return "#9ca3af";
  return "#ef4444";
}
export function formatTime(dateValue) {
  if (!dateValue) return "—";
  try {
    return new Date(dateValue).toLocaleString();
  } catch {
    return "—";
  }
}
// Haversine formula to calculate the distance in km between two lat/lng points. used to show how far helpers are from the incident, and to decide whether to show the "I'm nearby" quick reply.
export function haversineKm(a, b) {
  if (!a || !b) return null;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(a.lat)) *
      Math.cos(toRad(b.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
export function popupBtnStyle(background) {
  return `background:${background};color:white;border:none;border-radius:8px;padding:8px 10px;cursor:pointer;font-weight:700;width:100%;`;
}
