"use client";

import { useEffect, useMemo, useState } from "react";
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

  function parseISODate(value) {
    if (!value) return null;
    const d = new Date(`${value}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function formatDisplayDate(value) {
    const d = parseISODate(value);
    if (!d) return String(value || "");
    return d.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function daysUntil(expiryDateStr) {
    const d = parseISODate(expiryDateStr);
    if (!d) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffMs = d.getTime() - today.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  const categorized = useMemo(() => {
    const expired = [];
    const expiringSoon = [];
    const valid = [];
    const noExpiry = [];

    for (const doc of docs) {
      if (!doc.expiryDate) {
        noExpiry.push(doc);
        continue;
      }

      const dLeft = daysUntil(doc.expiryDate);

      if (dLeft === null) {
        noExpiry.push(doc);
        continue;
      }

      if (dLeft < 0) expired.push(doc);
      else if (dLeft <= 30) expiringSoon.push(doc);
      else valid.push(doc);
    }

    const bySoonest = (a, b) => {
      const da = daysUntil(a.expiryDate) ?? 999999;
      const db = daysUntil(b.expiryDate) ?? 999999;
      return da - db;
    };

    expired.sort(bySoonest);
    expiringSoon.sort(bySoonest);
    valid.sort(bySoonest);

    noExpiry.sort((a, b) => {
      const ca = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const cb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return cb - ca;
    });

    return { expired, expiringSoon, valid, noExpiry };
  }, [docs]);

  useEffect(() => {
    if (!email) return;

    async function fetchDocs() {
      const res = await fetch("/api/documents", {
        headers: { "x-user-email": email },
        cache: "no-store",
      });

      const data = await res.json();
      setDocs(Array.isArray(data) ? data : []);
    }

    fetchDocs();
  }, [email]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;

    if (selectedType?.expires && !form.expiryDate) {
      alert("Please select an expiry date for this document type.");
      return;
    }

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
    const data = await res.json();
    setDocs(Array.isArray(data) ? data : []);
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

    setDocs((prev) => prev.filter((d) => String(d._id) !== String(id)));
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ title: "", expiryDate: "", notes: "" });
  }

  function Section({ title, subtitle, items, accentColor }) {
    return (
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>{title}</h2>
            {subtitle ? <p style={styles.sectionSubtitle}>{subtitle}</p> : null}
          </div>
          <div style={{ ...styles.badge, borderColor: accentColor, color: accentColor }}>
            {items.length}
          </div>
        </div>

        {items.length === 0 ? (
          <p style={{ color: "#94a3b8" }}>None</p>
        ) : (
          <div style={styles.list}>
            {items.map((d) => {
              const dLeft = d.expiryDate ? daysUntil(d.expiryDate) : null;

              return (
                <div key={d._id} style={styles.card}>
                  <h3 style={styles.cardTitle}>{d.title}</h3>

                  {d.expiryDate ? (
                    <p style={styles.cardText}>
                      <strong>Expires:</strong> {formatDisplayDate(d.expiryDate)}
                      {typeof dLeft === "number" && (
                        <span style={styles.daysPill}>
                          {dLeft < 0
                            ? `${Math.abs(dLeft)} day(s) ago`
                            : `${dLeft} day(s) left`}
                        </span>
                      )}
                    </p>
                  ) : (
                    <p style={styles.cardText}>
                      <strong>Expiry:</strong> Not required
                    </p>
                  )}

                  {d.notes && <p style={styles.cardNotes}>{d.notes}</p>}

                  <div style={styles.cardActions}>
                    <button style={styles.editBtn} onClick={() => startEdit(d)}>
                      Edit
                    </button>

                    <button style={styles.deleteBtn} onClick={() => deleteDoc(d._id)}>
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
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

          {editingId && (
            <button
              type="button"
              style={styles.cancelButton}
              onClick={cancelEdit}
            >
              Cancel Edit
            </button>
          )}
        </form>

        <Section
          title="❌ Expired"
          subtitle="These documents are past their expiry date."
          items={categorized.expired}
          accentColor="#ef4444"
        />

        <Section
          title="⚠️ Expiring soon (next 30 days)"
          subtitle="Renew these soon to avoid issues."
          items={categorized.expiringSoon}
          accentColor="#f59e0b"
        />

        <Section
          title="✅ Valid"
          subtitle="Up to date documents."
          items={categorized.valid}
          accentColor="#22c55e"
        />

        <Section
          title="📄 No expiry required"
          subtitle="Receipts and documents that don’t expire."
          items={categorized.noExpiry}
          accentColor="#3b82f6"
        />
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
    marginBottom: "30px",
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
  cancelButton: {
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    background: "#334155",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  },

  section: {
    background: "#0f172a",
    borderRadius: "12px",
    padding: "18px",
    marginBottom: "16px",
    border: "1px solid #1e293b",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "12px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "1.1rem",
  },
  sectionSubtitle: {
    margin: "6px 0 0 0",
    color: "#94a3b8",
    fontSize: "0.9rem",
  },
  badge: {
    border: "1px solid",
    padding: "6px 10px",
    borderRadius: "999px",
    fontWeight: "bold",
    fontSize: "0.9rem",
    minWidth: "34px",
    textAlign: "center",
  },

  list: {
    display: "grid",
    gap: "12px",
  },
  card: {
    background: "#0b1220",
    padding: "16px",
    borderRadius: "10px",
    borderLeft: "5px solid #3b82f6",
  },
  cardTitle: {
    marginBottom: "6px",
    fontSize: "1.1rem",
  },
  cardText: {
    marginBottom: "6px",
    color: "#cbd5e1",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  daysPill: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: "999px",
    background: "#1e293b",
    color: "#e2e8f0",
    fontSize: "0.85rem",
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
