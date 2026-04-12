import { INCIDENT_TYPES, SEVERITIES } from "./constants";
import { prettify } from "./utils";
import s from "./emergency.module.css";

export default function EmergencyForm({ form, setForm, submitLoading, onSubmit, onClose }) {
  return (
    <div className={s.panel} style={{ marginBottom: 20 }}>
      <p className={s.panelTitle}>Create Emergency Report</p>

      <div className={s.formGrid}>
        <label className={s.fieldLabel}>
          Report type
          <select
            className={s.panelSelect}
            value={form.reportMode}
            onChange={(e) => setForm((p) => ({ ...p, reportMode: e.target.value }))}
          >
            <option value="self">I need help</option>
            <option value="third_party">Reporting someone else</option>
          </select>
        </label>

        {form.reportMode === "third_party" && (
          <label className={s.fieldLabel}>
            Reporting for
            <input
              className={s.panelInput}
              value={form.reportedForName}
              onChange={(e) => setForm((p) => ({ ...p, reportedForName: e.target.value }))}
              placeholder="Rider name or note"
            />
          </label>
        )}

        <label className={s.fieldLabel}>
          Incident type
          <select
            className={s.panelSelect}
            value={form.type}
            onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
          >
            {INCIDENT_TYPES.map((t) => (
              <option key={t} value={t}>{prettify(t)}</option>
            ))}
          </select>
        </label>

        <label className={s.fieldLabel}>
          Severity
          <select
            className={s.panelSelect}
            value={form.severity}
            onChange={(e) => setForm((p) => ({ ...p, severity: e.target.value }))}
          >
            {SEVERITIES.map((lvl) => (
              <option key={lvl} value={lvl}>{prettify(lvl)}</option>
            ))}
          </select>
        </label>

        <label className={s.fieldLabel}>
          Contact phone
          <input
            className={s.panelInput}
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            placeholder="Your number"
          />
        </label>

        <label className={s.fieldWide}>
          Description
          <textarea
            className={s.panelInput}
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            rows={4}
            style={{ resize: "vertical" }}
            placeholder="What happened? Be specific."
          />
        </label>

        <label className={s.checkField}>
          <input
            type="checkbox"
            checked={form.injured}
            onChange={(e) => setForm((p) => ({ ...p, injured: e.target.checked }))}
          />
          Someone is injured
        </label>

        <label className={s.checkField}>
          <input
            type="checkbox"
            checked={form.bikeRideable}
            onChange={(e) => setForm((p) => ({ ...p, bikeRideable: e.target.checked }))}
          />
          Bike is still rideable
        </label>
      </div>

      <div className={s.actionRow}>
        <button className={s.btnEmergency} onClick={onSubmit} disabled={submitLoading}>
          {submitLoading ? "Sending…" : "Send Emergency"}
        </button>
        <button className={s.btnSecondary} onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
