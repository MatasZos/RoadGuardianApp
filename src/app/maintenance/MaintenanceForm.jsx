import { maintenanceTypes } from "./constants";
import s from "./maintenance.module.css";

export default function MaintenanceForm({ form, setForm, editingId, previewList, onSubmit, onToggleTask }) {
  return (
    <div className={s.formCard}>
      <p className={s.sectionLabel}>Log Entry</p>
      <h2 className={s.sectionTitle} style={{ marginBottom: 20 }}>
        {editingId ? "Edit Record" : "New Service Record"}
      </h2>

      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label className={s.formLabel}>Tasks performed</label>
          <div className={s.checkboxGrid}>
            {maintenanceTypes.map((task) => (
              <label key={task} className={s.checkboxItem}>
                <input type="checkbox" checked={form.type.includes(task)} onChange={() => onToggleTask(task)} />
                {task}
              </label>
            ))}
          </div>
        </div>

        {form.type.length > 0 && (
          <textarea
            className={s.formTextarea}
            value={form.type.join(", ")}
            readOnly
            style={{ color: "#555", fontSize: "0.82rem", fontFamily: "'DM Mono',monospace" }}
          />
        )}

        <div className={s.formRow}>
          <div>
            <label className={s.formLabel}>Service date</label>
            <input
              className={s.formInput}
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </div>
          <div>
            <label className={s.formLabel}>Odometer (km)</label>
            <input
              className={s.formInput}
              type="number"
              placeholder="e.g. 14500"
              value={form.km}
              onChange={(e) => setForm({ ...form, km: e.target.value })}
              required
            />
          </div>
        </div>

        <div>
          <label className={s.formLabel}>Notes</label>
          <textarea
            className={s.formTextarea}
            placeholder="General observations..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        <div>
          <label className={s.formLabel}>Advisories for next service</label>
          <textarea
            className={s.formTextarea}
            placeholder="e.g. brake pads wearing low, inspect chain soon"
            value={form.advisories}
            onChange={(e) => setForm({ ...form, advisories: e.target.value })}
          />
        </div>

        {previewList.length > 0 && (
          <div className={s.previewBox}>
            <p className={s.previewTitle}>Next Due Preview</p>
            {previewList.map((item) => (
              <p key={item.type} className={s.previewItem}>
                <strong>{item.type}</strong> → {item.nextDueKm.toLocaleString()} km
                <span style={{ color: "#444" }}> ({item.intervalKm.toLocaleString()} km interval)</span>
              </p>
            ))}
          </div>
        )}

        <div>
          <button className={s.btnPrimary} type="submit">
            {editingId ? "Save Changes" : "Log Service"}
          </button>
        </div>
      </form>
    </div>
  );
}
