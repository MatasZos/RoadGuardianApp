import styles from "./maintenance.module.css";

function TaskCard({ task, showUrgent }) {
  return (
    <div className={styles.taskCard}>
      <div className={styles.taskCardTop}>
        <strong>{task.type}</strong>
        <span
          className={styles.statusPill}
          style={{ background: task.status.color }}
        >
          {task.status.label}
        </span>
      </div>

      <p className={styles.taskCardText}>
        Last service: {task.lastServiceKm.toLocaleString()} km
      </p>

      <p className={styles.taskCardText}>
        Next due: {task.nextDueKm.toLocaleString()} km
      </p>

      {showUrgent ? (
        <p className={styles.taskCardUrgent}>Get checked immediately.</p>
      ) : (
        <p className={styles.taskCardText}>
          Remaining: {task.remainingKm.toLocaleString()} km
        </p>
      )}

      {task.advisories && (
        <div className={styles.advisoryBox}>
          <strong>Advisories:</strong> {task.advisories}
        </div>
      )}
    </div>
  );
}

const COLUMNS = [
  { key: "overdue", label: "Overdue", color: "#ef4444", urgent: true, limit: null },
  { key: "dueSoon", label: "Due Soon", color: "#f59e0b", urgent: false, limit: null },
  { key: "upcoming", label: "Upcoming", color: "#22c55e", urgent: false, limit: 6 },
];

const EMPTY = {
  overdue: "No overdue tasks",
  dueSoon: "Nothing due soon",
  upcoming: "No upcoming tasks yet",
};

export default function StatusBoard({ summary }) {
  if (!summary) return null;

  return (
    <div className={`${styles.panel} ${styles.statusBoard}`}>
      <div className={styles.statusBoardHeader}>
        <h2 className={styles.statusBoardTitle}>Bike Service Intelligence</h2>
        <p className={styles.statusBoardSubtitle}>
          {summary.bike} · Estimated current km:{" "}
          <strong>{summary.currentKm.toLocaleString()}</strong>
        </p>
      </div>

      <div className={styles.statusColumns}>
        {COLUMNS.map(({ key, label, color, urgent, limit }) => {
          const tasks = limit ? summary[key].slice(0, limit) : summary[key];

          return (
            <div key={key} className={styles.statusColumn}>
              <h3 className={styles.columnTitle} style={{ color }}>
                {label}
              </h3>

              {tasks.length === 0 ? (
                <p className={styles.emptyText}>{EMPTY[key]}</p>
              ) : (
                tasks.map((task) => (
                  <TaskCard key={task.type} task={task} showUrgent={urgent} />
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
