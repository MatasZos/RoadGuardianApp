// HTML strings injected into Mapbox popups.
//
// We can't use React/Bootstrap inside a popup — Mapbox renders the popup as
// its own DOM tree, separate from React's tree. So we hand it a plain HTML
// string and let the marker effect bind click handlers afterwards via the
// CSS classes embedded here.

import { STATUS_LABELS } from "./constants";
import { prettify, formatTime, popupBtnStyle } from "./utils";

function buttonsForViewer({ id, incident, viewerEmail }) {
  const isMine = incident.userEmail === viewerEmail;
  const isHelper = incident.helperUserEmail === viewerEmail;

  if (isMine) {
    return `
      <button class="cancel-incident-btn"  data-id="${id}" style="${popupBtnStyle("#dc2626")}">Cancel request</button>
      <button class="resolve-incident-btn" data-id="${id}" style="${popupBtnStyle("#16a34a")}">Mark resolved</button>
    `;
  }

  let html = `
    <button class="claim-help-btn"     data-id="${id}" style="${popupBtnStyle("#16a34a")}">Offer help</button>
    <button class="route-incident-btn" data-id="${id}" data-lng="${incident.lng}" data-lat="${incident.lat}" style="${popupBtnStyle("#2563eb")}">Route there</button>
    <button class="chat-incident-btn"  data-id="${id}" data-email="${incident.userEmail}" style="${popupBtnStyle("#7c3aed")}">Message rider</button>
  `;

  if (isHelper) {
    html += `
      <button class="route-started-btn" data-id="${id}" data-lng="${incident.lng}" data-lat="${incident.lat}" style="${popupBtnStyle("#0ea5e9")}">I'm on the way</button>
      <button class="arrived-btn"       data-id="${id}" style="${popupBtnStyle("#f59e0b")}">Mark arrived</button>
      <button class="resolve-incident-btn" data-id="${id}" style="${popupBtnStyle("#16a34a")}">Resolve</button>
    `;
  }

  return html;
}

export function buildIncidentPopupHTML({ incident, viewerEmail, distanceKm }) {
  const id = String(incident._id);
  const reportLine =
    incident.reportMode === "third_party"
      ? "Reported by another rider"
      : "Self reported";

  return `
    <div style="color:#111; min-width:240px; line-height:1.45;">
      <div style="font-weight:800; font-size:15px; margin-bottom:6px;">${incident.userName || "Rider"} • ${prettify(incident.type)}</div>
      <div><strong>Report type:</strong> ${reportLine}</div>
      ${incident.reportMode === "third_party" && incident.reportedForName
        ? `<div><strong>Reported for:</strong> ${incident.reportedForName}</div>`
        : ""}
      <div><strong>Status:</strong> ${STATUS_LABELS[incident.status] || incident.status}</div>
      <div><strong>Severity:</strong> ${prettify(incident.severity)}</div>
      <div><strong>Injured:</strong> ${incident.injured ? "Yes" : "No"}</div>
      <div><strong>Bike rideable:</strong> ${incident.bikeRideable === null ? "Unknown" : incident.bikeRideable ? "Yes" : "No"}</div>
      <div><strong>Phone:</strong> ${incident.phone || "—"}</div>
      <div><strong>Created:</strong> ${formatTime(incident.createdAt)}</div>
      <div><strong>Latest update:</strong> ${incident.latestUpdate || "—"}</div>
      <div><strong>Distance:</strong> ${distanceKm == null ? "—" : `${distanceKm.toFixed(1)} km`}</div>
      ${incident.description
        ? `<div style="margin-top:8px;"><strong>Description:</strong><br/>${incident.description}</div>`
        : ""}
      <div style="margin-top:8px;"><strong>Helper:</strong> ${incident.helperUserName || "Not assigned"}</div>
      <div style="display:grid; gap:8px; margin-top:12px;">
        ${buttonsForViewer({ id, incident, viewerEmail })}
      </div>
    </div>
  `;
}

export function buildRiderPopupHTML({ rider, distanceKm }) {
  const id = String(rider._id);
  return `
    <div style="color:#111; min-width:220px; line-height:1.45;">
      <div style="font-weight:800; margin-bottom:6px;">${rider.userName || "Rider"}</div>
      <div><strong>Email:</strong> ${rider.userEmail}</div>
      <div><strong>Status:</strong> Nearby rider</div>
      <div><strong>Distance:</strong> ${distanceKm == null ? "—" : `${distanceKm.toFixed(1)} km`}</div>
      <div style="display:grid; gap:8px; margin-top:12px;">
        <button class="route-rider-btn" data-id="${id}" style="${popupBtnStyle("#2563eb")}">Route to rider</button>
        <button class="chat-rider-btn"  data-id="${id}" data-email="${rider.userEmail}" style="${popupBtnStyle("#7c3aed")}">Message rider</button>
      </div>
    </div>
  `;
}
