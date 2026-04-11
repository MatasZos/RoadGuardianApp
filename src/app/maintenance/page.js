"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "../components/Navbar";
import styles from "./maintenance.module.css";

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

function groupByMonth(records) {
  const groups = {};
  records.forEach((r) => {
    const date = new Date(r.date || r.createdAt);
    const key = date.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  });
  return groups;
}

function buildBikeTaskSummary(records) {
  const bikes = {};

  for (const record of records) {
    const bike = record.motorbike || "Unknown";
    const km = Number(record.km);

    if (!bikes[bike]) {
      bikes[bike] = {
        bike,
        currentKm: km || 0,
        tasks: {},
      };
    }

    if (km > bikes[bike].currentKm) {
      bikes[bike].currentKm = km;
    }

    const taskList = Array.isArray(record.type)
      ? record.type
      : [record.type];

    for (const task of taskList) {
      const existing = bikes[bike].tasks[task];

      const shouldReplace =
        !existing ||
        (Number.isFinite(km) &&
          Number.isFinite(existing?.lastServiceKm) &&
          km > existing.lastServiceKm);

      if (shouldReplace) {
        bikes[bike].tasks[task] = {
          type: task,
          lastServiceKm: km,
          intervalKm: serviceIntervals[task],
        };
      }
    }
  }

  return Object.values(bikes).map((bike) => {
    const tasks = Object.values(bike.tasks).map((t) => {
      const next = t.lastServiceKm + t.intervalKm;
      const remaining = next - bike.currentKm;

      return {
        ...t,
        remaining,
      };
    });

    return {
      bike: bike.bike,
      currentKm: bike.currentKm,
      overdue: tasks.filter((t) => t.remaining < 0),
      dueSoon: tasks.filter((t) => t.remaining >= 0 && t.remaining <= 1500),
      upcoming: tasks.filter((t) => t.remaining > 1500),
    };
  });
}

export default function MaintenancePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({
    type: [],
    km: "",
    date: new Date().toISOString().slice(0, 10),
  });

  const email = session?.user?.email;

  const grouped = groupByMonth(records);
  const bikeSummary = useMemo(
    () => buildBikeTaskSummary(records)[0],
    [records]
  );

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status]);

  useEffect(() => {
    if (!email) return;

    fetch("/api/maintenance", {
      headers: { "x-user-email": email },
    })
      .then((res) => res.json())
      .then(setRecords);
  }, [email]);

  async function handleSubmit(e) {
    e.preventDefault();

    await fetch("/api/maintenance", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        userEmail: email,
      }),
    });

    setForm({ type: [], km: "", date: form.date });

    location.reload();
  }

  return (
    <div className={styles.wrapper}>
      <Navbar />

      <div className={styles.dashboard}>
        {/* MAIN */}
        <div className={styles.main}>
          <h1 className={styles.title}>Maintenance</h1>

          {/* STATUS */}
          {bikeSummary && (
            <div className={styles.card}>
              <div className={styles.statusHeader}>
                Bike Service · {bikeSummary.currentKm} km
              </div>

              <div className={styles.statusGrid}>
                <Status title="Overdue" items={bikeSummary.overdue} />
                <Status title="Due Soon" items={bikeSummary.dueSoon} />
                <Status title="Upcoming" items={bikeSummary.upcoming} />
              </div>
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit} className={styles.card}>
            <div className={styles.form}>
              <input
                className={styles.input}
                placeholder="KM"
                value={form.km}
                onChange={(e) =>
                  setForm({ ...form, km: e.target.value })
                }
              />

              <button className={styles.button}>Add Record</button>
            </div>
          </form>

          {/* TIMELINE */}
          <div className={styles.timeline}>
            {Object.entries(grouped).map(([month, items]) => (
              <div key={month}>
                <h3>{month}</h3>

                {items.map((r) => (
                  <div key={r._id} className={styles.timelineCard}>
                    <div className={styles.cardTitle}>
                      {Array.isArray(r.type)
                        ? r.type.join(", ")
                        : r.type}
                    </div>

                    <div className={styles.cardText}>
                      KM: {r.km}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* SIDEBAR */}
        <div className={styles.sidebar}>
          <div className={styles.bikeCard}>
            <h3>Your Bike</h3>
            <p>{records[0]?.motorbike || "None"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Status({ title, items }) {
  return (
    <div className={styles.statusCard}>
      <div className={styles.statusLabel}>{title}</div>

      {items.length === 0 ? (
        <div className={styles.statusValue}>None</div>
      ) : (
        items.slice(0, 2).map((i) => (
          <div key={i.type} className={styles.statusValue}>
            {i.type} ({i.remaining} km)
          </div>
        ))
      )}
    </div>
  );
}