"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "../components/Navbar";
import styles from "./documents.module.css";

const DOCUMENT_TYPES = [
  { label: "Insurance", expires: true },
  { label: "Motor Tax", expires: true },
  { label: "Warranty", expires: true },
  { label: "Service Receipt", expires: false },
  { label: "Product Purchase", expires: false },
  { label: "Other", expires: false },
];

const EMPTY_FORM = { title: "", expiryDate: "", notes: "" };

const SOON_THRESHOLD_DAYS = 30;

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
  return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// Bucket documents into Expired / Expiring soon / Valid / No expiry, each
// sorted by soonest expiry (or by most recently created for the no-expiry pile).
function categorize(docs) {
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
    if (dLeft === null) noExpiry.push(doc);
    else if (dLeft < 0) expired.push(doc);
    else if (dLeft <= SOON_THRESHOLD_DAYS) expiringSoon.push(doc);
    else valid.push(doc);
  }

  const bySoonest = (a, b) => {
    const da = daysUntil(a.expiryDate) ?? Number.MAX_SAFE_INTEGER;
    const db = daysUntil(b.expiryDate) ?? Number.MAX_SAFE_INTEGER;
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
}

export default function DocumentsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const email = session?.user?.email || null;

  const [docs, setDocs] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const selectedType = DOCUMENT_TYPES.find((t) => t.label === form.title);
  const categorized = useMemo(() => categorize(docs), [docs]);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (!email) return;
    fetchDocs();
  }, [email]);

  async function fetchDocs() {
    const res = await fetch("/api/documents", {
      headers: { "x-user-email": email },
      cache: "no-store",
    });
    const data = await res.json();
    setDocs(Array.isArray(data) ? data : []);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;

    if (selectedType?.expires && !form.expiryDate) {
      alert("Please select an expiry date for this document type.");
      return;
    }

    await fetch("/api/documents", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userEmail: email, _id: editingId, ...form }),
    });

    setForm(EMPTY_FORM);
    setEditingId(null);
    await fetchDocs();
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
    setForm(EMPTY_FORM);
  }

  if (status === "loading") {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <>
      <Navbar />

      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.hero}>
            <h1 className={styles.title}>Your Documents</h1>
            <p className={styles.heroText}>
              Manage insurance, tax, warranties and other motorbike-related
              records in one place.
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
              {DOCUMENT_TYPES.map((type) => (
                <option key={type.label} value={type.label}>
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

          <div className={styles.sectionsGrid}>
            <Section
              title="Expired"
              subtitle="These documents are past their expiry date."
              items={categorized.expired}
              accentClass={styles.expiredText}
              badgeClass={styles.expiredBadge}
              cardClass={styles.expiredCard}
              onEdit={startEdit}
              onDelete={deleteDoc}
            />

            <Section
              title="Expiring Soon"
              subtitle="Renew these within the next 30 days."
              items={categorized.expiringSoon}
              accentClass={styles.warningText}
              badgeClass={styles.warningBadge}
              cardClass={styles.warningCard}
              onEdit={startEdit}
              onDelete={deleteDoc}
            />

            <Section
              title="Valid"
              subtitle="These documents are currently up to date."
              items={categorized.valid}
              accentClass={styles.validText}
              badgeClass={styles.validBadge}
              cardClass={styles.validCard}
              onEdit={startEdit}
              onDelete={deleteDoc}
            />

            <Section
              title="No Expiry Required"
              subtitle="Receipts and records that do not expire."
              items={categorized.noExpiry}
              accentClass={styles.infoText}
              badgeClass={styles.infoBadge}
              cardClass={styles.infoCard}
              onEdit={startEdit}
              onDelete={deleteDoc}
            />
          </div>
        </div>
      </div>
    </>
  );
}

function Section({
  title,
  subtitle,
  items,
  accentClass,
  badgeClass,
  cardClass,
  onEdit,
  onDelete,
}) {
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
          {items.map((d) => (
            <DocumentCard
              key={d._id}
              doc={d}
              cardClass={cardClass}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DocumentCard({ doc, cardClass, onEdit, onDelete }) {
  const dLeft = doc.expiryDate ? daysUntil(doc.expiryDate) : null;

  return (
    <div className={`${styles.card} ${cardClass}`}>
      <h3 className={styles.cardTitle}>{doc.title}</h3>

      {doc.expiryDate ? (
        <p className={styles.cardText}>
          <strong>Expires:</strong> {formatDisplayDate(doc.expiryDate)}
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

      {doc.notes && <p className={styles.cardNotes}>{doc.notes}</p>}

      <div className={styles.cardActions}>
        <button className={styles.editBtn} onClick={() => onEdit(doc)}>
          Edit
        </button>
        <button className={styles.deleteBtn} onClick={() => onDelete(doc._id)}>
          Delete
        </button>
      </div>
    </div>
  );
}
