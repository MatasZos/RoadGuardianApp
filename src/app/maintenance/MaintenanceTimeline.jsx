import { formatDisplayDate } from "./utils";
import styles from "./maintenance.module.css";

export default function MaintenanceTimeline({ monthSections, onEdit, onDelete }) {
  if (monthSections.length === 0) {
    return <p className={styles.emptyText}>No maintenance records yet</p>;
  }

  return (
    <div className={styles.timeline}>
      {monthSections.map(([month, items]) => (
        <div key={month} className={styles.monthSection}>
          <h2 className={styles.monthTitle}>{month}</h2>

          <div className={styles.timelineList}>
            {items.map((r, idx) => (
              <div key={r._id} className={styles.timelineItem}>
                <div className={styles.timelineLeft}>
                  <div className={styles.dot} />
                  <div
                    className={idx !== items.length - 1 ? styles.line : styles.lineEnd}
                  />
                </div>

                <div className={styles.timelineCard}>
                  <h3 className={styles.cardTitle}>
                    {Array.isArray(r.type) ? r.type.join(", ") : r.type}
                  </h3>

                  {r.motorbike && (
                    <p className={styles.cardText}>
                      <strong>Bike:</strong> {r.motorbike}
                    </p>
                  )}

                  <p className={styles.cardText}>
                    <strong>Date:</strong> {formatDisplayDate(r.date)}
                  </p>

                  <p className={styles.cardText}>
                    <strong>KM serviced at:</strong> {Number(r.km).toLocaleString()}
                  </p>

                  {r.notes && <p className={styles.cardNotes}>{r.notes}</p>}

                  {r.advisories && (
                    <div className={styles.advisoryBox}>
                      <strong>Advisories:</strong> {r.advisories}
                    </div>
                  )}

                  <div className={styles.cardActions}>
                    <button className={styles.editBtn} onClick={() => onEdit(r)}>
                      Edit
                    </button>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => onDelete(r._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
