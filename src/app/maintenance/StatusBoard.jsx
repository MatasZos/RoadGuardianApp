import s from "./maintenance.module.css";

const COLUMNS = [
  { key: "overdue",  label: "Overdue",   color: "#ef4444", urgent: true,  limit: null },
  { key: "dueSoon",  label: "Due Soon",  color: "#f59e0b", urgent: false, limit: null },
  { key: "upcoming", label: "Upcoming",  color: "#22c55e", urgent: false, limit: 6 },
];
const EMPTY_MSG = { overdue: "All clear", dueSoon: "Nothing imminent", upcoming: "No upcoming tasks" };

function TaskCard({ task, showUrgent }) {
  return (
    <div className={s.taskCard}>
      <div className={s.taskCardTop}>
        <span className={s.taskName}>{task.type}</span>
        <span
          className={s.statusPill}
          style={{ background: `${task.status.color}18`, color: task.status.color, border: `1px solid ${task.status.color}40` }}
        >
          {task.status.label}
        </span>
      </div>
      <p className={s.taskMeta}>Last @ {task.lastServiceKm.toLocaleString()} km</p>
      <p className={s.taskMeta}>Due @ {task.nextDueKm.toLocaleString()} km</p>
      {showUrgent
        ? <p className={s.taskUrgent}>⚠ Overdue — service immediately</p>
        : <p className={s.taskMeta}>{task.remainingKm.toLocaleString()} km remaining</p>
      }
      {task.advisories && (
        <div className={s.advisoryTag}><strong>Advisory:</strong> {task.advisories}</div>
      )}
    </div>
  );
}

export default function StatusBoard({ summary }) {
  if (!summary) return null;
  return (
    <div className={s.statusBoard}>
      <div className={s.statusBoardHead}>
        <h2 className={s.statusBoardTitle}>Service Intelligence</h2>
        <span className={s.kmBadge}>
          {summary.bike} &nbsp;·&nbsp; {summary.currentKm.toLocaleString()} KM
        </span>
      </div>

      <div className={s.statusColumns}>
        {COLUMNS.map(({ key, label, color, urgent, limit }) => {
          const tasks = limit ? summary[key].slice(0, limit) : summary[key];
          return (
            <div key={key} className={s.statusColumn}>
              <h3 className={s.columnHeading} style={{ color }}>
                {label}
                {summary[key].length > 0 && (
                  <span style={{ marginLeft: "auto", fontFamily: "'DM Mono',monospace", fontSize: "0.7rem", opacity: 0.8 }}>
                    {summary[key].length}
                  </span>
                )}
              </h3>
              {tasks.length === 0
                ? <p className={s.emptyState}>{EMPTY_MSG[key]}</p>
                : tasks.map((task) => <TaskCard key={task.type} task={task} showUrgent={urgent} />)
              }
            </div>
          );
        })}
      </div>
    </div>
  );
}
