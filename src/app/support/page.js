"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SupportPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [submitting, setSubmitting] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [form, setForm] = useState({
    issueType: "Bug Report",
    message: "",
  });

  useEffect(() => {
    if (status !== "loading") setLoaded(true);
  }, [status]);

  const unauthenticated = status === "unauthenticated";

  const name = session?.user?.name || "RoadGuardian User";
  const email = session?.user?.email || "";

  const issueTypes = [
    "Account Issue",
    "Maintenance Records",
    "Document Reminders",
    "Emergency Feature",
    "Bug Report",
    "Other",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitTicket = async () => {
    if (!form.message.trim()) {
      alert("Please enter a message.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueType: form.issueType,
          message: form.message,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Failed to submit ticket");
        return;
      }

      alert("Ticket submitted! We’ll get back to you soon.");
      setForm((prev) => ({ ...prev, message: "" }));
    } catch (err) {
      console.error("Submit ticket error:", err);
      alert("Server error while submitting ticket");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />

      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>Support</h1>
              <p style={styles.subtitle}>
                Submit an issue and we’ll review it. Your ticket is linked to your account.
              </p>
            </div>

            <div style={styles.accountPill}>
              <span style={styles.dot} />
              <span style={styles.accountText}>
                {unauthenticated ? "Signed out" : `Signed in as: ${email}`}
              </span>
            </div>
          </div>

          <div style={styles.card}>
            {!loaded || status === "loading" ? (
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
                    Please log in to submit a support ticket.
                  </div>
                  <button style={styles.primaryBtn} onClick={() => router.push("/login")}>
                    Go to Login
                  </button>
                </div>
              </div>
            ) : (
              <>
                {}
                <div style={styles.banner}>
                  <div style={styles.bannerLeft}>
                    <div style={styles.bannerTitle}>Contact Support</div>
                    <div style={styles.bannerText}>
                      Provide as much detail as you can (what you clicked, what happened, any errors).
                    </div>
                  </div>
                  <div style={styles.badge}>Ticket</div>
                </div>

                <div style={styles.form}>
                  <div style={styles.grid}>
                    <div>
                      <label style={styles.label}>Name</label>
                      <div style={styles.readOnly}>{name}</div>
                    </div>

                    <div>
                      <label style={styles.label}>Email</label>
                      <div style={styles.readOnly}>{email}</div>
                    </div>
                  </div>

                  <div>
                    <label style={styles.label}>Issue Type</label>
                    <select
                      name="issueType"
                      value={form.issueType}
                      onChange={handleChange}
                      style={styles.select}
                    >
                      {issueTypes.map((t) => (
                        <option key={t} value={t} style={{ background: "#0f0f0f" }}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={styles.label}>Message</label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      placeholder="Describe the issue… (What were you doing? What did you expect? What happened?)"
                      rows={7}
                      style={styles.textarea}
                    />
                    <div style={styles.helper}>
                      Tip: include steps to reproduce and any visible error messages.
                    </div>
                  </div>

                  <div style={styles.actions}>
                    <button
                      onClick={submitTicket}
                      disabled={submitting}
                      style={{
                        ...styles.submitBtn,
                        ...(submitting ? styles.submitBtnDisabled : {}),
                      }}
                    >
                      {submitting ? "Submitting..." : "Submit Ticket"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, message: "" }))}
                      disabled={submitting}
                      style={{
                        ...styles.secondaryBtn,
                        ...(submitting ? styles.submitBtnDisabled : {}),
                      }}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <div style={styles.footerHint}>
            Tickets are stored securely and reviewed by the team.
          </div>
        </div>
      </div>
    </>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top, #1b1026, #000)", 
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
    maxWidth: "720px",
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
    background: "#a855f7", 
    boxShadow: "0 0 12px rgba(168,85,247,0.55)",
  },
  accountText: {
    fontSize: "0.85rem",
    color: "rgba(255,255,255,0.85)",
  },

  card: {
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "18px",
    padding: "22px",
    boxShadow: "0 18px 60px rgba(0,0,0,0.60)",
    overflow: "hidden",
  },

  banner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "14px",
    padding: "14px 14px",
    borderRadius: "14px",
    border: "1px solid rgba(168,85,247,0.22)",
    background:
      "linear-gradient(90deg, rgba(168,85,247,0.18), rgba(0,0,0,0.15))",
    marginBottom: "18px",
  },
  bannerLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  bannerTitle: {
    fontWeight: 900,
    letterSpacing: "0.2px",
  },
  bannerText: {
    color: "rgba(255,255,255,0.70)",
    fontSize: "0.9rem",
    lineHeight: 1.35,
  },
  badge: {
    padding: "8px 10px",
    borderRadius: "999px",
    fontWeight: 900,
    color: "#000",
    background: "#a855f7",
    boxShadow: "0 12px 30px rgba(168,85,247,0.22)",
    flexShrink: 0,
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
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
  readOnly: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.30)",
    color: "rgba(255,255,255,0.90)",
    fontSize: "0.95rem",
  },

  select: {
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
  helper: {
    marginTop: "8px",
    color: "rgba(255,255,255,0.55)",
    fontSize: "0.85rem",
  },

  actions: {
    display: "flex",
    gap: "10px",
    marginTop: "6px",
  },
  submitBtn: {
    padding: "11px 14px",
    borderRadius: "12px",
    border: "none",
    background: "#a855f7",
    color: "#000",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 12px 30px rgba(168,85,247,0.22)",
  },
  secondaryBtn: {
    padding: "11px 14px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },
  submitBtnDisabled: {
    opacity: 0.65,
    cursor: "not-allowed",
  },

  footerHint: {
    marginTop: "14px",
    color: "rgba(255,255,255,0.55)",
    fontSize: "0.85rem",
    textAlign: "center",
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
