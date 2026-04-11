"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import styles from "./maintenance.module.css";

/* CONSTANTS */

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

const maintenanceTypes = Object.keys(serviceIntervals);

/* HELPERS  */

const safeDate = (value) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatDisplayDate = (value) => {
  const d = safeDate(value);
  if (!d) return String(value || "");
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const monthYearLabel = (value) => {
  const d = safeDate(value);
  if (!d) return "Unknown date";
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
};

const groupByMonth = (recs) => {
  return recs.reduce((acc, r) => {
    const key = monthYearLabel(r.date || r.createdAt);
    acc[key] = acc[key] || [];
    acc[key].push(r);
    return acc;
  }, {});
};

const getTaskStatus = (remainingKm) => {
  if (!Number.isFinite(remainingKm))
    return { label: "Unknown", color: "#94a3b8" };
  if (remainingKm < 0) return { label: "Overdue", color: "#ef4444" };
  if (remainingKm <= 500) return { label: "Urgent", color: "#dc2626" };
  if (remainingKm <= 1500) return { label: "Due soon", color: "#f59e0b" };
  return { label: "Healthy", color: "#22c55e" };
};

const getPreviewFromForm = (types, km) => {
  const numericKm = Number(km);
  if (!types.length || !Number.isFinite(numericKm)) return [];

  return types
    .map((type) => ({
      type,
      intervalKm: serviceIntervals[type],
      nextDueKm: numericKm + serviceIntervals[type],
    }))
    .sort((a, b) => a.nextDueKm - b.nextDueKm);
};

/* MAIN  */

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

  const [selectedBike, setSelectedBike] = useState("");

  const email = session?.user?.email;

  const previewList = useMemo(
    () => getPreviewFromForm(form.type, form.km),
    [form]
  );

  const grouped = groupByMonth(records);

  /* EFFECTS */

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      date: new Date().toISOString().slice(0, 10),
    }));
  }, []);

  useEffect(() => {
    if (!email) return;
    fetchRecords();
  }, [email]);

  /* API */

  async function fetchRecords() {
    const res = await fetch("/api/maintenance", {
      headers: { "x-user-email": email },
    });
    const data = await res.json();
    setRecords(data || []);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    await fetch("/api/maintenance", {
      method: editingId ? "PUT" : "POST",
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
    fetchRecords();
  }

  /*  UI */

  if (status === "loading") {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <>
      <Navbar />

      <div className={styles.container}>
        <h1 className={styles.title}>Maintenance Records</h1>

        {/* FORM */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.checkboxContainer}>
            {maintenanceTypes.map((task) => (
              <label key={task} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={form.type.includes(task)}
                  onChange={() =>
                    setForm((prev) => ({
                      ...prev,
                      type: prev.type.includes(task)
                        ? prev.type.filter((t) => t !== task)
                        : [...prev.type, task],
                    }))
                  }
                />
                {task}
              </label>
            ))}
          </div>

          <input
            className={styles.input}
            type="date"
            value={form.date}
            onChange={(e) =>
              setForm({ ...form, date: e.target.value })
            }
          />

          <input
            className={styles.input}
            type="number"
            placeholder="Kilometers"
            value={form.km}
            onChange={(e) =>
              setForm({ ...form, km: e.target.value })
            }
          />

          <textarea
            className={styles.textarea}
            placeholder="Notes"
            value={form.notes}
            onChange={(e) =>
              setForm({ ...form, notes: e.target.value })
            }
          />

          <button className={styles.button}>
            {editingId ? "Save Changes" : "Add Record"}
          </button>
        </form>

        {/* TIMELINE */}
        <div className={styles.timeline}>
          {Object.entries(grouped).map(([month, items]) => (
            <div key={month}>
              <h2 className={styles.monthTitle}>{month}</h2>

              {items.map((r) => (
                <div key={r._id} className={styles.card}>
                  <h3>{r.type}</h3>
                  <p>{formatDisplayDate(r.date)}</p>
                  <p>{r.km} km</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}