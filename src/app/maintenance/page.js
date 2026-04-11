"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "../components/Navbar";
import styles from "./maintenance.module.css";


const serviceIntervals = {
  "Oil Change": 5000,
  "Air Filter Replacement": 12000,
  "Chain Adjustment": 1500,
};

function safeDate(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function monthYearLabel(value) {
  const d = safeDate(value);
  if (!d) return "Unknown";
  return d.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function groupByMonth(records) {
  const groups = {};
  for (const r of records) {
    const key = monthYearLabel(r.date);
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  }
  return groups;
}


export default function MaintenancePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [records, setRecords] = useState([]);

  const [form, setForm] = useState({
    type: [],
    date: "",
    km: "",
    notes: "",
    advisories: "",
  });

  const [bikeSearch, setBikeSearch] = useState({
    make: "",
    model: "",
    year: "",
  });

  const [bikeResults, setBikeResults] = useState([]);
  const [bikeLoading, setBikeLoading] = useState(false);
  const [selectedBike, setSelectedBike] = useState("");


  useEffect(() => {
    const saved = localStorage.getItem("userMotorbike") || "";
    setSelectedBike(saved);
  }, []);


  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status]);


  async function fetchRecords() {
    if (!session?.user?.email) return;

    const res = await fetch("/api/maintenance", {
      headers: { "x-user-email": session.user.email },
    });

    const data = await res.json();
    setRecords(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    fetchRecords();
  }, [session]);


  async function handleBikeSearch() {
    const { make, model, year } = bikeSearch;

    if (!make && !model) {
      alert("Enter make or model");
      return;
    }

    const qs = new URLSearchParams();
    if (make) qs.set("make", make);
    if (model) qs.set("model", model);
    if (year) qs.set("year", year);

    setBikeLoading(true);

    try {
      const res = await fetch(`/api/motorcycles?${qs}`);
      const data = await res.json();
      setBikeResults(Array.isArray(data) ? data : []);
    } catch {
      alert("Search failed");
    } finally {
      setBikeLoading(false);
    }
  }

  function pickBike(bike) {
    const label = `${bike.make} ${bike.model} (${bike.year})`;
    setSelectedBike(label);
    localStorage.setItem("userMotorbike", label);
    setBikeResults([]);
  }


  async function handleSubmit(e) {
    e.preventDefault();

    if (!selectedBike) {
      alert("Select a bike first");
      return;
    }

    await fetch("/api/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        motorbike: selectedBike,
        userEmail: session.user.email,
      }),
    });

    setForm({
      type: [],
      date: "",
      km: "",
      notes: "",
      advisories: "",
    });

    fetchRecords();
  }


  const bikeSummary = useMemo(() => {
    if (!selectedBike) return null;

    const bikeRecords = records.filter(
      (r) => r.motorbike === selectedBike
    );

    if (bikeRecords.length === 0) return null;

    const latestKm = Math.max(...bikeRecords.map((r) => Number(r.km)));

    const latestTasks = {};

    for (const r of bikeRecords) {
      const km = Number(r.km);
      for (const t of r.type || []) {
        if (!latestTasks[t] || km > latestTasks[t]) {
          latestTasks[t] = km;
        }
      }
    }

    const tasks = Object.entries(latestTasks).map(([type, lastKm]) => {
      const interval = serviceIntervals[type];
      const nextDue = lastKm + interval;
      const remaining = nextDue - latestKm;

      return { type, remaining };
    });

    return {
      overdue: tasks.filter((t) => t.remaining < 0),
      dueSoon: tasks.filter((t) => t.remaining <= 1500 && t.remaining >= 0),
      upcoming: tasks.filter((t) => t.remaining > 1500),
      currentKm: latestKm,
    };
  }, [records, selectedBike]);


  const grouped = groupByMonth(records);


  if (status === "loading") {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <>
      <Navbar />

      <div className={styles.container}>
        <h1 className={styles.title}>Maintenance</h1>

        {/* BIKE CARD */}
        <div className={styles.bikeCard}>
          <h3>Your Bike</h3>

          <p className={styles.selectedBike}>
            {selectedBike || "None selected"}
          </p>

          <div className={styles.bikeSearch}>
            <input
              className={styles.input}
              placeholder="Make"
              value={bikeSearch.make}
              onChange={(e) =>
                setBikeSearch({ ...bikeSearch, make: e.target.value })
              }
            />
            <input
              className={styles.input}
              placeholder="Model"
              value={bikeSearch.model}
              onChange={(e) =>
                setBikeSearch({ ...bikeSearch, model: e.target.value })
              }
            />
            <input
              className={styles.input}
              placeholder="Year"
              value={bikeSearch.year}
              onChange={(e) =>
                setBikeSearch({ ...bikeSearch, year: e.target.value })
              }
            />

            <button
              className={styles.button}
              onClick={handleBikeSearch}
            >
              {bikeLoading ? "..." : "Search"}
            </button>
          </div>

          {bikeResults.length > 0 && (
            <div className={styles.bikeResults}>
              {bikeResults.slice(0, 6).map((bike, i) => (
                <div
                  key={i}
                  className={styles.bikeResultItem}
                  onClick={() => pickBike(bike)}
                >
                  {bike.make} {bike.model} ({bike.year})
                </div>
              ))}
            </div>
          )}
        </div>

        {/* STATUS */}
        {bikeSummary && (
          <div className={styles.statusBoard}>
            <h3>Bike Service · {bikeSummary.currentKm.toLocaleString()} km</h3>

            <div className={styles.statusGrid}>
              <div className={styles.statusCard}>
                <strong>Overdue</strong>
                {bikeSummary.overdue.length === 0
                  ? "None"
                  : bikeSummary.overdue.map((t) => (
                      <p key={t.type}>{t.type}</p>
                    ))}
              </div>

              <div className={styles.statusCard}>
                <strong>Due Soon</strong>
                {bikeSummary.dueSoon.length === 0
                  ? "None"
                  : bikeSummary.dueSoon.map((t) => (
                      <p key={t.type}>{t.type}</p>
                    ))}
              </div>

              <div className={styles.statusCard}>
                <strong>Upcoming</strong>
                {bikeSummary.upcoming.map((t) => (
                  <p key={t.type}>{t.type}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            className={styles.input}
            placeholder="KM"
            value={form.km}
            onChange={(e) =>
              setForm({ ...form, km: e.target.value })
            }
          />

          <button className={styles.button}>
            Add Record
          </button>
        </form>

        {/* TIMELINE */}
        <div className={styles.timeline}>
          {Object.entries(grouped).map(([month, items]) => (
            <div key={month}>
              <h3>{month}</h3>

              {items.map((r) => (
                <div key={r._id} className={styles.card}>
                  <strong>
                    {Array.isArray(r.type)
                      ? r.type.join(", ")
                      : r.type}
                  </strong>
                  <p>KM: {r.km}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}