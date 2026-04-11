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

function getTaskStatus(remainingKm) {
  if (!Number.isFinite(remainingKm)) {
    return { label: "Unknown", color: "#94a3b8" };
  }
  if (remainingKm < 0) {
    return { label: "Overdue", color: "#ef4444" };
  }
  if (remainingKm <= 500) {
    return { label: "Urgent", color: "#dc2626" };
  }
  if (remainingKm <= 1500) {
    return { label: "Due soon", color: "#f59e0b" };
  }
  return { label: "Healthy", color: "#22c55e" };
}

function getPreviewFromForm(types, km) {
  const numericKm = Number(km);
  if (!Array.isArray(types) || types.length === 0 || !Number.isFinite(numericKm)) {
    return [];
  }

  return types
    .map((type) => {
      const intervalKm = serviceIntervals[type];
      if (!Number.isFinite(intervalKm)) return null;
      return {
        type,
        intervalKm,
        nextDueKm: numericKm + intervalKm,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.nextDueKm - b.nextDueKm);
}

function buildBikeTaskSummary(records) {
  const bikes = {};

  for (const record of records) {
    const bike = record.motorbike || "Unknown bike";
    const km = Number(record.km);

    if (!bikes[bike]) {
      bikes[bike] = {
        bike,
        currentKm: Number.isFinite(km) ? km : 0,
        tasks: {},
        records: [],
      };
    }

    bikes[bike].records.push(record);

    if (Number.isFinite(km) && km > bikes[bike].currentKm) {
      bikes[bike].currentKm = km;
    }

    const taskList = Array.isArray(record.type) ? record.type : [];
    for (const task of taskList) {
      const existing = bikes[bike].tasks[task];

      const recordDate = safeDate(record.date || record.createdAt);
      const existingDate = existing ? safeDate(existing.date || existing.createdAt) : null;

      const shouldReplace =
        !existing ||
        (Number.isFinite(km) && Number(record.km) > Number(existing.km)) ||
        (recordDate && existingDate && recordDate > existingDate);

      if (shouldReplace) {
        bikes[bike].tasks[task] = {
          type: task,
          motorbike: bike,
          lastServiceKm: km,
          date: record.date,
          notes: record.notes || "",
          advisories: record.advisories || "",
          intervalKm: serviceIntervals[task] || null,
          sourceRecordId: record._id,
          createdAt: record.createdAt,
        };
      }
    }
  }

  return Object.values(bikes).map((bikeData) => {
    const taskItems = Object.values(bikeData.tasks)
      .map((task) => {
        const nextDueKm = Number.isFinite(task.lastServiceKm) && Number.isFinite(task.intervalKm)
          ? task.lastServiceKm + task.intervalKm
          : null;

        const remainingKm =
          Number.isFinite(nextDueKm) && Number.isFinite(bikeData.currentKm)
            ? nextDueKm - bikeData.currentKm
            : null;

        return {
          ...task,
          nextDueKm,
          currentBikeKm: bikeData.currentKm,
          remainingKm,
          status: getTaskStatus(remainingKm),
        };
      })
      .sort((a, b) => {
        const aVal = Number.isFinite(a.nextDueKm) ? a.nextDueKm : Number.MAX_SAFE_INTEGER;
        const bVal = Number.isFinite(b.nextDueKm) ? b.nextDueKm : Number.MAX_SAFE_INTEGER;
        return aVal - bVal;
      });

    return {
      bike: bikeData.bike,
      currentKm: bikeData.currentKm,
      tasks: taskItems,
      overdue: taskItems.filter((t) => Number.isFinite(t.remainingKm) && t.remainingKm < 0),
      dueSoon: taskItems.filter(
        (t) => Number.isFinite(t.remainingKm) && t.remainingKm >= 0 && t.remainingKm <= 1500
      ),
      upcoming: taskItems.filter(
        (t) => Number.isFinite(t.remainingKm) && t.remainingKm > 1500
      ),
    };
  });
}

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

  const grouped = groupByMonth(records);
  const monthSections = Object.entries(grouped);

  const previewList = useMemo(
    () => getPreviewFromForm(form.type, form.km),
    [form.type, form.km]
  );

  const bikeSummaries = useMemo(() => buildBikeTaskSummary(records), [records]);

  const selectedBikeSummary = useMemo(() => {
    if (!selectedBike) return null;
    return bikeSummaries.find((b) => b.bike === selectedBike) || null;
  }, [bikeSummaries, selectedBike]);

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

  async function fetchRecords() {
    if (!email) return;

    const res = await fetch("/api/maintenance", {
      headers: { "x-user-email": email },
      cache: "no-store",
    });

    const data = await res.json();
    setRecords(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    fetchRecords();
  }, [email]);

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

    await fetchRecords();
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

    setRecords((prev) => prev.filter((r) => r._id !== id));
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

        {selectedBikeSummary && (
          <div style={styles.statusBoard}>
            <div style={styles.statusBoardHeader}>
              <div>
                <h2 style={styles.statusBoardTitle}>Bike Service Intelligence</h2>
                <p style={styles.statusBoardSubtitle}>
                  {selectedBikeSummary.bike} · Estimated current km:{" "}
                  <strong>{selectedBikeSummary.currentKm.toLocaleString()}</strong>
                </p>
              </div>
            </div>

            <div style={styles.statusColumns}>
              <div style={styles.statusColumn}>
                <h3 style={{ ...styles.columnTitle, color: "#ef4444" }}>
                  Overdue
                </h3>
                {selectedBikeSummary.overdue.length === 0 ? (
                  <p style={styles.emptyText}>No overdue tasks</p>
                ) : (
                  selectedBikeSummary.overdue.map((task) => (
                    <div key={task.type} style={styles.taskCard}>
                      <div style={styles.taskCardTop}>
                        <strong>{task.type}</strong>
                        <span style={{ ...styles.statusPill, background: task.status.color }}>
                          {task.status.label}
                        </span>
                      </div>
                      <p style={styles.taskCardText}>
                        Last service: {task.lastServiceKm.toLocaleString()} km
                      </p>
                      <p style={styles.taskCardText}>
                        Next due: {task.nextDueKm.toLocaleString()} km
                      </p>
                      <p style={styles.taskCardUrgent}>
                        Get checked immediately.
                      </p>
                      {task.advisories && (
                        <div style={styles.advisoryBox}>
                          <strong>Advisories:</strong> {task.advisories}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div style={styles.statusColumn}>
                <h3 style={{ ...styles.columnTitle, color: "#f59e0b" }}>
                  Due Soon
                </h3>
                {selectedBikeSummary.dueSoon.length === 0 ? (
                  <p style={styles.emptyText}>Nothing due soon</p>
                ) : (
                  selectedBikeSummary.dueSoon.map((task) => (
                    <div key={task.type} style={styles.taskCard}>
                      <div style={styles.taskCardTop}>
                        <strong>{task.type}</strong>
                        <span style={{ ...styles.statusPill, background: task.status.color }}>
                          {task.status.label}
                        </span>
                      </div>
                      <p style={styles.taskCardText}>
                        Last service: {task.lastServiceKm.toLocaleString()} km
                      </p>
                      <p style={styles.taskCardText}>
                        Next due: {task.nextDueKm.toLocaleString()} km
                      </p>
                      <p style={styles.taskCardText}>
                        Remaining: {task.remainingKm.toLocaleString()} km
                      </p>
                      {task.advisories && (
                        <div style={styles.advisoryBox}>
                          <strong>Advisories:</strong> {task.advisories}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div style={styles.statusColumn}>
                <h3 style={{ ...styles.columnTitle, color: "#22c55e" }}>
                  Upcoming
                </h3>
                {selectedBikeSummary.upcoming.length === 0 ? (
                  <p style={styles.emptyText}>No upcoming tasks yet</p>
                ) : (
                  selectedBikeSummary.upcoming.slice(0, 6).map((task) => (
                    <div key={task.type} style={styles.taskCard}>
                      <div style={styles.taskCardTop}>
                        <strong>{task.type}</strong>
                        <span style={{ ...styles.statusPill, background: task.status.color }}>
                          {task.status.label}
                        </span>
                      </div>
                      <p style={styles.taskCardText}>
                        Last service: {task.lastServiceKm.toLocaleString()} km
                      </p>
                      <p style={styles.taskCardText}>
                        Next due: {task.nextDueKm.toLocaleString()} km
                      </p>
                      <p style={styles.taskCardText}>
                        Remaining: {task.remainingKm.toLocaleString()} km
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

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

          {previewList.length > 0 && (
            <div style={styles.previewBox}>
              <h3 style={styles.previewTitle}>Task Due Preview</h3>
              {previewList.map((item) => (
                <p key={item.type} style={styles.previewText}>
                  <strong>{item.type}</strong> → next due at{" "}
                  {item.nextDueKm.toLocaleString()} km ({item.intervalKm.toLocaleString()} km interval)
                </p>
              ))}
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

  statusBoard: {
    background: "#111",
    borderRadius: "14px",
    padding: "20px",
    marginBottom: "24px",
    borderLeft: "5px solid #ff8c00",
  },
  statusBoardHeader: {
    marginBottom: "16px",
  },
  statusBoardTitle: {
    margin: 0,
    fontSize: "1.35rem",
    color: "#fff",
  },
  statusBoardSubtitle: {
    margin: "6px 0 0 0",
    color: "#aaa",
  },
  statusColumns: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "16px",
  },
  statusColumn: {
    background: "#161616",
    borderRadius: "12px",
    padding: "14px",
    border: "1px solid #222",
  },
  columnTitle: {
    margin: "0 0 12px 0",
    fontSize: "1rem",
  },
  emptyText: {
    margin: 0,
    color: "#94a3b8",
  },
  taskCard: {
    background: "#1b1b1b",
    borderRadius: "10px",
    padding: "12px",
    marginBottom: "10px",
    border: "1px solid #252525",
  },
  taskCardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    alignItems: "center",
    marginBottom: "8px",
    flexWrap: "wrap",
  },
  taskCardText: {
    margin: "0 0 5px 0",
    color: "#d1d5db",
    fontSize: "0.9rem",
  },
  taskCardUrgent: {
    margin: "8px 0 0 0",
    color: "#fca5a5",
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
    maxWidth: "650px",
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
  previewTitle: {
    margin: "0 0 10px 0",
    color: "#fff",
    fontSize: "1rem",
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
  statusPill: {
    padding: "5px 10px",
    borderRadius: "999px",
    color: "#fff",
    fontSize: "0.75rem",
    fontWeight: "bold",
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