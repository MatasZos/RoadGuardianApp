import { styles } from "./styles";

function TaskCard({ task, showUrgent }) {
  return (
    <div style={styles.taskCard}>
      <div style={styles.taskCardTop}>
        <strong>{task.type}</strong>
        <span style={{ ...styles.statusPill, background: task.status.color }}>{task.status.label}</span>
      </div>
      <p style={styles.taskCardText}>Last service: {task.lastServiceKm.toLocaleString()} km</p>
      <p style={styles.taskCardText}>Next due: {task.nextDueKm.toLocaleString()} km</p>
      {showUrgent
        ? <p style={styles.taskCardUrgent}>Get checked immediately.</p>
        : <p style={styles.taskCardText}>Remaining: {task.remainingKm.toLocaleString()} km</p>
      }
      {task.advisories && (
        <div style={styles.advisoryBox}><strong>Advisories:</strong> {task.advisories}</div>
      )}
    </div>
  );
}

const COLUMNS = [
  { key: "overdue",  label: "Overdue",   color: "#ef4444", urgent: true,  limit: null },
  { key: "dueSoon",  label: "Due Soon",  color: "#f59e0b", urgent: false, limit: null },
  { key: "upcoming", label: "Upcoming",  color: "#22c55e", urgent: false, limit: 6 },
];

const EMPTY = { overdue: "No overdue tasks", dueSoon: "Nothing due soon", upcoming: "No upcoming tasks yet" };

export default function StatusBoard({ summary }) {
  if (!summary) return null;
  return (
    <div style={styles.statusBoard}>
      <div style={styles.statusBoardHeader}>
        <h2 style={styles.statusBoardTitle}>Bike Service Intelligence</h2>
        <p style={styles.statusBoardSubtitle}>
          {summary.bike} · Estimated current km: <strong>{summary.currentKm.toLocaleString()}</strong>
        </p>
      </div>

      <div style={styles.statusColumns}>
        {COLUMNS.map(({ key, label, color, urgent, limit }) => {
          const tasks = limit ? summary[key].slice(0, limit) : summary[key];
          return (
            <div key={key} style={styles.statusColumn}>
              <h3 style={{ ...styles.columnTitle, color }}>{label}</h3>
              {tasks.length === 0
                ? <p style={styles.emptyText}>{EMPTY[key]}</p>
                : tasks.map((task) => <TaskCard key={task.type} task={task} showUrgent={urgent} />)
              }
            </div>
          );
        })}
      </div>
    </div>
  );
}
