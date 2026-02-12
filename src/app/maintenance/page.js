"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";

export default function MaintenancePage() {
  const [records, setRecords] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    type: [],
    date: "",
    km: "",
    notes: "",
  });

  const email =
    typeof window !== "undefined"
      ? localStorage.getItem("userEmail")
      : null;
  const maintenanceTypes = [
    "Oil Change",
    "Oil Filter Replacement",
    "Air Filter Replacement",
    "Chain Clean & Lube",
    "Chain Adjustment",
    "Chain & Sprocket Kit Replacement",
    "Brake Pads Replacement",
    "Brake Fluid Change",
    "Tire Replacement",
    "Tire Pressure Check",
    "Spark Plug Replacement",
    "Battery Replacement",
    "Clutch Cable Adjustment",
    "Valve Clearance Check",
    "Fuel Filter Replacement",
    "Suspension Service",
    "Wheel Bearings Check",
    "Headlight Bulb Replacement",
    "Indicator Bulb Replacement",
    "Brake Disc Replacement",
  ];

  useEffect(() => {
    if (!email) return;

    async function fetchRecords() {
      const res = await fetch("/api/maintenance", {
        headers: { "x-user-email": email },
        cache: "no-store",
      });

      const data = await res.json();
      setRecords(data);
    }

    fetchRecords();
  }, [email]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;

    const method = editingId ? "PUT" : "POST";

    await fetch("/api/maintenance", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userEmail: email,
        _id: editingId,
        ...form,
      }),
    });

    setForm({ type: [], date: "", km: "", notes: "" });
    setEditingId(null);

    const res = await fetch("/api/maintenance", {
      headers: { "x-user-email": email },
      cache: "no-store",
    });
    setRecords(await res.json());
  }

  function startEdit(record) {
    setEditingId(record._id);
    setForm({
      type: record.type,
      date: record.date,
      km: record.km,
      notes: record.notes,
    });
  }

  async function deleteRecord(id) {
    await fetch("/api/maintenance", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _id: id }),
    });

    setRecords(records.filter((r) => r._id !== id));
  }

  return (
    <>
      <Navbar />

      <div style={styles.container}>
        <h1 style={styles.title}>Maintenance Records</h1>
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={{ color: "#ccc" }}>Tasks Done:</label>
          <select
            multiple
            style={styles.input}
            value={form.type}
            onChange={(e) =>
              setForm({
                ...form,
                type: Array.from(e.target.selectedOptions, (opt) => opt.value),
              })
            }
            required
          >
            {maintenanceTypes.map((t, i) => (
              <option key={i} value={t}>
                {t}
              </option>
            ))}
          </select>

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
            placeholder="Notes / advisories for next service"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />

          <button style={styles.button}>
            {editingId ? "Save Changes" : "Add Record"}
          </button>
        </form>
        <div style={styles.list}>
          {records.length === 0 && (
            <p style={{ color: "#aaa" }}>No maintenance records yet</p>
          )}

          {records.map((r) => (
            <div key={r._id} style={styles.card}>
              <h3 style={styles.cardTitle}>{r.type.join(", ")}</h3>

              <p style={styles.cardText}>
                <strong>Date:</strong> {r.date}
              </p>

              <p style={styles.cardText}>
                <strong>KM:</strong> {r.km}
              </p>

              {r.notes && <p style={styles.cardNotes}>{r.notes}</p>}

              <div style={styles.cardActions}>
                <button style={styles.editBtn} onClick={() => startEdit(r)}>
                  Edit
                </button>

                <button
                  style={styles.deleteBtn}
                  onClick={() => deleteRecord(r._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#0e0e0e",
    padding: "30px",
    color: "#fff",
  },
  title: {
    color: "#ff8c00",
    marginBottom: "20px",
    fontSize: "2rem",
    fontWeight: "bold",
  },
  form: {
    background: "#111",
    padding: "20px",
    borderRadius: "12px",
    maxWidth: "450px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "40px",
  },
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #222",
    background: "#1a1a1a",
    color: "#fff",
  },
  textarea: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #222",
    background: "#1a1a1a",
    color: "#fff",
    minHeight: "80px",
  },
  button: {
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    background: "#ff8c00",
    color: "#000",
    fontWeight: "bold",
    cursor: "pointer",
  },
  list: {
    display: "grid",
    gap: "15px",
  },
  card: {
    background: "#111",
    padding: "18px",
    borderRadius: "10px",
    borderLeft: "5px solid #ff8c00",
  },
  cardTitle: {
    marginBottom: "6px",
    fontSize: "1.2rem",
  },
  cardText: {
    marginBottom: "4px",
    color: "#ccc",
  },
  cardNotes: {
    color: "#aaa",
    fontStyle: "italic",
  },
  cardActions: {
    marginTop: "10px",
    display: "flex",
    gap: "10px",
  },
  editBtn: {
    padding: "6px 12px",
    background: "#2563eb",
    border: "none",
    borderRadius: "6px",
    color: "#fff",
    cursor: "pointer",
  },
  deleteBtn: {
    padding: "6px 12px",
    background: "#dc2626",
    border: "none",
    borderRadius: "6px",
    color: "#fff",
    cursor: "pointer",
  },
};