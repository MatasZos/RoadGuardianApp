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

  chatSidebar: {
    position: "fixed",
    top: "60px",
    right: 0,
    width: "440px",
    maxWidth: "100%",
    height: "calc(100vh - 60px)",
    background: "#0a0f18",
    borderLeft: "1px solid rgba(255,255,255,0.06)",
    transition: "transform 0.28s ease",
    zIndex: 199,
    display: "flex",
    flexDirection: "column",
    boxShadow: "-12px 0 32px rgba(0,0,0,0.35)"
  },

  chatHeader: {
    padding: "16px 18px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#fff",
    background: "#0d1320",
    fontSize: "1rem",
    fontWeight: "700"
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
    minHeight: 0
  },

  chatList: {
    borderRight: "1px solid rgba(255,255,255,0.06)",
    overflowY: "auto",
    padding: "10px",
    background: "#0a0f18"
  },

  chatListItem: {
    width: "100%",
    textAlign: "left",
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.05)",
    marginBottom: "8px",
    cursor: "pointer",
    background: "#0f1724"
  },

  chatListItemActive: {
    background: "#162033",
    border: "1px solid rgba(59,130,246,0.35)"
  },

  chatPanel: {
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    background: "#0b111b"
  },

  messagesArea: {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },

  messageBubble: {
    maxWidth: "78%",
    padding: "12px 14px",
    borderRadius: "10px"
  },

  myMessageBubble: {
    background: "#1d4ed8"
  },

  otherMessageBubble: {
    background: "#151c28"
  },

  messageInputRow: {
    padding: "12px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    gap: "8px"
  },

  chatInput: {
    flex: 1,
    padding: "11px 12px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "#111827",
    color: "#fff"
  },

  startBtn: {
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.06)",
    background: "linear-gradient(180deg, #2563eb, #1d4ed8)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "700"
  }
};
