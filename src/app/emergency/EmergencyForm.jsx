import { INCIDENT_TYPES, SEVERITIES } from "./constants";
import { prettify } from "./utils";
import { styles } from "./styles";

export default function EmergencyForm({ form, setForm, submitLoading, onSubmit, onClose }) {
  return (
    <div style={styles.panel}>
      <h2 style={styles.panelTitle}>Create Emergency</h2>

      <div style={styles.formGrid}>
        <label style={styles.field}>
          <span>Emergency report type</span>
          <select
            value={form.reportMode}
            onChange={(e) => setForm((p) => ({ ...p, reportMode: e.target.value }))}
            style={styles.input}
          >
            <option value="self">I need help</option>
            <option value="third_party">I am reporting someone else</option>
          </select>
        </label>

        {form.reportMode === "third_party" && (
          <label style={styles.field}>
            <span>Who are you reporting for?</span>
            <input
              value={form.reportedForName}
              onChange={(e) => setForm((p) => ({ ...p, reportedForName: e.target.value }))}
              style={styles.input}
              placeholder="Rider name or short note"
            />
          </label>
        )}

        <label style={styles.field}>
          <span>Incident type</span>
          <select
            value={form.type}
            onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
            style={styles.input}
          >
            {INCIDENT_TYPES.map((t) => (
              <option key={t} value={t}>{prettify(t)}</option>
            ))}
          </select>
        </label>

        <label style={styles.field}>
          <span>Severity</span>
          <select
            value={form.severity}
            onChange={(e) => setForm((p) => ({ ...p, severity: e.target.value }))}
            style={styles.input}
          >
            {SEVERITIES.map((level) => (
              <option key={level} value={level}>{prettify(level)}</option>
            ))}
          </select>
        </label>

        <label style={styles.fieldWide}>
          <span>Short description</span>
          <textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            rows={4}
            style={{ ...styles.input, resize: "vertical" }}
            placeholder="Explain what happened..."
          />
        </label>

        <label style={styles.field}>
          <span>Phone</span>
          <input
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            style={styles.input}
            placeholder="Contact phone"
          />
        </label>

        <label style={styles.checkboxField}>
          <input
            type="checkbox"
            checked={form.injured}
            onChange={(e) => setForm((p) => ({ ...p, injured: e.target.checked }))}
          />
          <span>Someone is injured</span>
        </label>

        <label style={styles.checkboxField}>
          <input
            type="checkbox"
            checked={form.bikeRideable}
            onChange={(e) => setForm((p) => ({ ...p, bikeRideable: e.target.checked }))}
          />
          <span>Bike is still rideable</span>
        </label>
      </div>

      <div style={styles.actionRow}>
        <button onClick={onSubmit} style={styles.emergencyBtn} disabled={submitLoading}>
          {submitLoading ? "Creating..." : "Send Emergency"}
        </button>
        <button onClick={onClose} style={styles.secondaryBtn}>Close</button>
      </div>
    </div>
  );
}
