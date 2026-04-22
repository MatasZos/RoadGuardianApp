export const styles = {
  page: { minHeight: "100vh", background: "#111827", color: "#fff", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", position: "relative" },
  loadingWrap: { minHeight: "100vh", background: "#111827", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" },
  container: { padding: "20px", display: "flex", flexDirection: "column", gap: "16px" },
  headerRow: { display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "flex-start", flexWrap: "wrap" },
  toggleRow: { display: "flex", gap: "10px", flexWrap: "wrap" },
  shareRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" },
  switchLabel: { display: "flex", alignItems: "center", gap: "10px", color: "#e2e8f0" },
  legend: { display: "flex", gap: "16px", flexWrap: "wrap", color: "#cbd5e1", fontSize: "0.92rem" },
  mapWrap: { width: "100%", borderRadius: "16px", overflow: "hidden", boxShadow: "0 12px 28px rgba(0,0,0,0.35)" },
  map: { width: "100%", height: "420px", minHeight: "420px" },
  errorText: { color: "#fecaca", margin: 0 },
  panel: { background: "#0f172a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "18px", boxShadow: "0 10px 24px rgba(0,0,0,0.24)" },
  panelTitle: { marginTop: 0, marginBottom: 14, color: "#f8fafc" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" },
  field: { display: "flex", flexDirection: "column", gap: "8px", color: "#e2e8f0" },
  fieldWide: { gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "8px", color: "#e2e8f0" },
  checkboxField: { display: "flex", alignItems: "center", gap: "10px", color: "#e2e8f0", paddingTop: "28px" },
  input: { width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: "#111827", color: "#fff", outline: "none" },
  actionRow: { display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "14px" },
  emergencyBtn: { padding: "13px 20px", borderRadius: "10px", border: "none", backgroundColor: "#ef4444", color: "#fff", fontSize: "1rem", fontWeight: "bold", cursor: "pointer" },
  secondaryBtn: { padding: "13px 20px", borderRadius: "10px", border: "none", backgroundColor: "#2563eb", color: "#fff", fontSize: "0.96rem", fontWeight: "bold", cursor: "pointer" },
  successBtn: { padding: "13px 20px", borderRadius: "10px", border: "none", backgroundColor: "#16a34a", color: "#fff", fontSize: "0.96rem", fontWeight: "bold", cursor: "pointer" },
  dangerBtn: { padding: "13px 20px", borderRadius: "10px", border: "none", backgroundColor: "#dc2626", color: "#fff", fontSize: "0.96rem", fontWeight: "bold", cursor: "pointer" },
  activeCard: { background: "linear-gradient(180deg, #1f2937, #111827)", border: "1px solid rgba(239,68,68,0.35)", borderRadius: "16px", padding: "18px", boxShadow: "0 10px 28px rgba(0,0,0,0.3)" },

  /* CHAT */

  chatButton: {
    position: "fixed",
    right: "480px", // moved out of sidebar
    bottom: "24px",
    width: "60px",
    height: "60px",
    borderRadius: "18px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "linear-gradient(135deg, #ffb04d, #ff8c00)",
    color: "#111",
    fontSize: "1.4rem",
    cursor: "pointer",
    boxShadow: "0 18px 40px rgba(255,140,0,0.28)",
    zIndex: 200,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  chatSidebar: {
    position: "fixed",
    top: "60px",
    right: 0,
    width: "460px",
    height: "calc(100vh - 60px)",
    background: "linear-gradient(180deg, #0f172a 0%, #0b1220 100%)",
    display: "flex",
    flexDirection: "column",
  },

  chatBody: {
    display: "grid",
    gridTemplateColumns: "200px 1fr",
    flex: 1,
    minHeight: 0,
  },

  chatPanel: {
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    paddingRight: "12px", // pushes content away from scrollbar
  },

  messagesArea: {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  messageInputRow: {
    padding: "12px 16px", // more space
    borderTop: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    gap: "10px",
  },

  chatInput: {
    flex: 1,
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "#fff",
  },

  startBtn: {
    padding: "12px 18px", // bigger + pushed out
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg, #ffb04d, #ff8c00)",
    color: "#111",
    fontWeight: "700",
    cursor: "pointer",
  },
};
