import styles from "../maintenance.module.css";

const serviceIntervals = {
  "Oil Change": 5000,
  "Brake Pads Replacement": 15000,
  "Chain Clean & Lube": 800,
};

function getStatus(remaining) {
  if (!Number.isFinite(remaining))
    return { label: "Unknown", color: "#94a3b8" };
  if (remaining < 0) return { label: "Overdue", color: "#ef4444" };
  if (remaining <= 500) return { label: "Urgent", color: "#dc2626" };
  if (remaining <= 1500) return { label: "Due Soon", color: "#f59e0b" };
  return { label: "Healthy", color: "#22c55e" };
}

export default function StatusBoard({ records, selectedBike }) {
  if (!selectedBike) return null;

  const bikeRecords = records.filter(
    (r) => r.motorbike === selectedBike
  );

  if (bikeRecords.length === 0) return null;

  const latestTasks = {};

  bikeRecords.forEach((r) => {
    const tasks = Array.isArray(r.type) ? r.type : [r.type];

    tasks.forEach((task) => {
      if (!latestTasks[task] || r.km > latestTasks[task].km) {
        latestTasks[task] = r;
      }
    });
  });

  const tasks = Object.entries(latestTasks).map(([task, record]) => {
    const interval = serviceIntervals[task] || 10000;
    const next = Number(record.km) + interval;
    const remaining = next - Number(record.km);

    return {
      task,
      lastKm: record.km,
      next,
      remaining,
      status: getStatus(remaining),
    };
  });

  return (
    <div className={styles.statusBoard}>
      <h2>Bike Intelligence</h2>
      <p>{selectedBike}</p>

      <div className={styles.statusGrid}>
        {tasks.map((t) => (
          <div key={t.task} className={styles.statusCard}>
            <strong>{t.task}</strong>
            <p>Last: {t.lastKm} km</p>
            <p>Next: {t.next} km</p>

            <span
              className={styles.statusPill}
              style={{ background: t.status.color }}
            >
              {t.status.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}