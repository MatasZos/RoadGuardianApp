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
  "Brake Pads Replacement": 15000,
  "Chain Clean & Lube": 800,
};

/* ================= HELPERS ================= */

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

  records.forEach((r) => {
    const bike = r.motorbike || "Unknown";
    const km = Number(r.km);

    if (!bikes[bike]) {
      bikes[bike] = { bike, currentKm: km, tasks: {} };
    }

    if (km > bikes[bike].currentKm) {
      bikes[bike].currentKm = km;
    }

    const tasks = Array.isArray(r.type) ? r.type : [r.type];

    tasks.forEach((task) => {
      bikes[bike].tasks[task] = {
        lastServiceKm: km,
        interval: serviceIntervals[task] || 5000,
      };
    });
  });

  return Object.values(bikes);
}

/* ================= PAGE ================= */

export default function MaintenancePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [records, setRecords] = useState([]);
  const [selectedBike, setSelectedBike] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    type: [],
    km: "",
    date: "",
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

  const email = session?.user?.email;

  const grouped = groupByMonth(records);
  const monthSections = Object.entries(grouped);

  const bikeSummaries = useMemo(
    () => buildBikeTaskSummary(records),
    [records]
  );

  const selectedBikeSummary = bikeSummaries.find(
    (b) => b.bike === selectedBike
  );

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
    setRecords(data || []);
  }

  async function handleBikeSearch() {
    setBikeLoading(true);

    const res = await fetch("/api/motorcycles");
    const data = await res.json();

    setBikeResults(data || []);
    setBikeLoading(false);
  }

  function pickBike(bike) {
    setSelectedBike(`${bike.make} ${bike.model}`);
    setBikeResults([]);
  }

  function toggleTask(task) {
    setForm((prev) => ({
      ...prev,
      type: prev.type.includes(task)
        ? prev.type.filter((t) => t !== task)
        : [...prev.type, task],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    await fetch("/api/maintenance", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userEmail: email,
        motorbike: selectedBike,
        ...form,
      }),
    });

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

        <StatusBoard summary={selectedBikeSummary} />

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
        />

        <Timeline
          monthSections={monthSections}
          records={records}
        />
      </div>
    </>
  );
}