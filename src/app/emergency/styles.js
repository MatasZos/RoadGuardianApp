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

  badge: { padding: "6px 10px", borderRadius: "999px", background: "rgba(239,68,68,0.16)", color: "#fecaca", fontWeight: 700 },
  smallBadge: { padding: "4px 9px", borderRadius: "999px", background: "rgba(59,130,246,0.14)", color: "#bfdbfe", fontSize: "0.82rem", fontWeight: 700 },

  columns: { display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "16px" },

  listCard: { border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "14px", background: "#111827", marginBottom: "12px" },

  muted: { color: "#94a3b8", margin: 0 },

  /* CHAT */

 /* CHAT BUTTON */
  chatButton: {
    position: "fixed",
    right: "20px",
    bottom: "20px",
    width: "58px",
    height: "58px",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "linear-gradient(180deg, #2563eb, #1d4ed8)",
    color: "#fff",
    fontSize: "1.35rem",
    cursor: "pointer",
    boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
    zIndex: 200
  },

  /* SIDEBAR */
chatSidebar: {
  position: "fixed",
  top: "60px",
  right: 0,
  width: "440px",
  height: "calc(100vh - 60px)",
  background: "#0a0f18",
  borderLeft: "1px solid rgba(255,255,255,0.06)",
  transition: "transform 0.28s ease",
  display: "flex",
  flexDirection: "column",
  zIndex: 9999, 
},

  chatHeader: {
    padding: "16px 18px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#0d1320",
    fontWeight: "700",
  },

  closeBtn: {
    background: "transparent",
    border: "none",
    color: "#cbd5e1",
    cursor: "pointer",
    fontSize: "1rem"
  },

  chatBody: {
    display: "grid",
    gridTemplateColumns: "165px 1fr",
    flex: 1,
  },

  /* LEFT LIST */
  chatList: {
    borderRight: "1px solid rgba(255,255,255,0.06)",
    padding: "10px",
    background: "#0a0f18",
  },

  chatListItem: {
    width: "100%",
    textAlign: "left",
    padding: "12px",
    borderRadius: "12px",
    background: "#0f1724",
    marginBottom: "8px",
    color: "#fff",
    cursor: "pointer",
  },

  chatListItemActive: {
    background: "#162033",
    border: "1px solid rgba(59,130,246,0.35)",
  },

  /* CHAT PANEL */
  chatPanel: {
    display: "flex",
    flexDirection: "column",
    background: "#0b111b",
  },

  messagesArea: {
    flex: 1,
    overflowY: "auto",
    padding: "18px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    background: "#0b111b",
  },

  /* 🔥 NICE MESSAGE BUBBLES */
  messageBubble: {
    maxWidth: "78%",
    padding: "12px 16px",
    borderRadius: "18px",
    fontSize: "0.95rem",
    lineHeight: "1.45",
    wordBreak: "break-word",
    boxShadow: "0 8px 20px rgba(0,0,0,0.22)",
  },

  myMessageBubble: {
    background: "linear-gradient(180deg, #3b82f6, #2563eb)",
    color: "#fff",
    borderBottomRightRadius: "6px",
  },

  otherMessageBubble: {
    background: "#1f2937",
    color: "#f3f4f6",
    border: "1px solid rgba(255,255,255,0.06)",
    borderBottomLeftRadius: "6px",
  },

  messageMeta: {
    fontSize: "0.72rem",
    color: "#94a3b8",
    padding: "0 6px",
  },

  /* INPUT */
  messageInputRow: {
    padding: "12px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    gap: "8px",
    background: "#0d1320",
  },

  chatInput: {
    flex: 1,
    padding: "11px 12px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "#111827",
    color: "#fff",
  },

  startBtn: {
    padding: "10px 14px",
    borderRadius: "10px",
    background: "linear-gradient(180deg, #2563eb, #1d4ed8)",
    color: "#fff",
    border: "none",
    fontWeight: "700",
    cursor: "pointer",
  },
};
