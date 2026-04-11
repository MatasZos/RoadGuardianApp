import styles from "../maintenance.module.css";

export default function Timeline({
  monthSections,
  startEdit,
  deleteRecord,
}) {
  return (
    <div className={styles.timeline}>
      {monthSections.map(([month, items]) => (
        <div key={month}>
          <h2>{month}</h2>

          {items.map((r) => (
            <div key={r._id}>
              <p>{r.type}</p>

              <button onClick={() => startEdit(r)}>
                Edit
              </button>

              <button onClick={() => deleteRecord(r._id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}