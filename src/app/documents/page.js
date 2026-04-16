"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "../components/Navbar";
import styles from "./documents.module.css";

export default function DocumentsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [docs, setDocs] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    expiryDate: "",
    notes: "",
  });

  const email = session?.user?.email || null;

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
    if (status === "loading") return;
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

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

  if (status === "loading") {
    return <div className={styles.loading}>Loading...</div>;
  }

  function Section({ title, subtitle, items, accentClass, badgeClass, cardClass }) {
    return (
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={`${styles.sectionTitle} ${accentClass}`}>{title}</h2>
            {subtitle && <p className={styles.sectionSubtitle}>{subtitle}</p>}
          </div>

          <div className={`${styles.badge} ${badgeClass}`}>{items.length}</div>
        </div>

        {items.length === 0 ? (
          <p className={styles.emptyText}>None</p>
        ) : (
          <div className={styles.list}>
            {items.map((d) => {
              const dLeft = d.expiryDate ? daysUntil(d.expiryDate) : null;

              return (
                <div key={d._id} className={`${styles.card} ${cardClass}`}>
                  <h3 className={styles.cardTitle}>{d.title}</h3>

                  {d.expiryDate ? (
                    <p className={styles.cardText}>
                      <strong>Expires:</strong> {formatDisplayDate(d.expiryDate)}
                      {typeof dLeft === "number" && (
                        <span className={styles.daysPill}>
                          {dLeft < 0
                            ? `${Math.abs(dLeft)} day(s) ago`
                            : `${dLeft} day(s) left`}
                        </span>
                      )}
                    </p>
                  ) : (
                    <p className={styles.cardText}>
                      <strong>Expiry:</strong> Not required
                    </p>
                  )}

                  {d.notes && <p className={styles.cardNotes}>{d.notes}</p>}

                  <div className={styles.cardActions}>
                    <button
                      className={styles.editBtn}
                      onClick={() => startEdit(d)}
                    >
                      Edit
                    </button>

                    <button
                      className={styles.deleteBtn}
                      onClick={() => deleteDoc(d._id)}
                    >
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

      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.hero}>
            <h1 className={styles.title}>Your Documents</h1>
            <p className={styles.heroText}>
              Manage insurance, tax, warranties and other motorbike-related records in one place.
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>
                {editingId ? "Edit Document" : "Add Document"}
              </h2>
              <p className={styles.formSubtitle}>
                Keep your important records organised and up to date.
              </p>
            </div>

            <select
              className={styles.input}
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
                className={styles.input}
                type="date"
                value={form.expiryDate}
                onChange={(e) =>
                  setForm({ ...form, expiryDate: e.target.value })
                }
                required
              />
            )}

            <textarea
              className={styles.textarea}
              placeholder={
                form.title === "Other"
                  ? "Describe the document type..."
                  : "Notes (optional)"
              }
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />

            <div className={styles.formActions}>
              <button className={styles.button}>
                {editingId ? "Save Changes" : "Add Document"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={cancelEdit}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>

          <Section
            title="Expired"
            subtitle="These documents are past their expiry date."
            items={categorized.expired}
            accentClass={styles.expiredText}
            badgeClass={styles.expiredBadge}
            cardClass={styles.expiredCard}
          />

          <Section
            title="Expiring Soon"
            subtitle="Renew these within the next 30 days."
            items={categorized.expiringSoon}
            accentClass={styles.warningText}
            badgeClass={styles.warningBadge}
            cardClass={styles.warningCard}
          />

          <Section
            title="Valid"
            subtitle="These documents are currently up to date."
            items={categorized.valid}
            accentClass={styles.validText}
            badgeClass={styles.validBadge}
            cardClass={styles.validCard}
          />

          <Section
            title="No Expiry Required"
            subtitle="Receipts and records that do not expire."
            items={categorized.noExpiry}
            accentClass={styles.infoText}
            badgeClass={styles.infoBadge}
            cardClass={styles.infoCard}
          />
        </div>
      </div>
    </>
  );
}
