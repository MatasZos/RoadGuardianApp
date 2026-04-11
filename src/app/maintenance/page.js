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
      cache: "no-store",
    });

    const data = await res.json();
    setRecords(Array.isArray(data) ? data : []);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!selectedBike) {
      alert("Please select a motorbike");
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

  function toggleTask(task) {
    setForm((prev) => ({
      ...prev,
      type: prev.type.includes(task)
        ? prev.type.filter((t) => t !== task)
        : [...prev.type, task],
    }));
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
          previewList={previewList}
          editingId={editingId}
        />

        <Timeline
          records={records}
          monthSections={monthSections}
          startEdit={startEdit}
          deleteRecord={deleteRecord}
        />
      </div>
    </>
  );
}