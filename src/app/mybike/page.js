"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

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

      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>My Bike</h1>
              <p style={styles.subtitle}>
                Update your bike details to keep maintenance and reminders accurate.
              </p>
            </div>

            <div style={styles.accountPill}>
              <span style={styles.dot} />
              <span style={styles.accountText}>
                {unauthenticated
                  ? "Signed out"
                  : `Signed in as: ${session?.user?.email || ""}`}
              </span>
            </div>
          </div>

          <div style={styles.card}>
            {status === "loading" || loadingBike ? (
              <div style={styles.loading}>
                <div style={styles.skeletonTitle} />
                <div style={styles.skeletonLine} />
                <div style={styles.skeletonLine} />
                <div style={{ ...styles.skeletonLine, width: "70%" }} />
              </div>
            ) : unauthenticated ? (
              <div style={styles.empty}>
                <div style={styles.emptyIcon}>!</div>
                <div>
                  <div style={styles.emptyTitle}>You’re not signed in</div>
                  <div style={styles.emptyText}>
                    Please log in to view and update your bike details.
                  </div>
                  <button style={styles.primaryBtn} onClick={() => router.push("/login")}>
                    Go to Login
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={styles.cardHeader}>
                  <div>
                    <h2 style={styles.cardTitle}>Bike Details</h2>
                    <p style={styles.cardHint}>
                      This information can be used across RoadGuardian (maintenance, reminders, etc.).
                    </p>
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      ...styles.saveBtn,
                      ...(saving ? styles.saveBtnDisabled : {}),
                    }}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>

                <div style={styles.grid}>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={styles.label}>Bike (Make + Model)</label>
                    <input
                      name="motorbike"
                      value={form.motorbike}
                      onChange={handleChange}
                      placeholder="e.g. Kawasaki Ninja 1000SX"
                      style={styles.input}
                    />
                  </div>

                  <div>
                    <label style={styles.label}>Year</label>
                    <input
                      name="bikeYear"
                      value={form.bikeYear}
                      onChange={handleChange}
                      placeholder="e.g. 2022"
                      style={styles.input}
                    />
                  </div>

                  <div>
                    <label style={styles.label}>Current Mileage (km)</label>
                    <input
                      name="bikeMileage"
                      value={form.bikeMileage}
                      onChange={handleChange}
                      placeholder="e.g. 18450"
                      style={styles.input}
                    />
                  </div>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={styles.label}>Notes</label>
                    <textarea
                      name="bikeNotes"
                      value={form.bikeNotes}
                      onChange={handleChange}
                      placeholder="e.g. New tyres fitted Jan 2026, chain replaced, etc."
                      rows={5}
                      style={styles.textarea}
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

const styles = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top, #1a1a1a, #000)",
    color: "#fff",
    padding: "35px 18px",
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "18px",
    marginBottom: "18px",
  },
  title: {
    margin: 0,
    fontSize: "2.2rem",
    fontWeight: 800,
    letterSpacing: "0.2px",
  },
  subtitle: {
    marginTop: "8px",
    marginBottom: 0,
    color: "rgba(255,255,255,0.65)",
    fontSize: "0.95rem",
    lineHeight: 1.4,
  },
  accountPill: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 14px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 12px 35px rgba(0,0,0,0.55)",
    whiteSpace: "nowrap",
  },
  dot: {
    width: "8px",
    height: "8px",
    borderRadius: "999px",
    background: "#f39c12",
    boxShadow: "0 0 12px rgba(243,156,18,0.6)",
  },
  accountText: {
    fontSize: "0.85rem",
    color: "rgba(255,255,255,0.85)",
  },
  card: {
    background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "18px",
    padding: "22px",
    boxShadow: "0 18px 60px rgba(0,0,0,0.60)",
    overflow: "hidden",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "14px",
    paddingBottom: "16px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    marginBottom: "18px",
  },
  cardTitle: {
    margin: 0,
    fontSize: "1.25rem",
    fontWeight: 800,
    letterSpacing: "0.2px",
  },
  cardHint: {
    margin: "6px 0 0 0",
    fontSize: "0.9rem",
    color: "rgba(255,255,255,0.6)",
    lineHeight: 1.4,
  },
  saveBtn: {
    padding: "10px 14px",
    borderRadius: "10px",
    border: "none",
    background: "#f39c12",
    color: "#000",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 12px 30px rgba(243,156,18,0.25)",
  },
  saveBtnDisabled: {
    opacity: 0.65,
    cursor: "not-allowed",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "0.85rem",
    color: "rgba(255,255,255,0.75)",
  },
  input: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.35)",
    color: "#fff",
    outline: "none",
    fontSize: "0.95rem",
  },
  textarea: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.35)",
    color: "#fff",
    outline: "none",
    fontSize: "0.95rem",
    resize: "none",
  },
  loading: {
    padding: "8px 2px",
  },
  skeletonTitle: {
    height: "16px",
    width: "180px",
    borderRadius: "10px",
    background: "rgba(255,255,255,0.08)",
    marginBottom: "14px",
  },
  skeletonLine: {
    height: "12px",
    width: "100%",
    borderRadius: "10px",
    background: "rgba(255,255,255,0.06)",
    marginBottom: "10px",
  },
  empty: {
    display: "flex",
    gap: "14px",
    alignItems: "flex-start",
    padding: "10px 2px",
  },
  emptyIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "12px",
    background: "rgba(231,76,60,0.12)",
    border: "1px solid rgba(231,76,60,0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#e74c3c",
    fontWeight: 900,
  },
  emptyTitle: {
    fontWeight: 900,
    marginBottom: "6px",
  },
  emptyText: {
    color: "rgba(255,255,255,0.65)",
    marginBottom: "12px",
    lineHeight: 1.4,
  },
  primaryBtn: {
    padding: "10px 14px",
    borderRadius: "10px",
    border: "none",
    background: "#e74c3c",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },
};
