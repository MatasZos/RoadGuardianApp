import styles from "../maintenance.module.css";

export default function Timeline({ monthSections }) {
  return (
    <div className={styles.timeline}>
      {monthSections.map(([month, items]) => (
        <div key={month}>
          <h3>{month}</h3>

          {items.map((r) => (
            <div key={r._id} className={styles.card}>
              {r.type} - {r.km} km
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}