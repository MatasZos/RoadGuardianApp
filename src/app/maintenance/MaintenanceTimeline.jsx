import { formatDisplayDate } from "./utils";
import { styles } from "./styles";

export default function MaintenanceTimeline({ monthSections, onEdit, onDelete }) {
  if (monthSections.length === 0) {
    return <p style={{ color: "#aaa" }}>No maintenance records yet</p>;
  }

  return (
    <div style={styles.timeline}>
      {monthSections.map(([month, items]) => (
        <div key={month} style={styles.monthSection}>
          <h2 style={styles.monthTitle}>{month}</h2>

          <div style={styles.timelineList}>
            {items.map((r, idx) => (
              <div key={r._id} style={styles.timelineItem}>
                <div style={styles.timelineLeft}>
                  <div style={styles.dot} />
                  <div style={idx !== items.length - 1 ? styles.line : styles.lineEnd} />
                </div>

                <div style={styles.timelineCard}>
                  <h3 style={styles.cardTitle}>
                    {Array.isArray(r.type) ? r.type.join(", ") : r.type}
                  </h3>

                  {r.motorbike && <p style={styles.cardText}><strong>Bike:</strong> {r.motorbike}</p>}
                  <p style={styles.cardText}><strong>Date:</strong> {formatDisplayDate(r.date)}</p>
                  <p style={styles.cardText}><strong>KM serviced at:</strong> {Number(r.km).toLocaleString()}</p>
                  {r.notes && <p style={styles.cardNotes}>{r.notes}</p>}

                  {r.advisories && (
                    <div style={styles.advisoryBox}><strong>Advisories:</strong> {r.advisories}</div>
                  )}

                  <div style={styles.cardActions}>
                    <button style={styles.editBtn}   onClick={() => onEdit(r)}>Edit</button>
                    <button style={styles.deleteBtn} onClick={() => onDelete(r._id)}>Delete</button>
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
