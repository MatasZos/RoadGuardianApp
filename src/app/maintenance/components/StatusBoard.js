import styles from "../maintenance.module.css";

export default function StatusBoard({ summary }) {
  if (!summary) return null;

  return (
    <div className={styles.statusBoard}>
      <h2>Bike Service Intelligence</h2>
      <p>
        {summary.bike} · {summary.currentKm.toLocaleString()} km
      </p>
    </div>
  );
}