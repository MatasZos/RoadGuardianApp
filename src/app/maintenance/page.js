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

  const [bikeSearch, setBikeSearch] = useState({
    make: "",
    model: "",
    year: "",
  });
  const [bikeResults, setBikeResults] = useState([]);
  const [bikeLoading, setBikeLoading] = useState(false);
  const [selectedBike, setSelectedBike] = useState("");

  function safeDate(value) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function formatDisplayDate(value) {
    const d = safeDate(value);
    if (!d) return String(value || "");
    return d.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function monthYearLabel(value) {
    const d = safeDate(value);
    if (!d) return "Unknown date";
    return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }

  function groupByMonth(recs) {
    const groups = {};
    for (const r of recs) {
      const key = monthYearLabel(r.date || r.createdAt);
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    }
    return groups;
  }

  const grouped = groupByMonth(records);
  const monthSections = Object.entries(grouped);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("userMotorbike") || "";
      setSelectedBike(saved);
    }

    setForm((prev) => ({
      ...prev,
      date: prev.date || new Date().toISOString().slice(0, 10),
    }));
  }, []);

  async function handleBikeSearch() {
    setBikeResults([]);

    const make = bikeSearch.make.trim();
    const model = bikeSearch.model.trim();
    const year = bikeSearch.year.trim();

    if (!make && !model) {
      alert("Enter a Make or Model to search.");
      return;
    }

    const qs = new URLSearchParams();
    if (make) qs.set("make", make);
    if (model) qs.set("model", model);
    if (year) qs.set("year", year);

    setBikeLoading(true);
    try {
      const res = await fetch(`/api/motorcycles?${qs.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Bike search failed");
        return;
      }

      setBikeResults(Array.isArray(data) ? data : []);
      if (!data || data.length === 0) alert("No bikes found.");
    } catch (err) {
      alert("Bike search error.");
    } finally {
      setBikeLoading(false);
    }
  }

  function pickBike(bike) {
    const label = `${bike.make} ${String(bike.model).trim()} (${bike.year})`;
    setSelectedBike(label);
    if (typeof window !== "undefined") {
      localStorage.setItem("userMotorbike", label);
    }
    setBikeResults([]);
  }

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
    "Throttle Cable Adjustment",
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
      setRecords(Array.isArray(data) ? data : []);
    }

    fetchRecords();
  }, [email]);

  function toggleTask(task) {
    setForm((prev) => {
      const exists = prev.type.includes(task);
      return {
        ...prev,
        type: exists
          ? prev.type.filter((t) => t !== task)
          : [...prev.type, task],
      };
    });
  }

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

    setForm({
      type: [],
      date: new Date().toISOString().slice(0, 10),
      km: "",
      notes: "",
    });
    setEditingId(null);

    const res = await fetch("/api/maintenance", {
      headers: { "x-user-email": email },
      cache: "no-store",
    });
    const data = await res.json();
    setRecords(Array.isArray(data) ? data : []);
  }

  function startEdit(record) {
    setEditingId(record._id);
    setForm({
      type: Array.isArray(record.type) ? record.type : [record.type],
      date: record.date || "",
      km: record.km ?? "",
      notes: record.notes || "",
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

        <div style={styles.bikeCard}>
          <h2 style={styles.bikeTitle}>Your Motorbike</h2>

          <p style={styles.bikeSelected}>
            <strong>Selected:</strong>{" "}
            {selectedBike ? selectedBike : "None selected"}
          </p>

          <div style={styles.bikeRow}>
            <input
              style={styles.input}
              placeholder="Make (e.g. Kawasaki)"
              value={bikeSearch.make}
              onChange={(e) =>
                setBikeSearch({ ...bikeSearch, make: e.target.value })
              }
            />
            <input
              style={styles.input}
              placeholder="Model (e.g. Ninja)"
              value={bikeSearch.model}
              onChange={(e) =>
                setBikeSearch({ ...bikeSearch, model: e.target.value })
              }
            />
            <input
              style={styles.input}
              placeholder="Year (optional)"
              value={bikeSearch.year}
              onChange={(e) =>
                setBikeSearch({ ...bikeSearch, year: e.target.value })
              }
            />

            <button
              type="button"
              style={styles.bikeButton}
              onClick={handleBikeSearch}
              disabled={bikeLoading}
            >
              {bikeLoading ? "Searching..." : "Search"}
            </button>
          </div>

          {bikeResults.length > 0 && (
            <div style={styles.bikeResults}>
              {bikeResults.slice(0, 8).map((bike, idx) => (
                <button
                  key={`${bike.make}-${bike.model}-${bike.year}-${idx}`}
                  type="button"
                  style={styles.bikeResultItem}
                  onClick={() => pickBike(bike)}
                >
                  <div>
                    <strong>
                      {bike.make} {String(bike.model).trim()}
                    </strong>{" "}
                    <span style={{ color: "#aaa" }}>({bike.year})</span>
                  </div>
                  <div style={{ color: "#aaa", fontSize: "0.85rem" }}>
                    {bike.type ? `Type: ${bike.type}` : "Tap to select"}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={{ color: "#ccc", fontWeight: "bold" }}>
            Select Tasks Done:
          </label>

          <div style={styles.checkboxContainer}>
            {maintenanceTypes.map((task, i) => (
              <label key={i} style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={form.type.includes(task)}
                  onChange={() => toggleTask(task)}
                />
                {task}
              </label>
            ))}
          </div>

          <textarea
            style={styles.textarea}
            value={form.type.join(", ")}
            readOnly
            placeholder="Chosen services"
          />

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

        <div style={styles.timeline}>
          {records.length === 0 && (
            <p style={{ color: "#aaa" }}>No maintenance records yet</p>
          )}

          {monthSections.map(([month, items]) => (
            <div key={month} style={styles.monthSection}>
              <h2 style={styles.monthTitle}>{month}</h2>

              <div style={styles.timelineList}>
                {items.map((r, idx) => (
                  <div key={r._id} style={styles.timelineItem}>
                    <div style={styles.timelineLeft}>
                      <div style={styles.dot} />
                      {idx !== items.length - 1 ? (
                        <div style={styles.line} />
                      ) : (
                        <div style={styles.lineEnd} />
                      )}
                    </div>

                    <div style={styles.timelineCard}>
                      <h3 style={styles.cardTitle}>
                        {Array.isArray(r.type) ? r.type.join(", ") : r.type}
                      </h3>

                      <p style={styles.cardText}>
                        <strong>Date:</strong> {formatDisplayDate(r.date)}
                      </p>

                      <p style={styles.cardText}>
                        <strong>KM:</strong> {r.km}
                      </p>

                      {r.notes && <p style={styles.cardNotes}>{r.notes}</p>}

                      <div style={styles.cardActions}>
                        <button
                          style={styles.editBtn}
                          onClick={() => startEdit(r)}
                        >
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
                  </div>
                ))}
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

  bikeCard: {
    background: "#111",
    padding: "20px",
    borderRadius: "12px",
    borderLeft: "5px solid #ff8c00",
    marginBottom: "25px",
  },
  bikeTitle: {
    margin: "0 0 10px 0",
    color: "#fff",
  },
  bikeSelected: {
    color: "#ccc",
    margin: "0 0 12px 0",
  },
  bikeRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 120px",
    gap: "10px",
    alignItems: "center",
  },
  bikeButton: {
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    background: "#ff8c00",
    color: "#000",
    fontWeight: "bold",
    cursor: "pointer",
  },
  bikeResults: {
    marginTop: "12px",
    display: "grid",
    gap: "10px",
  },
  bikeResultItem: {
    textAlign: "left",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #222",
    background: "#1a1a1a",
    color: "#fff",
    cursor: "pointer",
  },

  form: {
    background: "#111",
    padding: "20px",
    borderRadius: "12px",
    maxWidth: "500px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "40px",
  },
  checkboxContainer: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    maxHeight: "200px",
    overflowY: "auto",
    padding: "10px",
    background: "#1a1a1a",
    borderRadius: "8px",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "0.9rem",
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
    minHeight: "60px",
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

  timeline: {
    display: "grid",
    gap: "18px",
  },
  monthSection: {
    display: "grid",
    gap: "10px",
  },
  monthTitle: {
    margin: "0",
    color: "#fff",
    fontSize: "1.1rem",
    opacity: 0.9,
  },
  timelineList: {
    display: "grid",
    gap: "14px",
  },
  timelineItem: {
    display: "grid",
    gridTemplateColumns: "26px 1fr",
    gap: "12px",
    alignItems: "stretch",
  },
  timelineLeft: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  dot: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    background: "#ff8c00",
    marginTop: "18px",
  },
  line: {
    width: "2px",
    flex: 1,
    background: "#222",
    marginTop: "6px",
  },
  lineEnd: {
    width: "2px",
    height: "12px",
    background: "transparent",
    marginTop: "6px",
  },
  timelineCard: {
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
