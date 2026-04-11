import styles from "../maintenance.module.css";

export default function MaintenanceForm({
  form,
  setForm,
  toggleTask,
  handleSubmit,
}) {
  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <input
        className={styles.input}
        type="number"
        placeholder="KM"
        value={form.km}
        onChange={(e) =>
          setForm({ ...form, km: e.target.value })
        }
      />

      <button className={styles.button}>
        Add Record
      </button>
    </form>
  );
}