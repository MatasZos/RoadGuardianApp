import styles from "../maintenance.module.css";

export default function Timeline({ monthSections }) {
  return (
    <div className={styles.timeline}>
      {monthSections.map(([month, items]) => (
        <div key={month} className={styles.monthSection}>
          <h2 className={styles.monthTitle}>{month}</h2>

          {items.map((r) => (
            <div key={r._id} className={styles.timelineCard}>
              <h3 className={styles.cardTitle}>
                {Array.isArray(r.type) ? r.type.join(", ") : r.type}
              </h3>

              <p className={styles.cardText}>
                <strong>Bike:</strong> {r.motorbike}
              </p>

              <p className={styles.cardText}>
                <strong>KM:</strong> {Number(r.km).toLocaleString()}
              </p>

              {r.notes && (
                <p className={styles.cardNotes}>{r.notes}</p>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}