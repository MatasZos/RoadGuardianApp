"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "../components/Navbar";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

export default function EmergencyPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [fullName, setFullName] = useState("");
  const [emergencyCalled, setEmergencyCalled] = useState(false);
  const [error, setError] = useState("");
  const [coords, setCoords] = useState(null);

  const [chatOpen, setChatOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatText, setChatText] = useState("");
  const [newChatEmail, setNewChatEmail] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const otherMarkersRef = useRef({});

  const email = session?.user?.email || null;

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    setFullName(session?.user?.name || "");
  }, [status, session, router]);

  useEffect(() => {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    if (!mapboxgl.accessToken) {
      setError("Missing Mapbox token (NEXT_PUBLIC_MAPBOX_TOKEN).");
      return;
    }

    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-6.2603, 53.3498],
      zoom: 12,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => {
      Object.values(otherMarkersRef.current).forEach((marker) => marker.remove());
      otherMarkersRef.current = {};

      markerRef.current?.remove();
      markerRef.current = null;

      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!email) return;

    const fetchEmergencies = async () => {
      if (!mapRef.current) return;

      try {
        const res = await fetch("/api/emergency", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          console.error(data?.error || "Failed to fetch emergencies");
          return;
        }

        const users = data.emergencies || [];
        const seen = new Set();

        users.forEach((user) => {
          if (!user?._id) return;
          if (user.userEmail === email) return;
          if (typeof user.lat !== "number" || typeof user.lng !== "number") return;

          const id = String(user._id);
          seen.add(id);

          if (!otherMarkersRef.current[id]) {
            otherMarkersRef.current[id] = new mapboxgl.Marker({ color: "#3b82f6" })
              .setLngLat([user.lng, user.lat])
              .setPopup(
                new mapboxgl.Popup().setHTML(
                  `<strong>${user.userName || "Rider"}</strong><br/>${user.userEmail || ""}`
                )
              )
              .addTo(mapRef.current);
          } else {
            otherMarkersRef.current[id].setLngLat([user.lng, user.lat]);
          }
        });

        Object.keys(otherMarkersRef.current).forEach((id) => {
          if (!seen.has(id)) {
            otherMarkersRef.current[id].remove();
            delete otherMarkersRef.current[id];
          }
        });
      } catch (err) {
        console.error("Error fetching emergencies:", err);
      }
    };

    fetchEmergencies();
    const interval = setInterval(fetchEmergencies, 5000);

    return () => clearInterval(interval);
  }, [email]);

  async function loadConversations() {
    if (!email) return;

    const res = await fetch("/api/conversations", {
      headers: { "x-user-email": email },
      cache: "no-store",
    });

    const data = await res.json().catch(() => []);
    setConversations(Array.isArray(data) ? data : []);
  }

  async function loadMessages(conversationId) {
    if (!email || !conversationId) return;

    const res = await fetch(
      `/api/messages?conversationId=${encodeURIComponent(conversationId)}`,
      {
        headers: { "x-user-email": email },
        cache: "no-store",
      }
    );

    const data = await res.json().catch(() => []);
    setMessages(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    if (!chatOpen || !email) return;
    loadConversations();
  }, [chatOpen, email]);

  async function handleStartChat() {
    const otherUserEmail = newChatEmail.trim().toLowerCase();

    if (!email) return;
    if (!otherUserEmail) {
      alert("Enter an email address to start a chat.");
      return;
    }
    if (otherUserEmail === email) {
      alert("You cannot message yourself.");
      return;
    }

    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userEmail: email, otherUserEmail }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(data.error || "Could not start chat.");
      return;
    }

    await loadConversations();
    setSelectedConversation(data);
    setNewChatEmail("");
    await loadMessages(String(data._id));
  }

  async function handleSelectConversation(conversation) {
    setSelectedConversation(conversation);
    await loadMessages(String(conversation._id));
  }

  async function handleSendMessage() {
    const text = chatText.trim();
    if (!text || !selectedConversation || !email) return;

    const otherUser = selectedConversation.participants.find((p) => p !== email);
    if (!otherUser) return;

    setChatLoading(true);

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: String(selectedConversation._id),
        senderEmail: email,
        receiverEmail: otherUser,
        text,
      }),
    });

    const data = await res.json().catch(() => ({}));
    setChatLoading(false);

    if (!res.ok) {
      alert(data.error || "Could not send message.");
      return;
    }

    setChatText("");
    await loadConversations();
    await loadMessages(String(selectedConversation._id));
  }

  const handleEmergency = () => {
    setEmergencyCalled(true);
    setError("");

    if (!email) {
      setError("You must be logged in.");
      return;
    }

    if (!("geolocation" in navigator)) {
      setError("Geolocation not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });

        if (mapRef.current) {
          if (!markerRef.current) {
            markerRef.current = new mapboxgl.Marker({ color: "#e74c3c" })
              .setLngLat([lng, lat])
              .setPopup(
                new mapboxgl.Popup().setHTML(
                  `<strong>${fullName || "You"}</strong><br/>Your emergency location`
                )
              )
              .addTo(mapRef.current);
          } else {
            markerRef.current.setLngLat([lng, lat]);
          }

          mapRef.current.flyTo({ center: [lng, lat], zoom: 15 });
        }

        const res = await fetch("/api/emergency", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat, lng }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) setError(data.error || "Could not save emergency.");
      },
      (err) => setError(err.message || "Could not get your location."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (status === "loading") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#111",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#111",
        color: "#fff",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        position: "relative",
      }}
    >
      <Navbar />

      <div
        style={{
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <h1 style={{ color: "#e74c3c", marginBottom: 0 }}>Emergency Page</h1>

        <div
          style={{
            width: "100%",
            maxWidth: "900px",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 8px 20px rgba(0,0,0,0.5)",
          }}
        >
          <div
            ref={mapContainerRef}
            style={{ width: "100%", height: "320px" }}
          />
        </div>

        {error && <p style={{ color: "#ffb4b4", margin: 0 }}>{error}</p>}

        <button
          onClick={handleEmergency}
          style={{
            padding: "15px 25px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: "#e74c3c",
            color: "#fff",
            fontSize: "1.1rem",
            fontWeight: "bold",
            cursor: "pointer",
            marginTop: "4px",
          }}
        >
          Call for Help
        </button>

        {emergencyCalled && (
          <div
            style={{
              marginTop: "10px",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 8px 20px rgba(0,0,0,0.5)",
              backgroundColor: "#fff",
              color: "#111",
              width: "90%",
              maxWidth: "400px",
              textAlign: "center",
            }}
          >
            <h2 style={{ marginBottom: "10px", color: "#e74c3c" }}>
              Emergency Team Dispatched!
            </h2>
            <p>
              <strong>ETA:</strong> 5 minutes
            </p>
            <p>
              <strong>Location:</strong>{" "}
              {coords
                ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
                : "Getting your location..."}
            </p>
            <p>
              <strong>Status:</strong> Team is on the way
            </p>
          </div>
        )}
      </div>

      <button
        onClick={() => setChatOpen((prev) => !prev)}
        style={styles.chatButton}
      >
        💬
      </button>

      <div
        style={{
          ...styles.chatSidebar,
          transform: chatOpen ? "translateX(0)" : "translateX(100%)",
        }}
      >
        <div style={styles.chatHeader}>
          <strong>Rider Messages</strong>
          <button
            onClick={() => setChatOpen(false)}
            style={styles.closeBtn}
          >
            ✕
          </button>
        </div>

        <div style={styles.newChatBox}>
          <input
            style={styles.chatInput}
            placeholder="Start chat by email"
            value={newChatEmail}
            onChange={(e) => setNewChatEmail(e.target.value)}
          />
          <button style={styles.startBtn} onClick={handleStartChat}>
            Start
          </button>
        </div>

        <div style={styles.chatBody}>
          <div style={styles.chatList}>
            {conversations.length === 0 ? (
              <p style={{ color: "#aaa", fontSize: "0.9rem" }}>
                No conversations yet
              </p>
            ) : (
              conversations.map((conv) => {
                const otherUser =
                  conv.participants.find((p) => p !== email) || "Unknown";

                return (
                  <button
                    key={String(conv._id)}
                    style={{
                      ...styles.chatListItem,
                      background:
                        String(selectedConversation?._id) === String(conv._id)
                          ? "#1f2937"
                          : "#111",
                    }}
                    onClick={() => handleSelectConversation(conv)}
                  >
                    <div style={{ fontWeight: "bold", color: "#fff" }}>
                      {otherUser}
                    </div>
                    <div style={{ color: "#aaa", fontSize: "0.85rem" }}>
                      {conv.lastMessage || "No messages yet"}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div style={styles.chatPanel}>
            {!selectedConversation ? (
              <div style={styles.emptyChat}>Select a conversation</div>
            ) : (
              <>
                <div style={styles.messagesArea}>
                  {messages.length === 0 ? (
                    <p style={{ color: "#aaa" }}>No messages yet</p>
                  ) : (
                    messages.map((msg, i) => {
                      const isMine = msg.senderEmail === email;

                      return (
                        <div
                          key={i}
                          style={{
                            ...styles.messageBubble,
                            alignSelf: isMine ? "flex-end" : "flex-start",
                            background: isMine ? "#2563eb" : "#1f2937",
                          }}
                        >
                          {msg.text}
                        </div>
                      );
                    })
                  )}
                </div>

                <div style={styles.messageInputRow}>
                  <input
                    style={styles.chatInput}
                    placeholder="Type a message..."
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSendMessage();
                    }}
                  />
                  <button
                    style={styles.startBtn}
                    onClick={handleSendMessage}
                    disabled={chatLoading}
                  >
                    {chatLoading ? "..." : "Send"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  chatButton: {
    position: "fixed",
    right: "20px",
    bottom: "20px",
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontSize: "1.4rem",
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
    zIndex: 200,
  },
  chatSidebar: {
    position: "fixed",
    top: "60px",
    right: 0,
    width: "420px",
    maxWidth: "100%",
    height: "calc(100vh - 60px)",
    background: "#0b0b0b",
    borderLeft: "1px solid #1e1e1e",
    transition: "transform 0.25s ease",
    zIndex: 199,
    display: "flex",
    flexDirection: "column",
  },
  chatHeader: {
    padding: "14px 16px",
    borderBottom: "1px solid #1e1e1e",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#fff",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    fontSize: "1rem",
  },
  newChatBox: {
    padding: "12px",
    borderBottom: "1px solid #1e1e1e",
    display: "flex",
    gap: "8px",
  },
  chatBody: {
    display: "grid",
    gridTemplateColumns: "150px 1fr",
    flex: 1,
    minHeight: 0,
  },
  chatList: {
    borderRight: "1px solid #1e1e1e",
    overflowY: "auto",
    padding: "8px",
  },
  chatListItem: {
    width: "100%",
    textAlign: "left",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #1e1e1e",
    marginBottom: "8px",
    cursor: "pointer",
  },
  chatPanel: {
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
  },
  emptyChat: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#aaa",
  },
  messagesArea: {
    flex: 1,
    overflowY: "auto",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  messageBubble: {
    maxWidth: "80%",
    padding: "10px 12px",
    borderRadius: "12px",
    color: "#fff",
    wordBreak: "break-word",
  },
  messageInputRow: {
    padding: "12px",
    borderTop: "1px solid #1e1e1e",
    display: "flex",
    gap: "8px",
  },
  chatInput: {
    flex: 1,
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #1e1e1e",
    background: "#111",
    color: "#fff",
  },
  startBtn: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "none",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "bold",
  },
};
