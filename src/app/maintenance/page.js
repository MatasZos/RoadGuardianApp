"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";

export default function MaintenancePage() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({
    type: "",
    date: "",
    km: "",
    notes: "",
  });

  const email =
    typeof window !== "undefined"
      ? localStorage.getItem("userEmail")
      : null;

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

    await fetch("/api/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userEmail: email,
        ...form,
      }),
    });

    setForm({ type: "", date: "", km: "", notes: "" });

    const res = await fetch("/api/maintenance", {
      headers: { "x-user-email": email },
      cache: "no-store",
    });
    setRecords(await res.json());
  }

  return (
    <>
      <Navbar />

      <div style={styles.container}>
        <h1 style={styles.title}>Maintenance Records</h1>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            placeholder="Maintenance Type (e.g. Oil Change)"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            required
          />
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
          <input
            type="number"
            placeholder="Kilometers"
            value={form.km}
            onChange={(e) => setForm({ ...form, km: e.target.value })}
            required
          />
          <textarea
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />

          <button>Add Record</button>
        </form>

        {/* Records List */}
        <div style={styles.list}>
          {records.length === 0 && (
            <p style={{ color: "#aaa" }}>No maintenance records yet</p>
          )}

          {records.map((r, i) => (
            <div key={i} style={styles.card}>
              <h3>{r.type}</h3>
              <p><strong>Date:</strong> {r.date}</p>
              <p><strong>KM:</strong> {r.km}</p>
              <p>{r.notes}</p>
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
  },
  form: {
    background: "#111",
    padding: "20px",
    borderRadius: "12px",
    maxWidth: "400px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "30px",
  },
  list: {
    display: "grid",
    gap: "15px",
  },
  card: {
    background: "#111",
    padding: "15px",
    borderRadius: "10px",
    borderLeft: "5px solid #ff8c00",
  },
};
