"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";

export default function DocumentsPage() {
  const [docs, setDocs] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    expiryDate: "",
    notes: "",
  });

  const email =
    typeof window !== "undefined"
      ? localStorage.getItem("userEmail")
      : null;
  const documentTypes = [
    { label: "Insurance", expires: true },
    { label: "Motor Tax", expires: true },
    { label: "Warranty", expires: true },
    { label: "Service Receipt", expires: false },
    { label: "Product Purchase", expires: false },
    { label: "Other", expires: false },
  ];

  const selectedType = documentTypes.find((t) => t.label === form.title);

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

    const method = editingId ? "PUT" : "POST";

    await fetch("/api/documents", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userEmail: email,
        _id: editingId,
        ...form,
      }),
    });

    setForm({ title: "", expiryDate: "", notes: "" });
    setEditingId(null);

    const res = await fetch("/api/documents", {
      headers: { "x-user-email": email },
      cache: "no-store",
    });
    setDocs(await res.json());
  }

  function startEdit(doc) {
    setEditingId(doc._id);
    setForm({
      title: doc.title,
      expiryDate: doc.expiryDate || "",
      notes: doc.notes || "",
    });
  }

  async function deleteDoc(id) {
    await fetch("/api/documents", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _id: id }),
    });

    setDocs(docs.filter((d) => d._id !== id));
  }

  return (
    <>
      <Navbar />

      <div style={styles.container}>
        <h1 style={styles.title}>Your Documents</h1>
        <form onSubmit={handleSubmit} style={styles.form}>
          <select
            style={styles.input}
            value={form.title}
            onChange={(e) =>
              setForm({ ...form, title: e.target.value, expiryDate: "" })
            }
            required
          >
            <option value="">Select Document Type</option>
            {documentTypes.map((type, i) => (
              <option key={i} value={type.label}>
                {type.label}
              </option>
            ))}
          </select>

          {selectedType?.expires && (
            <input
              style={styles.input}
              type="date"
              value={form.expiryDate}
              onChange={(e) =>
                setForm({ ...form, expiryDate: e.target.value })
              }
              required
            />
          )}

          <textarea
            style={styles.textarea}
            placeholder={
              form.title === "Other"
                ? "Describe the document type..."
                : "Notes (optional)"
            }
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />

          <button style={styles.button}>
            {editingId ? "Save Changes" : "Add Document"}
          </button>
        </form>
        <div style={styles.list}>
          {docs.length === 0 && (
            <p style={{ color: "#aaa" }}>No documents added yet</p>
          )}

          {docs.map((d) => (
            <div key={d._id} style={styles.card}>
              <h3 style={styles.cardTitle}>{d.title}</h3>

              {d.expiryDate && (
                <p style={styles.cardText}>
                  <strong>Expires:</strong> {d.expiryDate}
                </p>
              )}

              {d.notes && <p style={styles.cardNotes}>{d.notes}</p>}

              <div style={styles.cardActions}>
                <button
                  style={styles.editBtn}
                  onClick={() => startEdit(d)}
                >
                  Edit
                </button>

                <button
                  style={styles.deleteBtn}
                  onClick={() => deleteDoc(d._id)}
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
    background: "#0b0f1a",
    padding: "30px",
    color: "#fff",
  },
  title: {
    color: "#3b82f6",
    marginBottom: "25px",
    fontSize: "2rem",
    fontWeight: "bold",
  },
  form: {
    background: "#0f172a",
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
    border: "1px solid #1e293b",
    background: "#1e293b",
    color: "#fff",
  },
  textarea: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #1e293b",
    background: "#1e293b",
    color: "#fff",
    minHeight: "80px",
  },
  button: {
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    background: "#3b82f6",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  },
  list: {
    display: "grid",
    gap: "15px",
  },
  card: {
    background: "#0f172a",
    padding: "18px",
    borderRadius: "10px",
    borderLeft: "5px solid #3b82f6",
  },
  cardTitle: {
    marginBottom: "6px",
    fontSize: "1.2rem",
  },
  cardText: {
    marginBottom: "4px",
    color: "#cbd5e1",
  },
  cardNotes: {
    color: "#94a3b8",
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