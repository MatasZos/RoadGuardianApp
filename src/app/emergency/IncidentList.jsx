import { STATUS_LABELS } from "./constants";
import { prettify, formatTime } from "./utils";
import s from "./emergency.module.css";

export default function IncidentList({
  activeIncidents, recentHistory, loadingIncidents,
  email, onRoute, onUpdateIncident, onMessage,
}) {
  return (
    <div className={s.columns}>
      {/* Active */}
      <div className={s.panel}>
        <p className={s.panelTitle}>
          Active Incidents{" "}
          {loadingIncidents
            ? <span style={{ color: "#1e293b" }}>···</span>
            : <span style={{ color: "#ef4444" }}>({activeIncidents.length})</span>
          }
        </p>

        {activeIncidents.length === 0 ? (
          <p className={s.muted}>No active incidents.</p>
        ) : (
          activeIncidents.map((incident) => (
            <div key={incident._id} className={s.listCard}>
              <div className={s.listCardTop}>
                <span className={s.listCardName}>
                  {incident.userName} <span style={{ color: "#334155" }}>·</span> {prettify(incident.type)}
                </span>
                <span className={s.statusChip}>
                  {STATUS_LABELS[incident.status] || incident.status}
                </span>
              </div>

              <div className={s.listCardMeta}>
                <span>
                  {incident.reportMode === "third_party" ? "Reported by another rider" : "Self reported"}
                  {incident.reportMode === "third_party" && incident.reportedForName && ` · For: ${incident.reportedForName}`}
                </span>
                <span>Severity: {prettify(incident.severity)}</span>
                <span>{formatTime(incident.createdAt)}</span>
                <span>Helper: {incident.helperUserName || "None"}</span>
                {incident.latestUpdate && <span>{incident.latestUpdate}</span>}
              </div>

              <div className={s.actionRow}>
                <button className={s.btnRoute} onClick={() => onRoute(incident.lng, incident.lat)}>
                  Route
                </button>

                {incident.userEmail !== email && (
                  <>
                    <button className={s.btnOffer} onClick={() => onUpdateIncident(incident._id, "claim-help")}>
                      Offer Help
                    </button>
                    <button className={s.btnMsg} onClick={() => onMessage(incident.userEmail, "Hi, I can see your incident and I'm checking in.", incident)}>
                      Message
                    </button>
                  </>
                )}

                {incident.helperUserEmail === email && (
                  <>
                    <button
                      className={s.btnRoute}
                      onClick={async () => { await onRoute(incident.lng, incident.lat); await onUpdateIncident(incident._id, "route-started"); }}
                    >
                      On My Way
                    </button>
                    <button className={s.btnOffer} onClick={() => onUpdateIncident(incident._id, "arrived")}>
                      Arrived
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* History */}
      <div className={s.panel}>
        <p className={s.panelTitle}>Recent History</p>

        {recentHistory.length === 0 ? (
          <p className={s.muted}>No recent history.</p>
        ) : (
          recentHistory.map((incident) => (
            <div key={incident._id} className={s.historyItem}>
              <div className={s.historyName}>
                {incident.userName} · {prettify(incident.type)}
              </div>
              <div className={s.historyMeta}>
                {STATUS_LABELS[incident.status] || incident.status} · {formatTime(incident.updatedAt || incident.createdAt)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
