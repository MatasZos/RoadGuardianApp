// Small helpers shared across the emergency UI.

// Turn "helper_assigned" into "Helper Assigned".
export function humaniseLabel(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export function isEmergencyClosed(status) {
  return status === "resolved" || status === "cancelled";
}

// Decide what colour an emergency marker should be on the map.
export function markerColorForEmergency(status) {
  if (status === "reported" || status === "dispatching") return "#ef4444";

  if (
    status === "helper_assigned" ||
    status === "rider_responding" ||
    status === "on_the_way" ||
    status === "help_on_the_way"
  ) {
    return "#22c55e";
  }

  if (status === "arrived" || status === "assistance_received") return "#f59e0b";
  if (status === "resolved" || status === "cancelled") return "#9ca3af";
  return "#ef4444";
}

export function formatDateTime(dateValue) {
  if (!dateValue) return "—";
  try {
    return new Date(dateValue).toLocaleString();
  } catch {
    return "—";
  }
}

// Distance in km between two lat/lng points (Haversine).
export function distanceKmBetween(a, b) {
  if (!a || !b) return null;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

// Mapbox popups don't inherit Bootstrap, so we inline a simple button style.
export function popupButtonStyle(background) {
  return `background:${background};color:white;border:none;border-radius:8px;padding:8px 10px;cursor:pointer;font-weight:700;width:100%;`;
}
