import styles from "../maintenance.module.css";

export default function Timeline({ monthSections, startEdit, deleteRecord }) {
  return (
    <div className={styles.timeline}>
      {monthSections.map(([month, items]) => (
        <div key={month} className={styles.monthSection}>
          <h2 className={styles.monthTitle}>{month}</h2>

          {items.map((r) => (
            <div key={r._id} className={styles.timelineCard}>
              <h3 className={styles.cardTitle}>
                {Array.isArray(r.type)
                  ? r.type.join(", ")
                  : r.type || "No task"}
              </h3>

              <p className={styles.cardText}>
                <strong>Bike:</strong> {r.motorbike || "Unknown"}
              </p>

              <p className={styles.cardText}>
                <strong>KM:</strong> {Number(r.km || 0).toLocaleString()}
              </p>

              {r.notes && (
                <p className={styles.cardNotes}>{r.notes}</p>
              )}

              {r.advisories && (
                <div className={styles.advisoryBox}>
                  <strong>Advisories:</strong> {r.advisories}
                </div>
              )}

              <div className={styles.cardActions}>
                <button
                  className={styles.editBtn}
                  onClick={() => startEdit(r)}
                >
                  Edit
                </button>

                <button
                  className={styles.deleteBtn}
                  onClick={() => deleteRecord(r._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}