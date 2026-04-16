"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./mybike.module.css";

export default function MyBikePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [loadingBike, setLoadingBike] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    motorbike: "",
    bikeYear: "",
    bikeMileage: "",
    bikeNotes: "",
  });

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      setLoadingBike(false);
      return;
    }

    const fetchBike = async () => {
      setLoadingBike(true);
      try {
        const res = await fetch("/api/mybike", { method: "GET" });
        const data = await res.json();

        if (res.ok) {
          setForm({
            motorbike: data?.bike?.motorbike || "",
            bikeYear: data?.bike?.bikeYear || "",
            bikeMileage: data?.bike?.bikeMileage || "",
            bikeNotes: data?.bike?.bikeNotes || "",
          });
        } else {
          console.error(data?.error || "Failed to load bike info");
        }
      } catch (err) {
        console.error("Fetch bike error:", err);
      } finally {
        setLoadingBike(false);
      }
    };

    fetchBike();
  }, [status]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/mybike", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data?.error || "Failed to save");
        alert(data?.error || "Failed to save bike details");
        return;
      }

      alert("Bike details saved!");
    } catch (err) {
      console.error("Save bike error:", err);
      alert("Server error while saving bike details");
    } finally {
      setSaving(false);
    }
  };

  const unauthenticated = status === "unauthenticated";

  return (
    <>
      <Navbar />

      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>My Bike</h1>
              <p className={styles.subtitle}>
                Update your bike details to keep maintenance and reminders accurate.
              </p>
            </div>

            <div className={styles.accountPill}>
              <span className={styles.dot} />
              <span className={styles.accountText}>
                {unauthenticated
                  ? "Signed out"
                  : `Signed in as: ${session?.user?.email || ""}`}
              </span>
            </div>
          </div>

          <div className={styles.card}>
            {status === "loading" || loadingBike ? (
              <div className={styles.loading}>
                <div className={styles.skeletonTitle} />
                <div className={styles.skeletonLine} />
                <div className={styles.skeletonLine} />
                <div className={`${styles.skeletonLine} ${styles.shortLine}`} />
              </div>
            ) : unauthenticated ? (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>!</div>
                <div>
                  <div className={styles.emptyTitle}>You’re not signed in</div>
                  <div className={styles.emptyText}>
                    Please log in to view and update your bike details.
                  </div>
                  <button
                    className={styles.primaryBtn}
                    onClick={() => router.push("/login")}
                  >
                    Go to Login
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.cardHeader}>
                  <div>
                    <h2 className={styles.cardTitle}>Bike Details</h2>
                    <p className={styles.cardHint}>
                      This information can be used across RoadGuardian
                      (maintenance, reminders, etc.).
                    </p>
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`${styles.saveBtn} ${
                      saving ? styles.saveBtnDisabled : ""
                    }`}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>

                <div className={styles.grid}>
                  <div className={styles.fullWidth}>
                    <label className={styles.label}>Bike (Make + Model)</label>
                    <input
                      name="motorbike"
                      value={form.motorbike}
                      onChange={handleChange}
                      placeholder="e.g. Kawasaki Ninja 1000SX"
                      className={styles.input}
                    />
                  </div>

                  <div>
                    <label className={styles.label}>Year</label>
                    <input
                      name="bikeYear"
                      value={form.bikeYear}
                      onChange={handleChange}
                      placeholder="e.g. 2022"
                      className={styles.input}
                    />
                  </div>

                  <div>
                    <label className={styles.label}>Current Mileage (km)</label>
                    <input
                      name="bikeMileage"
                      value={form.bikeMileage}
                      onChange={handleChange}
                      placeholder="e.g. 18450"
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.fullWidth}>
                    <label className={styles.label}>Notes</label>
                    <textarea
                      name="bikeNotes"
                      value={form.bikeNotes}
                      onChange={handleChange}
                      placeholder="e.g. New tyres fitted Jan 2026, chain replaced, etc."
                      rows={5}
                      className={styles.textarea}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
