import { formatDisplayDate } from "./utils";
import s from "./maintenance.module.css";

export default function MaintenanceTimeline({ monthSections, onEdit, onDelete }) {
  if (monthSections.length === 0) {
    return (
      <div className={s.timelineWrap}>
        <p style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.82rem", color: "#333", textAlign: "center", padding: "40px 0" }}>
          No records yet — log your first service above.
        </p>
      </div>
    );
  }

  return (
    <div className={s.timelineWrap}>
      <p className={s.sectionLabel} style={{ marginBottom: 20 }}>Service History</p>

      {monthSections.map(([month, items]) => (
        <div key={month} className={s.monthGroup}>
          <p className={s.timelineSectionTitle}>{month}</p>

          <div className={s.timelineList}>
            {items.map((r, idx) => (
              <div key={r._id} className={s.timelineItem}>
                <div className={s.timelineGutter}>
                  <div className={s.timelineDot} />
                  {idx !== items.length - 1 && <div className={s.timelineLine} />}
                </div>

                <div className={s.timelineCard}>
                  <h3 className={s.timelineCardTitle}>
                    {Array.isArray(r.type) ? r.type.join(", ") : r.type}
                  </h3>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "4px" }}>
                    {r.motorbike && (
                      <p className={s.timelineCardMeta}><strong>Bike</strong> {r.motorbike}</p>
                    )}
                    <p className={s.timelineCardMeta}><strong>Date</strong> {formatDisplayDate(r.date)}</p>
                    <p className={s.timelineCardMeta}><strong>KM</strong> {Number(r.km).toLocaleString()}</p>
                  </div>

                  {r.notes && <p className={s.timelineCardNotes}>{r.notes}</p>}

                  {r.advisories && (
                    <div className={s.advisoryTag} style={{ marginTop: 10 }}>
                      <strong>Advisory:</strong> {r.advisories}
                    </div>
                  )}

                  <div className={s.cardActions}>
                    <button className={s.btnEdit} onClick={() => onEdit(r)}>Edit</button>
                    <button className={s.btnDelete} onClick={() => onDelete(r._id)}>Delete</button>
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
