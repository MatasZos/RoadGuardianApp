"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Container, Stack, Spinner, Card, Row, Col } from "react-bootstrap";

import Navbar from "../components/Navbar";
import {
  groupByMonth,
  getPreviewFromForm,
  buildBikeTaskSummary,
} from "@/lib/maintenance";

import BikeSelector from "./BikeSelector";
import StatusBoard from "./StatusBoard";
import MaintenanceForm from "./MaintenanceForm";
import MaintenanceTimeline from "./MaintenanceTimeline";

const EMPTY_FORM = {
  type: [],
  date: "",
  km: "",
  notes: "",
  advisories: "",
};

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

  const monthSections = useMemo(
    () => Object.entries(groupByMonth(records)),
    [records]
  );

  const previewList = useMemo(
    () => getPreviewFromForm(form.type, form.km),
    [form.type, form.km]
  );

  const bikeSummaries = useMemo(() => buildBikeTaskSummary(records), [records]);

  const selectedBikeSummary = useMemo(
    () =>
      selectedBike
        ? bikeSummaries.find((b) => b.bike === selectedBike) ?? null
        : null,
    [bikeSummaries, selectedBike]
  );

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // Restore the last bike the user picked, and pre-fill the date with today.
  useEffect(() => {
    setSelectedBike(localStorage.getItem("userMotorbike") || "");
    setForm((prev) => ({
      ...prev,
      date: new Date().toISOString().slice(0, 10),
    }));
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
    return (
      <div className="rg-maintenance-page d-flex align-items-center justify-content-center min-vh-100">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="rg-maintenance-page min-vh-100">
      <Navbar />

      <Container fluid="xxl" className="py-4">
        <Stack gap={3}>
          <div>
            <h1 className="rg-page-title fw-bold mb-1 text-primary">
              <i className="bi bi-tools me-2"></i>
              Maintenance Records
            </h1>
            <p className="text-body-secondary mb-0">
              Track servicing, manage advisories, and monitor what your bike
              needs next.
            </p>
          </div>

          <Row className="g-3">
            <Col xs={12} lg={4}>
              <StatusBoard
                summary={selectedBikeSummary}
                selectedBike={selectedBike}
              />
            </Col>

            <Col xs={12} lg={8}>
              <Stack gap={3}>
                <Card className="rg-section-card border-0">
                  <Card.Body>
                    <div className="mb-3">
                      <h2 className="h5 fw-bold mb-1">Search Your Bike</h2>
                      <p className="text-body-secondary small mb-0">
                        Select the correct bike before adding or reviewing
                        maintenance records.
                      </p>
                    </div>

                    <BikeSelector
                      selectedBike={selectedBike}
                      bikeSearch={bikeSearch}
                      setBikeSearch={setBikeSearch}
                      bikeResults={bikeResults}
                      bikeLoading={bikeLoading}
                      onSearch={handleBikeSearch}
                      onPick={pickBike}
                    />
                  </Card.Body>
                </Card>

                <Card className="rg-section-card border-0">
                  <Card.Body>
                    <div className="mb-3">
                      <h2 className="h5 fw-bold mb-1">
                        {editingId
                          ? "Edit Maintenance Record"
                          : "Add Maintenance Record"}
                      </h2>
                      <p className="text-body-secondary small mb-0">
                        Save service history, current mileage, notes and
                        advisories for future reminders.
                      </p>
                    </div>

                    <MaintenanceForm
                      form={form}
                      setForm={setForm}
                      editingId={editingId}
                      previewList={previewList}
                      onSubmit={handleSubmit}
                      onToggleTask={toggleTask}
                    />
                  </Card.Body>
                </Card>

                <Card className="rg-section-card border-0">
                  <Card.Body>
                    <div className="mb-3">
                      <h2 className="h5 fw-bold mb-1">Service Timeline</h2>
                      <p className="text-body-secondary small mb-0">
                        Browse your maintenance history grouped by month.
                      </p>
                    </div>

                    <div className="rg-timeline-scroll">
                      <MaintenanceTimeline
                        monthSections={monthSections}
                        onEdit={startEdit}
                        onDelete={deleteRecord}
                      />
                    </div>
                  </Card.Body>
                </Card>
              </Stack>
            </Col>
          </Row>
        </Stack>
      </Container>

      <style>{`
        .rg-maintenance-page {
          background:
            radial-gradient(circle at top left, rgba(var(--bs-primary-rgb), 0.12), transparent 25%),
            radial-gradient(circle at top right, rgba(34, 197, 94, 0.10), transparent 25%),
            linear-gradient(180deg, #111827 0%, #0b0f17 100%);
          color: #fff;
        }
        .rg-page-title {
          font-size: clamp(1.8rem, 3.5vw, 2.4rem);
          letter-spacing: -0.02em;
        }
        .rg-section-card {
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02)),
            rgba(15, 23, 42, 0.92) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
        }
        .rg-timeline-scroll {
          max-height: 640px;
          overflow-y: auto;
          padding-right: 4px;
        }
        .rg-maintenance-page .form-control,
        .rg-maintenance-page .form-select {
          background: rgba(0, 0, 0, 0.3);
          border-color: rgba(255, 255, 255, 0.12);
          color: #fff;
        }
        .rg-maintenance-page .form-control:focus,
        .rg-maintenance-page .form-select:focus {
          background: rgba(0, 0, 0, 0.4);
          border-color: var(--bs-primary);
          box-shadow: 0 0 0 0.2rem rgba(var(--bs-primary-rgb), 0.18);
          color: #fff;
        }
        .rg-maintenance-page .form-control::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }
        .rg-maintenance-page .form-check-input:checked {
          background-color: var(--bs-primary);
          border-color: var(--bs-primary);
        }
        .rg-maintenance-page .form-check-input:focus {
          box-shadow: 0 0 0 0.2rem rgba(var(--bs-primary-rgb), 0.25);
          border-color: var(--bs-primary);
        }
      `}</style>
    </div>
  );
}
