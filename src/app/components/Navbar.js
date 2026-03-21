"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const router = useRouter();

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "New message",
      text: "You received a new rider message.",
      time: "Just now",
      read: false,
      type: "message",
    },
    {
      id: 2,
      title: "Document reminder",
      text: "Your insurance document expires soon.",
      time: "1 hour ago",
      read: false,
      type: "document",
    },
    {
      id: 3,
      title: "Emergency update",
      text: "A nearby emergency alert was created.",
      time: "Today",
      read: true,
      type: "emergency",
    },
  ]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  function goTo(path) {
    router.push(path);
    setOpen(false);
    setNotifOpen(false);
  }

  async function logout() {
    setOpen(false);
    setNotifOpen(false);
    await signOut({ callbackUrl: "/login" });
  }

  function toggleMenu() {
    setOpen((prev) => !prev);
    setNotifOpen(false);
  }

  function toggleNotifications() {
    setNotifOpen((prev) => !prev);
    setOpen(false);
  }

  function markAllRead() {
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, read: true }))
    );
  }

  function clearNotifications() {
    setNotifications([]);
  }

  function getDotColor(type) {
    if (type === "message") return "#2563eb";
    if (type === "document") return "#f59e0b";
    if (type === "emergency") return "#ef4444";
    return "#94a3b8";
  }

  return (
    <div style={styles.navbar}>
      <div style={styles.left}>
        <div style={styles.hamburger} onClick={toggleMenu}>
          <div style={styles.line}></div>
          <div style={styles.line}></div>
          <div style={styles.line}></div>
        </div>

        <div style={styles.brand}>
          <img
            src="/logo.png"
            alt="RoadGuardian"
            style={{ ...styles.logo, cursor: "pointer" }}
            onClick={() => router.push("/home")}
          />
          <span
            style={{ cursor: "pointer" }}
            onClick={() => router.push("/home")}
          >
            RoadGuardian
          </span>
        </div>
      </div>

      <div style={styles.right}>
        <div style={styles.bellWrapper}>
          <button style={styles.bellButton} onClick={toggleNotifications}>
            🔔
          </button>

          {unreadCount > 0 && <div style={styles.badge}>{unreadCount}</div>}
        </div>

        <img
          src="/profile.png"
          alt="Profile"
          style={styles.profile}
          onClick={() => router.push("/profile")}
        />
      </div>

      {open && (
        <div style={styles.dropdown}>
          <div style={styles.item} onClick={() => goTo("/profile")}>
            My Profile
          </div>
          <div style={styles.item} onClick={() => goTo("/mybike")}>
            My Bike
          </div>
          <div style={styles.item} onClick={() => goTo("/settings")}>
            Settings
          </div>
          <div style={styles.item} onClick={() => goTo("/support")}>
            Support
          </div>
          <div style={styles.divider}></div>
          <div style={{ ...styles.item, ...styles.signOutItem }} onClick={logout}>
            Sign Out
          </div>
        </div>
      )}

      {notifOpen && (
        <div style={styles.notifPanel}>
          <div style={styles.notifHeader}>
            <span style={styles.notifTitle}>Notifications</span>

            <div style={styles.notifActions}>
              <button style={styles.notifActionBtn} onClick={markAllRead}>
                Mark all read
              </button>
              <button style={styles.notifActionBtn} onClick={clearNotifications}>
                Clear
              </button>
            </div>
          </div>

          <div style={styles.notifList}>
            {notifications.length === 0 ? (
              <div style={styles.emptyNotif}>No notifications yet</div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  style={{
                    ...styles.notifItem,
                    background: item.read ? "#111827" : "#162033",
                  }}
                >
                  <div
                    style={{
                      ...styles.notifDot,
                      background: getDotColor(item.type),
                    }}
                  />

                  <div style={styles.notifContent}>
                    <div style={styles.notifItemTop}>
                      <span style={styles.notifItemTitle}>{item.title}</span>
                      <span style={styles.notifTime}>{item.time}</span>
                    </div>

                    <div style={styles.notifText}>{item.text}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  navbar: {
    height: "60px",
    background: "#0b0b0b",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
    position: "relative",
    borderBottom: "1px solid #1e1e1e",
    zIndex: 300,
  },

  left: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },

  right: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },

  hamburger: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    cursor: "pointer",
  },

  line: {
    width: "22px",
    height: "2px",
    background: "#fff",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "1rem",
  },

  logo: {
    width: "28px",
    height: "28px",
  },

  profile: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    cursor: "pointer",
  },

  bellWrapper: {
    position: "relative",
  },

  bellButton: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    border: "1px solid #1f2937",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    fontSize: "1rem",
  },

  badge: {
    position: "absolute",
    top: "-6px",
    right: "-6px",
    minWidth: "18px",
    height: "18px",
    padding: "0 5px",
    borderRadius: "999px",
    background: "#ef4444",
    color: "#fff",
    fontSize: "0.72rem",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid #0b0b0b",
  },

  dropdown: {
    position: "absolute",
    top: "60px",
    left: "20px",
    background: "#111",
    borderRadius: "10px",
    width: "200px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.8)",
    overflow: "hidden",
    zIndex: 310,
  },

  item: {
    padding: "12px 15px",
    color: "#fff",
    cursor: "pointer",
    fontSize: "0.9rem",
    borderBottom: "1px solid #1e1e1e",
  },

  signOutItem: {
    color: "#e74c3c",
    borderBottom: "none",
  },

  divider: {
    height: "1px",
    background: "#1e1e1e",
  },

  notifPanel: {
    position: "absolute",
    top: "60px",
    right: "20px",
    width: "360px",
    maxWidth: "calc(100vw - 40px)",
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "14px",
    boxShadow: "0 14px 40px rgba(0,0,0,0.45)",
    overflow: "hidden",
    zIndex: 320,
  },

  notifHeader: {
    padding: "14px 16px",
    borderBottom: "1px solid #1e293b",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    background: "#111827",
  },

  notifTitle: {
    color: "#fff",
    fontWeight: "700",
  },

  notifActions: {
    display: "flex",
    gap: "8px",
  },

  notifActionBtn: {
    border: "none",
    background: "#1f2937",
    color: "#cbd5e1",
    padding: "6px 10px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.75rem",
  },

  notifList: {
    maxHeight: "420px",
    overflowY: "auto",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  notifItem: {
    display: "flex",
    gap: "10px",
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid #1e293b",
  },

  notifDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    marginTop: "6px",
    flexShrink: 0,
  },

  notifContent: {
    flex: 1,
    minWidth: 0,
  },

  notifItemTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    alignItems: "center",
  },

  notifItemTitle: {
    color: "#fff",
    fontWeight: "600",
    fontSize: "0.9rem",
  },

  notifTime: {
    color: "#94a3b8",
    fontSize: "0.72rem",
    whiteSpace: "nowrap",
  },

  notifText: {
    marginTop: "4px",
    color: "#cbd5e1",
    fontSize: "0.82rem",
    lineHeight: "1.35",
  },

  emptyNotif: {
    padding: "24px 16px",
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "0.9rem",
  },
};