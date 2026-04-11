"use client";

import { useState } from "react";
import styles from "../maintenance.module.css";

const tasks = ["Oil Change", "Brake Pads Replacement", "Chain Clean & Lube"];

export default function MaintenanceForm({ selectedBike, fetchRecords }) {
  const [form, setForm] = useState({
    type: "",
    km: "",
  });

  async function handleSubmit(e) {
    e.preventDefault();

    if (!selectedBike) {
      alert("Select a bike first");
      return;
    }

    await fetch("/api/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        motorbike: selectedBike,
        ...form,
      }),
    });

    setForm({ type: "", km: "" });
    fetchRecords();
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <select
        className={styles.input}
        value={form.type}
        onChange={(e) =>
          setForm({ ...form, type: e.target.value })
        }
      >
        <option>Select task</option>
        {tasks.map((t) => (
          <option key={t}>{t}</option>
        ))}
      </select>

      <input
        className={styles.input}
        type="number"
        placeholder="KM"
        value={form.km}
        onChange={(e) =>
          setForm({ ...form, km: e.target.value })
        }
      />

      <button className={styles.button}>Add Record</button>
    </form>
  );
}