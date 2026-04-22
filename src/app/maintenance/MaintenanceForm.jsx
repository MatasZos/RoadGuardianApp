import { maintenanceTypes } from "./constants";
import styles from "./maintenance.module.css";

export default function MaintenanceForm({
  form,
  setForm,
  editingId,
  previewList,
  onSubmit,
  onToggleTask,
}) {
  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <label className={styles.formLabel}>Select Tasks Done:</label>

      <div className={styles.checkboxContainer}>
        {maintenanceTypes.map((task) => (
          <label key={task} className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={form.type.includes(task)}
              onChange={() => onToggleTask(task)}
            />
            {task}
          </label>
        ))}
      </div>

      <div className={styles.fieldsGrid}>
        <div className={styles.fullWidth}>
          <textarea
            className={styles.textarea}
            value={form.type.join(", ")}
            readOnly
            placeholder="Chosen services"
          />
        </div>

        <div>
          <input
            className={styles.input}
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
        </div>

        <div>
          <input
            className={styles.input}
            type="number"
            placeholder="Kilometers"
            value={form.km}
            onChange={(e) => setForm({ ...form, km: e.target.value })}
            required
          />
        </div>

        <div className={styles.fullWidth}>
          <textarea
            className={styles.textarea}
            placeholder="General notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        <div className={styles.fullWidth}>
          <textarea
            className={styles.textarea}
            placeholder="Advisories for next service (e.g. brake pads wearing low, inspect chain soon)"
            value={form.advisories}
            onChange={(e) => setForm({ ...form, advisories: e.target.value })}
          />
        </div>
      </div>

      {previewList.length > 0 && (
        <div className={styles.previewBox}>
          <h3 className={styles.previewTitle}>Task Due Preview</h3>
          {previewList.map((item) => (
            <p key={item.type} className={styles.previewText}>
              <strong>{item.type}</strong> → next due at{" "}
              {item.nextDueKm.toLocaleString()} km (
              {item.intervalKm.toLocaleString()} km interval)
            </p>
          ))}
        </div>
      )}

      <div className={styles.formActions}>
        <button className={styles.button}>
          {editingId ? "Save Changes" : "Add Record"}
        </button>
      </div>
    </form>
  );
}
