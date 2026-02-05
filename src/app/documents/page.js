"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";

export default function DocumentsPage() {
  const [docs, setDocs] = useState([]);
  const [form, setForm] = useState({
    title: "",
    expiryDate: "",
    notes: "",
  });

  const email =
    typeof window !== "undefined"
      ? localStorage.getItem("userEmail")
      : null;

  // Fetch documents
  useEffect(() => {
    if (!email) return;

    async function fetchDocs() {
      const res = await fetch("/api/documents", {
        headers: { "x-user-email": email },
        cache: "no-store",
      });

      const data = await res.json();
      setDocs(data);
    }

    fetchDocs();
  }, [email]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;

    await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userEmail: email,
        ...form,
      }),
    });

    setForm({ title: "", expiryDate: "", notes: "" });

    const res = await fetch("/api/documents", {
      headers: { "x-user-email": email },
      cache: "no-store",
    });
    setDocs(await res.json());
  }

  return (
    <>
      <Navbar />

      <div style={styles.container}>
        <h1 style={styles.title}>Documents</h1>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            placeholder="Document Title (Insurance, Tax, etc.)"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />

          <input
            type="date"
            value={form.expiryDate}
            onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
            required
          />

          <textarea
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />

          <button>Add Document</button>
        </form>

        <div style={styles.list}>
          {docs.length === 0 && (
            <p style={{ color: "#aaa" }}>No documents added yet</p>
          )}

          {docs.map((d, i) => (
            <div key={i} style={styles.card}>
              <h3>{d.title}</h3>
              <p>
                <strong>Expires:</strong> {d.expiryDate}
              </p>
              <p>{d.notes}</p>
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
    background: "#0b0f1a",
    padding: "30px",
    color: "#fff",
  },
  title: {
    color: "#3b82f6",
    marginBottom: "20px",
  },
  form: {
    background: "#0f172a",
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
    background: "#0f172a",
    padding: "15px",
    borderRadius: "10px",
    borderLeft: "5px solid #3b82f6",
  },
};
