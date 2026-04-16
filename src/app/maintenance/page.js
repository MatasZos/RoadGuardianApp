"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "../components/Navbar";

import { groupByMonth, getPreviewFromForm, buildBikeTaskSummary } from "./utils";
import styles from "./maintenance.module.css";

import BikeSelector from "./BikeSelector";
import StatusBoard from "./StatusBoard";
import MaintenanceForm from "./MaintenanceForm";
import MaintenanceTimeline from "./MaintenanceTimeline";

const EMPTY_FORM = { type: [], date: "", km: "", notes: "", advisories: "" };

export default function MaintenancePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const email = session?.user?.email || null;

  const [records, setRecords] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedBike, setSelectedBike] = useState("");
  const [bikeSearch, setBikeSearch] = useState({ make: "", model: "", year: "" });
  const [bikeResults, setBikeResults] = useState([]);
  const [bikeLoading, setBikeLoading] = useState(false);

  const monthSections = useMemo(() => Object.entries(groupByMonth(records)), [records]);
  const previewList = useMemo(() => getPreviewFromForm(form.type, form.km), [form.type, form.km]);
  const bikeSummaries = useMemo(() => buildBikeTaskSummary(records), [records]);
  const selectedBikeSummary = useMemo(
    () => (selectedBike ? bikeSummaries.find((b) => b.bike === selectedBike) ?? null : null),
    [bikeSummaries, selectedBike]
  );

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    setSelectedBike(localStorage.getItem("userMotorbike") || "");
    setForm((prev) => ({ ...prev, date: prev.date || new Date().toISOString().slice(0, 10) }));
  }, []);

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

  async function handleBikeSearch() {
    setBikeResults([]);
    const { make, model, year } = bikeSearch;
    if (!make.trim() && !model.trim()) {
      alert("Enter a Make or Model to search.");
      return;
    }

    const qs = new URLSearchParams();
    if (make.trim()) qs.set("make", make.trim());
    if (model.trim()) qs.set("model", model.trim());
    if (year.trim()) qs.set("year", year.trim());

    setBikeLoading(true);
    try {
      const res = await fetch(`/api/motorcycles?${qs}`);
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Bike search failed");
        return;
      }
      setBikeResults(Array.isArray(data) ? data : []);
      if (!data?.length) alert("No bikes found.");
    } catch {
      alert("Bike search error.");
    } finally {
      setBikeLoading(false);
    }
  }

  function pickBike(bike) {
    const label = `${bike.make} ${String(bike.model).trim()} (${bike.year})`;
    setSelectedBike(label);
    localStorage.setItem("userMotorbike", label);
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
    if (!email) return;
    if (!selectedBike) {
      alert("Please select a motorbike before adding a record.");
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

    setForm({ ...EMPTY_FORM, date: new Date().toISOString().slice(0, 10) });
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
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <>
      <div className={styles.page}>
  <div className={styles.container}>
    <h1 className={styles.title}>Maintenance Records</h1>

    <StatusBoard summary={selectedBikeSummary} />

    <div className={styles.topGrid}>
      <BikeSelector
        selectedBike={selectedBike}
        bikeSearch={bikeSearch}
        setBikeSearch={setBikeSearch}
        bikeResults={bikeResults}
        bikeLoading={bikeLoading}
        onSearch={handleBikeSearch}
        onPick={pickBike}
      />

      <MaintenanceForm
        form={form}
        setForm={setForm}
        editingId={editingId}
        previewList={previewList}
        onSubmit={handleSubmit}
        onToggleTask={toggleTask}
      />
    </div>

    <div className={styles.timelinePanel}>
      <div className={styles.timelinePanelHeader}>
        <h2 className={styles.timelinePanelTitle}>Service Timeline</h2>
        <p className={styles.timelinePanelSubtitle}>
          Your maintenance history, grouped by month
        </p>
      </div>

      <div className={styles.timelineScroll}>
        <MaintenanceTimeline
          monthSections={monthSections}
          onEdit={startEdit}
          onDelete={deleteRecord}
        />
      </div>
    </div>
  </div>
</div>
    </>
  );
}
