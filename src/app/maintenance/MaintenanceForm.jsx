import { maintenanceTypes } from "./constants";
import { styles } from "./styles";

export default function MaintenanceForm({ form, setForm, editingId, previewList, onSubmit, onToggleTask }) {
  return (
    <form onSubmit={onSubmit} style={styles.form}>
      <label style={{ color: "#ccc", fontWeight: "bold" }}>Select Tasks Done:</label>

      <div style={styles.checkboxContainer}>
        {maintenanceTypes.map((task) => (
          <label key={task} style={styles.checkboxLabel}>
            <input type="checkbox" checked={form.type.includes(task)} onChange={() => onToggleTask(task)} />
            {task}
          </label>
        ))}
      </div>

      <textarea style={styles.textarea} value={form.type.join(", ")} readOnly placeholder="Chosen services" />

      <input
        style={styles.input}
        type="date"
        value={form.date}
        onChange={(e) => setForm({ ...form, date: e.target.value })}
        required
      />

      <input
        style={styles.input}
        type="number"
        placeholder="Kilometers"
        value={form.km}
        onChange={(e) => setForm({ ...form, km: e.target.value })}
        required
      />

      <textarea
        style={styles.textarea}
        placeholder="General notes"
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
      />

      <textarea
        style={styles.textarea}
        placeholder="Advisories for next service (e.g. brake pads wearing low, inspect chain soon)"
        value={form.advisories}
        onChange={(e) => setForm({ ...form, advisories: e.target.value })}
      />

      {previewList.length > 0 && (
        <div style={styles.previewBox}>
          <h3 style={styles.previewTitle}>Task Due Preview</h3>
          {previewList.map((item) => (
            <p key={item.type} style={styles.previewText}>
              <strong>{item.type}</strong> → next due at {item.nextDueKm.toLocaleString()} km ({item.intervalKm.toLocaleString()} km interval)
            </p>
          ))}
        </div>
      )}

      <button style={styles.button}>{editingId ? "Save Changes" : "Add Record"}</button>
    </form>
  );
}
