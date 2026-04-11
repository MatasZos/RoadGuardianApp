"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import styles from "./maintenance.module.css";

import BikeSelector from "./components/BikeSelector";
import MaintenanceForm from "./components/MaintenanceForm";
import Timeline from "./components/Timeline";
import StatusBoard from "./components/StatusBoard";

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

function getTaskStatus(remainingKm) {
  if (!Number.isFinite(remainingKm)) {
    return { label: "Unknown", color: "#94a3b8" };
  }
  if (remainingKm < 0) {
    return { label: "Overdue", color: "#ef4444" };
  }
  if (remainingKm <= 1500) {
    return { label: "Due Soon", color: "#f59e0b" };
  }
  return { label: "Healthy", color: "#22c55e" };
}

function buildBikeTaskSummary(records) {
  const bikes = {};

  for (const record of records) {
    const bike = record.motorbike || "Unknown bike";
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

    const tasks = Array.isArray(record.type) ? record.type : [];

    for (const task of tasks) {
      bikes[bike].tasks[task] = {
        type: task,
        lastServiceKm: km,
        intervalKm: serviceIntervals[task],
      };
    }
  }

  return Object.values(bikes).map((bike) => {
    const taskList = Object.values(bike.tasks).map((t) => {
      const nextDueKm = t.lastServiceKm + t.intervalKm;
      const remainingKm = nextDueKm - bike.currentKm;

      return {
        ...t,
        nextDueKm,
        remainingKm,
        status: getTaskStatus(remainingKm),
      };
    });

    return {
      ...bike,
      overdue: taskList.filter((t) => t.remainingKm < 0),
      dueSoon: taskList.filter(
        (t) => t.remainingKm >= 0 && t.remainingKm <= 1500
      ),
      upcoming: taskList.filter((t) => t.remainingKm > 1500),
    };
  });
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

  const bikeSummaries = useMemo(
    () => buildBikeTaskSummary(records),
    [records]
  );

  const selectedBikeSummary = useMemo(() => {
    return bikeSummaries.find((b) => b.bike === selectedBike);
  }, [bikeSummaries, selectedBike]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status]);

  useEffect(() => {
    fetchRecords();
  }, [email]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      date: prev.date || new Date().toISOString().slice(0, 10),
    }));
  }, []);

  async function fetchRecords() {
    if (!email) return;

    const res = await fetch("/api/maintenance", {
      headers: { "x-user-email": email },
    });

    const data = await res.json();
    setRecords(Array.isArray(data) ? data : []);
  }

  async function handleBikeSearch() {
    const qs = new URLSearchParams(bikeSearch);
    const res = await fetch(`/api/motorcycles?${qs.toString()}`);
    const data = await res.json();
    setBikeResults(data || []);
  }

  function pickBike(bike) {
    const label = `${bike.make} ${bike.model} (${bike.year})`;
    setSelectedBike(label);
    localStorage.setItem("userMotorbike", label);
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

  function startEdit(record) {
    setEditingId(record._id);
    setSelectedBike(record.motorbike || "");

    setForm({
      type: Array.isArray(record.type) ? record.type : [record.type],
      date: record.date || "",
      km: record.km || "",
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
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <>
      <Navbar />

      <div className={styles.container}>
        <h1 className={styles.title}>Maintenance</h1>

        <BikeSelector
          selectedBike={selectedBike}
          bikeSearch={bikeSearch}
          setBikeSearch={setBikeSearch}
          bikeResults={bikeResults}
          bikeLoading={bikeLoading}
          handleBikeSearch={handleBikeSearch}
          pickBike={pickBike}
        />

        {selectedBikeSummary && (
          <StatusBoard summary={selectedBikeSummary} />
        )}

        <MaintenanceForm
          form={form}
          setForm={setForm}
          toggleTask={toggleTask}
          handleSubmit={handleSubmit}
          maintenanceTypes={maintenanceTypes}
        />

        <Timeline
          monthSections={monthSections}
          startEdit={startEdit}
          deleteRecord={deleteRecord}
        />
      </div>
    </>
  );
}