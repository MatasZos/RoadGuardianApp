// HTML strings injected into Mapbox popups.
//
// Mapbox renders popups outside React's tree, so we pass plain HTML here and
// bind click handlers later using the button CSS classes.

import { EMERGENCY_STATUS_LABELS } from "./emergencyConfig";
import { humaniseLabel, formatDateTime, popupButtonStyle } from "./emergencyHelpers";

function actionButtons({ id, emergency, viewerEmail }) {
  const isReporter = emergency.userEmail === viewerEmail;
  const isHelper = emergency.helperUserEmail === viewerEmail;
  const hasHelper = Boolean(emergency.helperUserEmail);

  if (isReporter) {
    return `
      <button class="cancel-incident-btn"  data-id="${id}" style="${popupButtonStyle("#dc2626")}">Cancel request</button>
      <button class="resolve-incident-btn" data-id="${id}" style="${popupButtonStyle("#16a34a")}">Mark resolved</button>
    `;
  }

  const buttons = [];

  // Basic actions anyone can take.
  if (!hasHelper) {
    buttons.push(
      `<button class="claim-help-btn" data-id="${id}" style="${popupButtonStyle("#16a34a")}">Offer help</button>`
    );
  }

  buttons.push(
    `<button class="route-incident-btn" data-id="${id}" data-lng="${emergency.lng}" data-lat="${emergency.lat}" style="${popupButtonStyle("#2563eb")}">Route there</button>`
  );

  buttons.push(
    `<button class="chat-incident-btn" data-id="${id}" data-email="${emergency.userEmail}" style="${popupButtonStyle("#7c3aed")}">Message rider</button>`
  );

  // Helper workflow.
  if (isHelper) {
    if (
      emergency.status === "helper_assigned" ||
      emergency.status === "rider_responding"
    ) {
      buttons.push(
        `<button class="route-started-btn" data-id="${id}" data-lng="${emergency.lng}" data-lat="${emergency.lat}" style="${popupButtonStyle("#0ea5e9")}">I'm on the way</button>`
      );
    }

    if (
      emergency.status === "on_the_way" ||
      emergency.status === "help_on_the_way"
    ) {
      buttons.push(
        `<button class="arrived-btn" data-id="${id}" style="${popupButtonStyle("#f59e0b")}">Mark arrived</button>`
      );
    }

    if (
      emergency.status === "arrived" ||
      emergency.status === "assistance_received"
    ) {
      buttons.push(
        `<button class="resolve-incident-btn" data-id="${id}" style="${popupButtonStyle("#16a34a")}">Mark resolved</button>`
      );
    }
  }

  return buttons.join("\n");
}

export function buildEmergencyPopupHtml({ emergency, viewerEmail, distanceKm }) {
  const id = String(emergency._id);
  const reportLine =
    emergency.reportMode === "third_party"
      ? "Reported by another rider"
      : "Self reported";

  return `
    <div style="color:#111; min-width:240px; line-height:1.45;">
      <div style="font-weight:800; font-size:15px; margin-bottom:6px;">${emergency.userName || "Rider"} • ${humaniseLabel(emergency.type)}</div>
      <div><strong>Report type:</strong> ${reportLine}</div>
      ${
        emergency.reportMode === "third_party" && emergency.reportedForName
          ? `<div><strong>Reported for:</strong> ${emergency.reportedForName}</div>`
          : ""
      }
      <div><strong>Status:</strong> ${EMERGENCY_STATUS_LABELS[emergency.status] || emergency.status}</div>
      <div><strong>Severity:</strong> ${humaniseLabel(emergency.severity)}</div>
      <div><strong>Injured:</strong> ${emergency.injured ? "Yes" : "No"}</div>
      <div><strong>Bike rideable:</strong> ${emergency.bikeRideable === null ? "Unknown" : emergency.bikeRideable ? "Yes" : "No"}</div>
      <div><strong>Phone:</strong> ${emergency.phone || "—"}</div>
      <div><strong>Created:</strong> ${formatDateTime(emergency.createdAt)}</div>
      <div><strong>Latest update:</strong> ${emergency.latestUpdate || "—"}</div>
      <div><strong>Distance:</strong> ${distanceKm == null ? "—" : `${distanceKm.toFixed(1)} km`}</div>
      ${
        emergency.description
          ? `<div style="margin-top:8px;"><strong>Description:</strong><br/>${emergency.description}</div>`
          : ""
      }
      <div style="margin-top:8px;"><strong>Helper:</strong> ${emergency.helperUserName || "Not assigned"}</div>
      <div style="display:grid; gap:8px; margin-top:12px;">
        ${actionButtons({ id, emergency, viewerEmail })}
      </div>
    </div>
  `;
}

export function buildRiderPopupHtml({ rider, distanceKm }) {
  const id = String(rider._id);
  return `
    <div style="color:#111; min-width:220px; line-height:1.45;">
      <div style="font-weight:800; margin-bottom:6px;">${rider.userName || "Rider"}</div>
      <div><strong>Email:</strong> ${rider.userEmail}</div>
      <div><strong>Status:</strong> Nearby rider</div>
      <div><strong>Distance:</strong> ${distanceKm == null ? "—" : `${distanceKm.toFixed(1)} km`}</div>
      <div style="display:grid; gap:8px; margin-top:12px;">
        <button class="route-rider-btn" data-id="${id}" style="${popupButtonStyle("#2563eb")}">Route to rider</button>
        <button class="chat-rider-btn"  data-id="${id}" data-email="${rider.userEmail}" style="${popupButtonStyle("#7c3aed")}">Message rider</button>
      </div>
    </div>
  `;
}
