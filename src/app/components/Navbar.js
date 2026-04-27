"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Navbar as BsNavbar,
  Container,
  Offcanvas,
  Dropdown,
  Badge,
  Button,
  ListGroup,
} from "react-bootstrap";
import { getAblyClient } from "../../lib/ablyClient";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
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
    setMenuOpen(false);
    setNotifOpen(false);
  }

  async function logout() {
    setMenuOpen(false);
    setNotifOpen(false);
    await signOut({ callbackUrl: "/login" });
  }

  function getNotifIcon(type) {
    if (type === "message") return "bi-chat-dots-fill text-primary";
    if (type === "document") return "bi-file-earmark-text-fill text-warning";
    if (type === "emergency") return "bi-exclamation-triangle-fill text-danger";
    if (type === "maintenance") return "bi-wrench-adjustable text-success";
    return "bi-bell-fill text-secondary";
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
        body: JSON.stringify({ action: "markAllRead", userEmail: email }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
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
        body: JSON.stringify({ action: "clearAll", userEmail: email }),
      });
      if (res.ok) setNotifications([]);
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
        body: JSON.stringify({ action: "markRead", id, userEmail: email }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, read: true } : n))
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
    return () => channel.unsubscribe(handler);
  }, [email]);

  return (
    <>
      <BsNavbar
        bg="dark"
        variant="dark"
        sticky="top"
        className="border-bottom border-secondary-subtle shadow-sm"
        style={{ zIndex: 1030 }}
      >
        <Container fluid className="px-3">
          <div className="d-flex align-items-center gap-3">
            <Button
              variant="outline-light"
              size="sm"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="border-0"
            >
              <i className="bi bi-list fs-4"></i>
            </Button>

            <BsNavbar.Brand
              role="button"
              onClick={() => router.push("/home")}
              className="d-flex align-items-center gap-2 mb-0"
            >
              <img
                src="/logo.png"
                alt="RoadGuardian"
                width={28}
                height={28}
              />
              <span className="fw-bold">RoadGuardian</span>
            </BsNavbar.Brand>
          </div>

          <div className="d-flex align-items-center gap-2">
            <Dropdown
              align="end"
              show={notifOpen}
              onToggle={(open) => setNotifOpen(open)}
            >
              <Dropdown.Toggle
                as={Button}
                variant="outline-light"
                size="sm"
                className="position-relative border-0"
                aria-label="Notifications"
              >
                <i className="bi bi-bell-fill fs-5"></i>
                {unreadCount > 0 && (
                  <Badge
                    bg="danger"
                    pill
                    className="position-absolute top-0 start-100 translate-middle"
                    style={{ fontSize: "0.65rem" }}
                  >
                    {unreadCount}
                    <span className="visually-hidden">unread notifications</span>
                  </Badge>
                )}
              </Dropdown.Toggle>

              <Dropdown.Menu
                className="shadow-lg p-0 overflow-hidden"
                style={{
                  width: "min(360px, calc(100vw - 24px))",
                  maxHeight: "70vh",
                }}
              >
                <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom border-secondary-subtle">
                  <strong>Notifications</strong>
                  <div className="d-flex gap-2">
                    <Button
                      variant="link"
                      size="sm"
                      className="text-decoration-none p-0"
                      onClick={markAllRead}
                    >
                      Mark all read
                    </Button>
                    <Button
                      variant="link"
                      size="sm"
                      className="text-decoration-none p-0 text-danger"
                      onClick={clearNotifications}
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                <div style={{ maxHeight: "55vh", overflowY: "auto" }}>
                  {notifications.length === 0 ? (
                    <div className="text-center text-secondary py-4 px-3 small">
                      No notifications yet
                    </div>
                  ) : (
                    <ListGroup variant="flush">
                      {notifications.map((item) => (
                        <ListGroup.Item
                          key={item._id}
                          action
                          onClick={() => markSingleRead(item._id)}
                          className={`d-flex gap-2 py-3 ${
                            item.read ? "" : "bg-body-tertiary"
                          }`}
                        >
                          <i
                            className={`bi ${getNotifIcon(item.type)} fs-5`}
                            style={{ flexShrink: 0 }}
                          ></i>
                          <div className="flex-grow-1 min-w-0">
                            <div className="d-flex justify-content-between gap-2 align-items-baseline">
                              <span className="fw-semibold small text-truncate">
                                {item.title}
                              </span>
                              <small
                                className="text-secondary"
                                style={{ whiteSpace: "nowrap" }}
                              >
                                {formatTime(item.createdAt)}
                              </small>
                            </div>
                            <div className="small text-body-secondary mt-1">
                              {item.text}
                            </div>
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}
                </div>
              </Dropdown.Menu>
            </Dropdown>

            <img
              src="/profile.png"
              alt="Profile"
              role="button"
              onClick={() => router.push("/profile")}
              className="rounded-circle border border-secondary-subtle"
              style={{ width: 36, height: 36, objectFit: "cover" }}
            />
          </div>
        </Container>
      </BsNavbar>

      <Offcanvas
        show={menuOpen}
        onHide={() => setMenuOpen(false)}
        placement="start"
        className="bg-dark text-light"
      >
        <Offcanvas.Header closeButton closeVariant="white">
          <Offcanvas.Title className="d-flex align-items-center gap-2">
            <img
              src="/logo.png"
              alt=""
              width={24}
              height={24}
            />
            RoadGuardian
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
          <ListGroup variant="flush">
            <ListGroup.Item
              action
              onClick={() => goTo("/home")}
              className="bg-dark text-light border-secondary-subtle py-3"
            >
              <i className="bi bi-house-door-fill me-3"></i>Home
            </ListGroup.Item>
            <ListGroup.Item
              action
              onClick={() => goTo("/emergency")}
              className="bg-dark text-light border-secondary-subtle py-3"
            >
              <i className="bi bi-exclamation-triangle-fill me-3 text-danger"></i>
              Emergency
            </ListGroup.Item>
            <ListGroup.Item
              action
              onClick={() => goTo("/maintenance")}
              className="bg-dark text-light border-secondary-subtle py-3"
            >
              <i className="bi bi-wrench-adjustable me-3"></i>Maintenance
            </ListGroup.Item>
            <ListGroup.Item
              action
              onClick={() => goTo("/documents")}
              className="bg-dark text-light border-secondary-subtle py-3"
            >
              <i className="bi bi-file-earmark-text-fill me-3"></i>Documents
            </ListGroup.Item>
            <ListGroup.Item
              action
              onClick={() => goTo("/profile")}
              className="bg-dark text-light border-secondary-subtle py-3"
            >
              <i className="bi bi-person-fill me-3"></i>My Profile
            </ListGroup.Item>
            <ListGroup.Item
              action
              onClick={() => goTo("/settings")}
              className="bg-dark text-light border-secondary-subtle py-3"
            >
              <i className="bi bi-gear-fill me-3"></i>Settings
            </ListGroup.Item>
            <ListGroup.Item
              action
              onClick={() => goTo("/support")}
              className="bg-dark text-light border-secondary-subtle py-3"
            >
              <i className="bi bi-life-preserver me-3"></i>Support
            </ListGroup.Item>
            <ListGroup.Item
              action
              onClick={logout}
              className="bg-dark text-danger border-secondary-subtle py-3"
            >
              <i className="bi bi-box-arrow-right me-3"></i>Sign Out
            </ListGroup.Item>
          </ListGroup>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}