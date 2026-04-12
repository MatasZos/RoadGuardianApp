import { STATUS_LABELS } from "./constants";
import { prettify, formatTime } from "./utils";
import { styles } from "./styles";

export default function ActiveIncidentCard({ incident, onResolve, onCancel }) {
  return (
    <div style={styles.activeCard}>
      <div style={styles.activeCardTop}>
        <div>
          <h2 style={{ margin: 0, color: "#ef4444" }}>{prettify(incident.type)}</h2>
          <p style={{ margin: "6px 0 0", color: "#e2e8f0" }}>
            {STATUS_LABELS[incident.status] || incident.status}
          </p>
        </div>
        <div style={styles.badge}>{prettify(incident.severity)}</div>
      </div>

      <div style={styles.infoGrid}>
        <div><strong>Created:</strong> {formatTime(incident.createdAt)}</div>
        <div><strong>Phone:</strong> {incident.phone || "—"}</div>
        <div><strong>Injured:</strong> {incident.injured ? "Yes" : "No"}</div>
        <div><strong>Bike rideable:</strong> {incident.bikeRideable ? "Yes" : "No"}</div>
        <div><strong>Latest update:</strong> {incident.latestUpdate || "—"}</div>
        <div><strong>Helper:</strong> {incident.helperUserName || "No rider assigned yet"}</div>
      </div>

      {incident.description && (
        <div style={{ marginTop: 12 }}>
          <strong>Description:</strong>
          <p style={{ marginTop: 6, color: "#cbd5e1" }}>{incident.description}</p>
        </div>
      )}

      <div style={styles.actionRow}>
        <button onClick={onResolve} style={styles.successBtn}>
          Assistance Received / Resolve
        </button>
        <button onClick={onCancel} style={styles.dangerBtn}>
          Cancel Request
        </button>
      </div>
    </div>
  );
}
