"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { getAblyClient } from "../../lib/ablyClient";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const router = useRouter();
  const { data: session } = useSession();

  const email = session?.user?.email || null;

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

  function getDotColor(type) {
    if (type === "message") return "#2563eb";
    if (type === "document") return "#f59e0b";
    if (type === "emergency") return "#ef4444";
    if (type === "maintenance") return "#22c55e";
    return "#94a3b8";
  }

  function formatTime(dateValue) {
    if (!dateValue) return "";
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString(undefined, {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function loadNotifications() {
    if (!email) return;

    try {
      const res = await fetch("/api/notifications", {
        headers: { "x-user-email": email },
        cache: "no-store",
      });

      const data = await res.json().catch(() => []);
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Navbar notifications load error:", err);
    }
  }

  async function markAllRead() {
    if (!email) return;

    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "markAllRead",
          userEmail: email,
        }),
      });

      if (res.ok) {
        setNotifications((prev) =>
          prev.map((item) => ({ ...item, read: true }))
        );
      }
    } catch (err) {
      console.error("Mark all read error:", err);
    }
  }

  async function clearNotifications() {
    if (!email) return;

    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "clearAll",
          userEmail: email,
        }),
      });

      if (res.ok) {
        setNotifications([]);
      }
    } catch (err) {
      console.error("Clear notifications error:", err);
    }
  }

  async function markSingleRead(id) {
    if (!email || !id) return;

    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "markRead",
          id,
          userEmail: email,
        }),
      });

      if (res.ok) {
        setNotifications((prev) =>
          prev.map((item) =>
            item._id === id ? { ...item, read: true } : item
          )
        );
      }
    } catch (err) {
      console.error("Mark single read error:", err);
    }
  }

  useEffect(() => {
    if (!email) return;

    loadNotifications();

    const ably = getAblyClient();
    const channel = ably.channels.get(`user:${email}`);

    const handler = async (msg) => {
      if (msg.name === "notification-created") {
        setNotifications((prev) => {
          const exists = prev.some((n) => n._id === msg.data?._id);
          if (exists) return prev;
          return [msg.data, ...prev];
        });
      }

      if (msg.name === "notification-refresh") {
        await loadNotifications();
      }
    };

    channel.subscribe(handler);

    return () => {
      channel.unsubscribe(handler);
    };
  }, [email]);

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
          <div style={styles.item} onClick={() => goTo("/settings")}>
            Settings
          </div>
          <div style={styles.item} onClick={() => goTo("/support")}>
            Support
          </div>
          <div style={styles.divider}></div>
          <div
            style={{ ...styles.item, ...styles.signOutItem }}
            onClick={logout}
          >
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
                  key={item._id}
                  style={{
                    ...styles.notifItem,
                    background: item.read ? "#111827" : "#162033",
                  }}
                  onClick={() => markSingleRead(item._id)}
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
                      <span style={styles.notifTime}>
                        {formatTime(item.createdAt)}
                      </span>
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
