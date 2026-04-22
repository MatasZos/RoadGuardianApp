"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    emailReminders: true,
    documentReminders: true,
    maintenanceReminders: true,
    emergencyLocation: true,
    compactMode: false,
  });

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      setLoading(false);
      return;
    }

    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/settings", { method: "GET" });
        const data = await res.json();

        if (res.ok) {
          setSettings((prev) => ({ ...prev, ...(data?.settings || {}) }));
        } else {
          console.error(data?.error || "Failed to load settings");
        }
      } catch (err) {
        console.error("Fetch settings error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [status]);

  const toggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data?.error || "Failed to save settings");
        alert(data?.error || "Failed to save settings");
        return;
      }

      alert("Settings saved!");
    } catch (err) {
      console.error("Save settings error:", err);
      alert("Server error while saving settings");
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
              <h1 style={styles.title}>Settings</h1>
              <p style={styles.subtitle}>
                Manage your preferences and reminders for RoadGuardian.
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
            {status === "loading" || loading ? (
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
                    Please log in to view and update your settings.
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
                    <h2 style={styles.cardTitle}>Preferences</h2>
                    <p style={styles.cardHint}>
                      These settings are saved to your account and follow you across devices.
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
                    {saving ? "Saving..." : "Save Settings"}
                  </button>
                </div>

                <div style={styles.section}>
                  <div style={styles.sectionTitle}>Reminders</div>

                  <SettingRow
                    title="Email reminders"
                    desc="Receive email notifications for important events."
                    enabled={settings.emailReminders}
                    onToggle={() => toggle("emailReminders")}
                  />

                  <SettingRow
                    title="Document reminders"
                    desc="Get notified when documents are expiring soon."
                    enabled={settings.documentReminders}
                    onToggle={() => toggle("documentReminders")}
                  />

                  <SettingRow
                    title="Maintenance reminders"
                    desc="Get reminders based on your service history."
                    enabled={settings.maintenanceReminders}
                    onToggle={() => toggle("maintenanceReminders")}
                  />
                </div>

                <div style={styles.section}>
                  <div style={styles.sectionTitle}>Safety</div>

                  <SettingRow
                    title="Emergency location access"
                    desc="Allow RoadGuardian to use location for emergency assistance."
                    enabled={settings.emergencyLocation}
                    onToggle={() => toggle("emergencyLocation")}
                  />
                </div>

                <div style={styles.section}>
                  <div style={styles.sectionTitle}>Display</div>

                  <SettingRow
                    title="Compact mode"
                    desc="Tighter spacing for smaller screens."
                    enabled={settings.compactMode}
                    onToggle={() => toggle("compactMode")}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function SettingRow({ title, desc, enabled, onToggle }) {
  return (
    <div style={styles.row}>
      <div style={styles.rowLeft}>
        <div style={styles.rowTitle}>{title}</div>
        <div style={styles.rowDesc}>{desc}</div>
      </div>

      <button
        onClick={onToggle}
        style={{
          ...styles.toggle,
          ...(enabled ? styles.toggleOn : styles.toggleOff),
        }}
        aria-label={`${title} toggle`}
      >
        <span
          style={{
            ...styles.knob,
            transform: enabled ? "translateX(18px)" : "translateX(0px)",
          }}
        />
      </button>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top, #101a1f, #000)", 
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
    background: "#3b82f6", 
    boxShadow: "0 0 12px rgba(59,130,246,0.55)",
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
    background: "#3b82f6",
    color: "#000",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 12px 30px rgba(59,130,246,0.22)",
  },
  saveBtnDisabled: {
    opacity: 0.65,
    cursor: "not-allowed",
  },
  section: {
    padding: "14px 0",
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
  sectionTitle: {
    fontWeight: 900,
    marginBottom: "10px",
    color: "rgba(255,255,255,0.9)",
    letterSpacing: "0.2px",
  },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "14px",
    padding: "12px 0",
  },
  rowLeft: {
    maxWidth: "740px",
  },
  rowTitle: {
    fontWeight: 800,
    marginBottom: "5px",
  },
  rowDesc: {
    color: "rgba(255,255,255,0.62)",
    fontSize: "0.9rem",
    lineHeight: 1.35,
  },

  toggle: {
    width: "46px",
    height: "26px",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.25)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    padding: "3px",
    transition: "all 0.2s ease",
    flexShrink: 0,
  },
  toggleOn: {
    background: "rgba(59,130,246,0.35)",
    border: "1px solid rgba(59,130,246,0.55)",
    boxShadow: "0 10px 26px rgba(59,130,246,0.18)",
  },
  toggleOff: {
    background: "rgba(0,0,0,0.25)",
  },
  knob: {
    width: "20px",
    height: "20px",
    borderRadius: "999px",
    background: "#fff",
    transition: "transform 0.2s ease",
  },

  loading: { padding: "8px 2px" },
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
    fontWeight: 900,
    cursor: "pointer",
  },
};
