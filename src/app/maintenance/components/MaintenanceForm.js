import styles from "../maintenance.module.css";

export default function MaintenanceForm({
  form,
  setForm,
  toggleTask,
  handleSubmit,
  maintenanceTypes,
}) {
  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <label>Select Tasks Done:</label>

      <div className={styles.checkboxContainer}>
        {maintenanceTypes.map((task) => (
          <label key={task} className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={form.type.includes(task)}
              onChange={() => toggleTask(task)}
            />
            {task}
          </label>
        ))}
      </div>

      <input
        className={styles.input}
        type="date"
        value={form.date}
        onChange={(e) =>
          setForm({ ...form, date: e.target.value })
        }
      />

      <input
        className={styles.input}
        type="number"
        placeholder="KM"
        value={form.km}
        onChange={(e) =>
          setForm({ ...form, km: e.target.value })
        }
      />

      <textarea
        className={styles.textarea}
        placeholder="Notes"
        value={form.notes}
        onChange={(e) =>
          setForm({ ...form, notes: e.target.value })
        }
      />

      <textarea
        className={styles.textarea}
        placeholder="Advisories"
        value={form.advisories}
        onChange={(e) =>
          setForm({ ...form, advisories: e.target.value })
        }
      />

      <button className={styles.button}>
        Add Record
      </button>
    </form>
  );
}