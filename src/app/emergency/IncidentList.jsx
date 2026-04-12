import { STATUS_LABELS } from "./constants";
import { prettify, formatTime } from "./utils";
import { styles } from "./styles";

export default function IncidentList({
  activeIncidents,
  recentHistory,
  loadingIncidents,
  email,
  onRoute,
  onUpdateIncident,
  onMessage,
}) {
  return (
    <div style={styles.columns}>
      {/* Active incidents */}
      <div style={styles.panel}>
        <h2 style={styles.panelTitle}>
          Active Incidents {loadingIncidents ? "..." : `(${activeIncidents.length})`}
        </h2>

        {activeIncidents.length === 0 ? (
          <p style={styles.muted}>No active incidents right now.</p>
        ) : (
          activeIncidents.map((incident) => (
            <div key={incident._id} style={styles.listCard}>
              <div style={styles.listCardTop}>
                <div>
                  <strong>{incident.userName}</strong> • {prettify(incident.type)}
                </div>
                <span style={styles.smallBadge}>
                  {STATUS_LABELS[incident.status] || incident.status}
                </span>
              </div>

              <div style={styles.listCardMeta}>
                <div>Report type: {incident.reportMode === "third_party" ? "Reported by another rider" : "Self reported"}</div>
                {incident.reportMode === "third_party" && incident.reportedForName && (
                  <div>Reported for: {incident.reportedForName}</div>
                )}
                <div>Severity: {prettify(incident.severity)}</div>
                <div>Created: {formatTime(incident.createdAt)}</div>
                <div>Helper: {incident.helperUserName || "None assigned"}</div>
                <div>Latest update: {incident.latestUpdate || "—"}</div>
              </div>

              <div style={styles.actionRow}>
                <button style={styles.secondaryBtn} onClick={() => onRoute(incident.lng, incident.lat)}>
                  Route
                </button>

                {incident.userEmail !== email && (
                  <>
                    <button style={styles.successBtn} onClick={() => onUpdateIncident(incident._id, "claim-help")}>
                      Offer Help
                    </button>
                    <button
                      style={styles.secondaryBtn}
                      onClick={() => onMessage(incident.userEmail, "Hi, I can see your incident and I'm checking in.", incident)}
                    >
                      Message
                    </button>
                  </>
                )}

                {incident.helperUserEmail === email && (
                  <>
                    <button
                      style={styles.secondaryBtn}
                      onClick={async () => {
                        await onRoute(incident.lng, incident.lat);
                        await onUpdateIncident(incident._id, "route-started");
                      }}
                    >
                      I'm On The Way
                    </button>
                    <button style={styles.successBtn} onClick={() => onUpdateIncident(incident._id, "arrived")}>
                      Mark Arrived
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Recent history */}
      <div style={styles.panel}>
        <h2 style={styles.panelTitle}>Recent Incidents</h2>

        {recentHistory.length === 0 ? (
          <p style={styles.muted}>No recent incident history yet.</p>
        ) : (
          recentHistory.map((incident) => (
            <div key={incident._id} style={styles.historyItem}>
              <div style={{ fontWeight: 700 }}>
                {incident.userName} • {prettify(incident.type)}
              </div>
              <div style={styles.historyMeta}>
                {STATUS_LABELS[incident.status] || incident.status} •{" "}
                {formatTime(incident.updatedAt || incident.createdAt)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
