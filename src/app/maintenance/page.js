"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import styles from "./maintenance.module.css";

import StatusBoard from "./components/StatusBoard";
import BikeSelector from "./components/BikeSelector";
import MaintenanceForm from "./components/MaintenanceForm";
import Timeline from "./components/Timeline";

/* ================= CONSTANTS ================= */

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

/* ================= HELPERS ================= */

function safeDate(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function monthYearLabel(value) {
  const d = safeDate(value);
  if (!d) return "Unknown date";
  return d.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
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

/* ================= PAGE ================= */

export default function MaintenancePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [records, setRecords] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [selectedBike, setSelectedBike] = useState("");

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

  const email = session?.user?.email || null;

  const grouped = groupByMonth(records);
  const monthSections = Object.entries(grouped);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status]);

  useEffect(() => {
    fetchRecords();
  }, [email]);

  async function fetchRecords() {
    if (!email) return;

    const res = await fetch("/api/maintenance", {
      headers: { "x-user-email": email },
    });

    const data = await res.json();
    setRecords(Array.isArray(data) ? data : []);
  }

  /* ================= FIXED SEARCH ================= */

  async function handleBikeSearch() {
    setBikeResults([]);

    const make = bikeSearch.make.trim();
    const model = bikeSearch.model.trim();
    const year = bikeSearch.year.trim();

    if (!make && !model) {
      alert("Enter a Make or Model");
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
        alert(data.error || "Search failed");
        return;
      }

      setBikeResults(Array.isArray(data) ? data : []);

      if (!data.length) {
        alert("No bikes found");
      }
    } catch (err) {
      console.error(err);
      alert("Search error");
    } finally {
      setBikeLoading(false);
    }
  }

  function pickBike(bike) {
    const label = `${bike.make} ${String(bike.model).trim()} (${bike.year})`;
    setSelectedBike(label);
    setBikeResults([]);
    localStorage.setItem("userMotorbike", label);
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

    if (!selectedBike) {
      alert("Select a bike first");
      return;
    }

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

  if (status === "loading") {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <>
      <Navbar />

      <div className={styles.container}>
        <h1 className={styles.title}>Maintenance</h1>

        <StatusBoard />

        <BikeSelector
          selectedBike={selectedBike}
          bikeSearch={bikeSearch}
          setBikeSearch={setBikeSearch}
          bikeResults={bikeResults}
          bikeLoading={bikeLoading}
          handleBikeSearch={handleBikeSearch}
          pickBike={pickBike}
        />

        <MaintenanceForm
          form={form}
          setForm={setForm}
          toggleTask={toggleTask}
          handleSubmit={handleSubmit}
          maintenanceTypes={maintenanceTypes}
        />

        <Timeline records={records} monthSections={monthSections} />
      </div>
    </>
  );
}