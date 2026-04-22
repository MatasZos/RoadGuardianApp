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
  activeCardTop: { display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", flexWrap: "wrap" },
  badge: { padding: "6px 10px", borderRadius: "999px", background: "rgba(239,68,68,0.16)", color: "#fecaca", fontWeight: 700, border: "1px solid rgba(239,68,68,0.25)" },
  smallBadge: { padding: "4px 9px", borderRadius: "999px", background: "rgba(59,130,246,0.14)", color: "#bfdbfe", fontSize: "0.82rem", fontWeight: 700 },
  infoGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "10px", marginTop: "14px", color: "#e2e8f0" },
  columns: { display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "16px" },
  listCard: { border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "14px", background: "#111827", marginBottom: "12px" },
  listCardTop: { display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", flexWrap: "wrap", marginBottom: "10px" },
  listCardMeta: { display: "grid", gap: "6px", color: "#cbd5e1", fontSize: "0.92rem" },
  historyItem: { padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" },
  historyMeta: { color: "#94a3b8", marginTop: "4px", fontSize: "0.9rem" },
  muted: { color: "#94a3b8", margin: 0 },

  /*messaing UI*/

  chatButton: {
    position: "fixed",
    right: "20px",
    bottom: "20px",
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
    maxWidth: "100%",
    height: "calc(100vh - 60px)",
    background: "linear-gradient(180deg, #0f172a 0%, #0b1220 100%)",
    borderLeft: "1px solid rgba(255,255,255,0.08)",
    transition: "transform 0.3s ease",
    zIndex: 199,
    display: "flex",
    flexDirection: "column",
    boxShadow: "-18px 0 50px rgba(0,0,0,0.45)",
  },

  chatHeader: {
    padding: "16px 18px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#fff",
    background: "rgba(255,255,255,0.03)",
    backdropFilter: "blur(10px)",
    fontWeight: "700",
  },

  closeBtn: {
    width: "34px",
    height: "34px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
  },

  incidentChatHeader: {
    padding: "14px",
    margin: "12px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, rgba(255,176,77,0.15), rgba(255,140,0,0.08))",
    border: "1px solid rgba(255,176,77,0.25)",
    color: "#fff",
  },

  quickReplyWrap: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "10px",
  },

  quickReplyBtn: {
    padding: "8px 12px",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    cursor: "pointer",
    fontSize: "0.8rem",
    fontWeight: "600",
  },

  newChatBox: {
    padding: "12px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    gap: "8px",
    background: "rgba(255,255,255,0.02)",
  },

  chatError: {
    padding: "10px 12px",
    color: "#fecaca",
    background: "rgba(239,68,68,0.12)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    fontSize: "0.85rem",
  },

  chatBody: {
    display: "grid",
    gridTemplateColumns: "200px 1fr",
    flex: 1,
    minHeight: 0,
  },

  chatList: {
    borderRight: "1px solid rgba(255,255,255,0.08)",
    overflowY: "auto",
    padding: "12px",
    background: "rgba(255,255,255,0.02)",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  chatListItem: {
    width: "100%",
    textAlign: "left",
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.08)",
    cursor: "pointer",
    background: "rgba(255,255,255,0.04)",
  },

  chatListItemActive: {
    background: "linear-gradient(135deg, rgba(255,176,77,0.18), rgba(255,140,0,0.1))",
    border: "1px solid rgba(255,176,77,0.28)",
  },

  chatListSnippet: {
    color: "#94a3b8",
    fontSize: "0.8rem",
    marginTop: "4px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  chatPanel: {
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    background: "rgba(255,255,255,0.01)",
  },

  emptyChat: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#94a3b8",
  },

  messagesArea: {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    background: "radial-gradient(circle at top, rgba(255,140,0,0.05), transparent 30%)",
  },

  messageBubble: {
    maxWidth: "75%",
    padding: "12px 14px",
    borderRadius: "14px",
    lineHeight: "1.4",
    fontSize: "0.95rem",
  },

  myMessageBubble: {
    background: "linear-gradient(135deg, #ffb04d, #ff8c00)",
    color: "#111",
    borderBottomRightRadius: "4px",
    fontWeight: "600",
  },

  otherMessageBubble: {
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.08)",
    borderBottomLeftRadius: "4px",
  },

  messageMeta: {
    fontSize: "0.72rem",
    color: "#94a3b8",
    padding: "0 4px",
  },

  messageInputRow: {
    padding: "12px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    gap: "8px",
    background: "rgba(17,24,39,0.9)",
  },

  chatInput: {
    flex: 1,
    padding: "11px 12px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "#fff",
    outline: "none",
  },

  startBtn: {
    padding: "10px 14px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg, #ffb04d, #ff8c00)",
    color: "#111",
    cursor: "pointer",
    fontWeight: "700",
  },
};
