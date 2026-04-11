import styles from "../maintenance.module.css";

export default function StatusBoard({ summary }) {
  if (!summary) return null;

  return (
    <div className={styles.statusBoard}>
      <h2>Bike Service Intelligence</h2>

      <p>
        {summary.bike} · KM:{" "}
        <strong>{summary.currentKm.toLocaleString()}</strong>
      </p>

      <div className={styles.statusGrid}>
        <Column title="Overdue" items={summary.overdue} />
        <Column title="Due Soon" items={summary.dueSoon} />
        <Column title="Upcoming" items={summary.upcoming} />
      </div>
    </div>
  );
}

function Column({ title, items }) {
  return (
    <div className={styles.statusCard}>
      <h3>{title}</h3>

      {items.length === 0 ? (
        <p>No tasks</p>
      ) : (
        items.map((t) => (
          <div key={t.type}>
            <strong>{t.type}</strong>
            <p>{t.remainingKm.toLocaleString()} km left</p>
          </div>
        ))
      )}
    </div>
  );
}