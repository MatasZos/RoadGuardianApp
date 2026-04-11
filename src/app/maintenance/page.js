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
      };
    }

    if (Number.isFinite(km) && km > bikes[bike].currentKm) {
      bikes[bike].currentKm = km;
    }

    const taskList = Array.isArray(record.type) ? record.type : [];

    for (const task of taskList) {
      const existing = bikes[bike].tasks[task];

      if (!existing || km > existing.lastServiceKm) {
        bikes[bike].tasks[task] = {
          type: task,
          lastServiceKm: km,
          intervalKm: serviceIntervals[task] || null,
        };
      }
    }
  }

  return Object.values(bikes).map((bikeData) => {
    const taskItems = Object.values(bikeData.tasks).map((task) => {
      const nextDueKm = task.lastServiceKm + task.intervalKm;
      const remainingKm = nextDueKm - bikeData.currentKm;

      return {
        ...task,
        nextDueKm,
        remainingKm,
        status: getTaskStatus(remainingKm),
      };
    });

    return {
      bike: bikeData.bike,
      currentKm: bikeData.currentKm,
      tasks: taskItems,
    };
  });
}


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

  const email = session?.user?.email;

  const grouped = groupByMonth(records);
  const monthSections = Object.entries(grouped);

  const previewList = useMemo(
    () => getPreviewFromForm(form.type, form.km),
    [form.type, form.km]
  );

  const bikeSummaries = useMemo(
    () => buildBikeTaskSummary(records),
    [records]
  );

  const selectedBikeSummary = useMemo(() => {
    if (!selectedBike) return null;
    return bikeSummaries.find((b) => b.bike === selectedBike);
  }, [bikeSummaries, selectedBike]);

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
        <h1 className={styles.title}>Maintenance Records</h1>

        <StatusBoard summary={selectedBikeSummary} />

        <BikeSelector
          selectedBike={selectedBike}
          setSelectedBike={setSelectedBike}
        />

        <MaintenanceForm
          form={form}
          setForm={setForm}
          handleSubmit={handleSubmit}
          previewList={previewList}
          editingId={editingId}
        />

        <Timeline
          records={records}
          monthSections={monthSections}
        />
      </div>
    </>
  );
}