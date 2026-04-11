import styles from "../maintenance.module.css";

export default function Timeline({ records }) {
  return (
    <div className={styles.timeline}>
      {records.map((r) => (
        <div key={r._id} className={styles.card}>
          <strong>{r.type}</strong>
          <p>{r.km} km</p>
          {r.motorbike && <p>{r.motorbike}</p>}
        </div>
      ))}
    </div>
  );
}