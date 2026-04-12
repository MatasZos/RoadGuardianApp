import { STATUS_LABELS } from "./constants";
import { prettify, formatTime } from "./utils";
import s from "./emergency.module.css";

export default function ActiveIncidentCard({ incident, onResolve, onCancel }) {
  return (
    <div className={s.activeCard} style={{ marginBottom: 20 }}>
      <div className={s.activeCardTop}>
        <div>
          <h2 className={s.activeCardTitle}>{prettify(incident.type)}</h2>
          <p className={s.activeCardStatus}>
            {STATUS_LABELS[incident.status] || incident.status}
          </p>
        </div>
        <span className={s.severityBadge}>{prettify(incident.severity)}</span>
      </div>

      <div className={s.infoGrid}>
        <div><strong>Created</strong><br />{formatTime(incident.createdAt)}</div>
        <div><strong>Phone</strong><br />{incident.phone || "—"}</div>
        <div><strong>Injured</strong><br />{incident.injured ? "Yes" : "No"}</div>
        <div><strong>Rideable</strong><br />{incident.bikeRideable ? "Yes" : "No"}</div>
        <div><strong>Update</strong><br />{incident.latestUpdate || "—"}</div>
        <div><strong>Helper</strong><br />{incident.helperUserName || "Unassigned"}</div>
      </div>

      {incident.description && (
        <div style={{ marginBottom: 16, color: "#64748b", fontSize: "0.88rem", fontStyle: "italic" }}>
          "{incident.description}"
        </div>
      )}

      <div className={s.actionRow}>
        <button className={s.btnSuccess} onClick={onResolve}>
          ✓ Mark Resolved
        </button>
        <button className={s.btnDanger} onClick={onCancel}>
          Cancel Request
        </button>
      </div>
    </div>
  );
}
