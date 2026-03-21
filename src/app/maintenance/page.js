"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const serviceIntervals = {
  "Oil Change": 5000,
  "Oil Filter Replacement": 5000,
  "Air Filter Replacement": 12000,
  "Chain Clean & Lube": 800,
  "Chain Adjustment": 1500,
  "Chain & Sprocket Kit Replacement": 20000,
  "Brake Pads Replacement": 15000,
  "Brake Fluid Change": 20000,
  "Tire Replacement": 12000,
  "Tire Pressure Check": 500,
  "Spark Plug Replacement": 12000,
  "Battery Replacement": 30000,
  "Clutch Cable Adjustment": 8000,
  "Throttle Cable Adjustment": 8000,
  "Fuel Filter Replacement": 15000,
  "Suspension Service": 25000,
  "Wheel Bearings Check": 12000,
  "Headlight Bulb Replacement": 20000,
  "Indicator Bulb Replacement": 20000,
  "Brake Disc Replacement": 30000,
};

export default function MaintenancePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [records, setRecords] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    type: [],
    date: "",
    km: "",
    notes: "",
    advisories: "",
  });

  const email = session?.user?.email || null;

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

  function getStatusFromRemaining(remainingKm) {
    if (remainingKm == null) return { label: "Unknown", color: "#94a3b8" };
    if (remainingKm < 0) return { label: "Overdue", color: "#ef4444" };
    if (remainingKm <= 1000) return { label: "Due soon", color: "#f59e0b" };
    return { label: "Healthy", color: "#22c55e" };
  }

  function getNextServicePreview(types, km) {
    const intervals = (Array.isArray(types) ? types : [])
      .map((type) => ({
        type,
        intervalKm: serviceIntervals[type] || null,
      }))
      .filter((item) => typeof item.intervalKm === "number");

    if (!intervals.length || !Number.isFinite(Number(km))) {
      return {
        serviceIntervalKm: null,
        nextDueKm: null,
        nextServiceType: "",
      };
    }

    const soonest = intervals.reduce((lowest, current) =>
      current.intervalKm < lowest.intervalKm ? current : lowest
    );

    return {
      serviceIntervalKm: soonest.intervalKm,
      nextDueKm: Number(km) + soonest.intervalKm,
      nextServiceType: soonest.type,
    };
  }

  const grouped = groupByMonth(records);
  const monthSections = Object.entries(grouped);

  const preview = useMemo(
    () => getNextServicePreview(form.type, form.km),
    [form.type, form.km]
  );

  const latestByType = useMemo(() => {
    const map = {};
    for (const record of records) {
      const types = Array.isArray(record.type) ? record.type : [];
      for (const type of types) {
        if (!map[type]) map[type] = record;
      }
    }
    return map;
  }, [records]);

  const nextServices = useMemo(() => {
    const items = Object.entries(latestByType)
      .map(([type, record]) => {
        const intervalKm = serviceIntervals[type];
        const baseKm = Number(record.km);

        if (!Number.isFinite(intervalKm) || !Number.isFinite(baseKm)) return null;

        const nextDueKm = baseKm + intervalKm;
        const remainingKm = nextDueKm - baseKm;
        return {
          type,
          motorbike: record.motorbike || "",
          lastServiceKm: baseKm,
          nextDueKm,
          remainingFromLastService: remainingKm,
          advisories: record.advisories || "",
          date: record.date,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.nextDueKm - b.nextDueKm);

    return items;
  }, [latestByType]);

  const topNextService = nextServices[0] || null;

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

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

    if (!selectedBike) {
      alert("Please select a motorbike before adding a record.");
      return;
    }

    const method = editingId ? "PUT" : "POST";

    await fetch("/api/maintenance", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userEmail: email,
        motorbike: selectedBike,
        _id: editingId,
        ...form,
      }),
    });

    setForm({
      type: [],
      date: new Date().toISOString().slice(0, 10),
      km: "",
      notes: "",
      advisories: "",
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
    setSelectedBike(record.motorbike || "");
    setForm({
      type: Array.isArray(record.type) ? record.type : [record.type],
      date: record.date || "",
      km: record.km ?? "",
      notes: record.notes || "",
      advisories: record.advisories || "",
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

  if (status === "loading") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0e0e0e",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <>
      <Navbar />

      <div style={styles.container}>
        <h1 style={styles.title}>Maintenance Records</h1>

        <div style={styles.summaryGrid}>
          <div style={styles.summaryCard}>
            <h2 style={styles.summaryTitle}>Next Service Estimate</h2>
            {!topNextService ? (
              <p style={styles.summaryMuted}>No service estimate yet</p>
            ) : (
              <>
                <p style={styles.summaryMain}>
                  <strong>{topNextService.type}</strong>
                </p>
                <p style={styles.summaryText}>
                  <strong>Bike:</strong> {topNextService.motorbike || "Not set"}
                </p>
                <p style={styles.summaryText}>
                  <strong>Next due:</strong> {topNextService.nextDueKm.toLocaleString()} km
                </p>
                <p style={styles.summaryText}>
                  <strong>Last service:</strong> {topNextService.lastServiceKm.toLocaleString()} km
                </p>
                {topNextService.advisories && (
                  <p style={styles.summaryAdvisory}>
                    <strong>Advisories:</strong> {topNextService.advisories}
                  </p>
                )}
              </>
            )}
          </div>

          <div style={styles.summaryCard}>
            <h2 style={styles.summaryTitle}>Current Entry Preview</h2>
            {preview.nextDueKm ? (
              <>
                <p style={styles.summaryMain}>
                  <strong>{preview.nextServiceType}</strong>
                </p>
                <p style={styles.summaryText}>
                  <strong>Interval:</strong> {preview.serviceIntervalKm.toLocaleString()} km
                </p>
                <p style={styles.summaryText}>
                  <strong>Next due:</strong> {preview.nextDueKm.toLocaleString()} km
                </p>
              </>
            ) : (
              <p style={styles.summaryMuted}>
                Select one or more tasks and enter current km to preview the next due service.
              </p>
            )}
          </div>
        </div>

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
            placeholder="General notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />

          <textarea
            style={styles.textarea}
            placeholder="Advisories for next service (e.g. brake pads wearing low, inspect chain soon)"
            value={form.advisories}
            onChange={(e) => setForm({ ...form, advisories: e.target.value })}
          />

          {preview.nextDueKm && (
            <div style={styles.previewBox}>
              <p style={styles.previewText}>
                <strong>Estimated next service:</strong> {preview.nextServiceType}
              </p>
              <p style={styles.previewText}>
                <strong>Estimated next due:</strong> {preview.nextDueKm.toLocaleString()} km
              </p>
              <p style={styles.previewText}>
                <strong>Interval used:</strong> {preview.serviceIntervalKm.toLocaleString()} km
              </p>
            </div>
          )}

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
                {items.map((r, idx) => {
                  const remainingKm =
                    typeof r.nextDueKm === "number" && typeof r.km === "number"
                      ? r.nextDueKm - r.km
                      : null;
                  const statusInfo = getStatusFromRemaining(remainingKm);

                  return (
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
                        <div style={styles.cardTopRow}>
                          <h3 style={styles.cardTitle}>
                            {Array.isArray(r.type) ? r.type.join(", ") : r.type}
                          </h3>

                          <span
                            style={{
                              ...styles.statusPill,
                              background: statusInfo.color,
                            }}
                          >
                            {statusInfo.label}
                          </span>
                        </div>

                        {r.motorbike && (
                          <p style={styles.cardText}>
                            <strong>Bike:</strong> {r.motorbike}
                          </p>
                        )}

                        <p style={styles.cardText}>
                          <strong>Date:</strong> {formatDisplayDate(r.date)}
                        </p>

                        <p style={styles.cardText}>
                          <strong>KM serviced at:</strong> {Number(r.km).toLocaleString()}
                        </p>

                        {r.nextServiceType && (
                          <p style={styles.cardText}>
                            <strong>Next service estimate:</strong> {r.nextServiceType}
                          </p>
                        )}

                        {typeof r.nextDueKm === "number" && (
                          <p style={styles.cardText}>
                            <strong>Next due km:</strong> {r.nextDueKm.toLocaleString()}
                          </p>
                        )}

                        {typeof r.serviceIntervalKm === "number" && (
                          <p style={styles.cardText}>
                            <strong>Estimated interval:</strong> {r.serviceIntervalKm.toLocaleString()} km
                          </p>
                        )}

                        {r.notes && <p style={styles.cardNotes}>{r.notes}</p>}

                        {r.advisories && (
                          <div style={styles.advisoryBox}>
                            <strong>Advisories:</strong> {r.advisories}
                          </div>
                        )}

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
                  );
                })}
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

  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },
  summaryCard: {
    background: "#111",
    padding: "18px",
    borderRadius: "12px",
    borderLeft: "5px solid #ff8c00",
  },
  summaryTitle: {
    margin: "0 0 12px 0",
    fontSize: "1.1rem",
  },
  summaryMain: {
    margin: "0 0 8px 0",
    fontSize: "1rem",
    color: "#fff",
  },
  summaryText: {
    margin: "0 0 6px 0",
    color: "#ccc",
  },
  summaryMuted: {
    margin: 0,
    color: "#94a3b8",
  },
  summaryAdvisory: {
    marginTop: "10px",
    color: "#fcd34d",
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
    maxWidth: "600px",
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
  previewBox: {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: "10px",
    padding: "14px",
  },
  previewText: {
    margin: "0 0 6px 0",
    color: "#ddd",
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
  cardTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "8px",
  },
  cardTitle: {
    marginBottom: "0",
    fontSize: "1.2rem",
  },
  statusPill: {
    padding: "5px 10px",
    borderRadius: "999px",
    color: "#fff",
    fontSize: "0.75rem",
    fontWeight: "bold",
  },
  cardText: {
    marginBottom: "4px",
    color: "#ccc",
  },
  cardNotes: {
    color: "#aaa",
    fontStyle: "italic",
    marginTop: "8px",
  },
  advisoryBox: {
    marginTop: "10px",
    padding: "10px 12px",
    borderRadius: "8px",
    background: "rgba(245, 158, 11, 0.12)",
    border: "1px solid rgba(245, 158, 11, 0.3)",
    color: "#fcd34d",
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