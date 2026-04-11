import styles from "../maintenance.module.css";

export default function MaintenanceForm({
  form,
  setForm,
  toggleTask,
  handleSubmit,
  previewList,
  editingId,
}) {
  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <input
        className={styles.input}
        type="number"
        value={form.km}
        onChange={(e) =>
          setForm({ ...form, km: e.target.value })
        }
      />

      <button className={styles.button}>
        {editingId ? "Save Changes" : "Add Record"}
      </button>
    </form>
  );
}