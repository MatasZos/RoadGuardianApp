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

  const [followMode, setFollowMode] = useState(true);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const otherMarkersRef = useRef({});
  const watchIdRef = useRef(null);
  const hasCenteredRef = useRef(false);
  const lastCoordsRef = useRef(null);
  const followModeRef = useRef(true);

  const email = session?.user?.email || null;

  useEffect(() => {
    followModeRef.current = followMode;
  }, [followMode]);

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

    mapRef.current.on("dragstart", () => {
      followModeRef.current = false;
      setFollowMode(false);
    });

    return () => {
      Object.values(otherMarkersRef.current).forEach((marker) => marker.remove());
      otherMarkersRef.current = {};

      markerRef.current?.remove();
      markerRef.current = null;

      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      if (mapRef.current?.getLayer("route")) {
        mapRef.current.removeLayer("route");
      }
      if (mapRef.current?.getSource("route")) {
        mapRef.current.removeSource("route");
      }

      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!email) return;
    if (!("geolocation" in navigator)) return;
    if (watchIdRef.current !== null) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });

        if (markerRef.current && emergencyCalled) {
          markerRef.current.setLngLat([lng, lat]);
        }

        if (emergencyCalled) {
          updateDrivingCamera(lat, lng);
        }
      },
      (err) => {
        console.error("Location watch error:", err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [email, emergencyCalled]);

  async function getLiveCoords() {
    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) {
        reject(new Error("Geolocation not supported."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => reject(err),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }

  function getBearing(from, to) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const toDeg = (rad) => (rad * 180) / Math.PI;

    const lat1 = toRad(from.lat);
    const lon1 = toRad(from.lng);
    const lat2 = toRad(to.lat);
    const lon2 = toRad(to.lng);

    const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);

    return (toDeg(Math.atan2(y, x)) + 360) % 360;
  }

  function updateDrivingCamera(lat, lng) {
    if (!mapRef.current || !followModeRef.current) return;

    let bearing = mapRef.current.getBearing();

    if (lastCoordsRef.current) {
      bearing = getBearing(lastCoordsRef.current, { lat, lng });
    }

    mapRef.current.easeTo({
      center: [lng, lat],
      zoom: 17,
      pitch: 65,
      bearing,
      duration: 800,
      offset: [0, 180],
      essential: true,
    });

    lastCoordsRef.current = { lat, lng };
  }

  async function drawRouteToUser(targetLng, targetLat) {
    if (!mapRef.current) return;

    try {
      let start = coords;

      if (!start?.lat || !start?.lng) {
        start = await getLiveCoords();
        setCoords(start);
      }

      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

      const url =
        `https://api.mapbox.com/directions/v5/mapbox/driving/` +
        `${start.lng},${start.lat};${targetLng},${targetLat}` +
        `?geometries=geojson&overview=full&access_token=${token}`;

      const res = await fetch(url);
      const data = await res.json();

      const route = data?.routes?.[0]?.geometry;
      if (!route) {
        setError("Could not generate route.");
        return;
      }

      const routeGeoJSON = {
        type: "Feature",
        properties: {},
        geometry: route,
      };

      if (mapRef.current.getSource("route")) {
        mapRef.current.getSource("route").setData(routeGeoJSON);
      } else {
        mapRef.current.addSource("route", {
          type: "geojson",
          data: routeGeoJSON,
        });

        mapRef.current.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#38bdf8",
            "line-width": 5,
            "line-opacity": 0.9,
          },
        });
      }

      const bounds = new mapboxgl.LngLatBounds();
      route.coordinates.forEach((coord) => bounds.extend(coord));
      mapRef.current.fitBounds(bounds, { padding: 50 });
    } catch (err) {
      console.error("Route error:", err);
      setError(err.message || "Could not get your current location.");
    }
  }

  function clearRoute() {
    if (!mapRef.current) return;

    if (mapRef.current.getLayer("route")) {
      mapRef.current.removeLayer("route");
    }

    if (mapRef.current.getSource("route")) {
      mapRef.current.removeSource("route");
    }
  }

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
            const popupHtml = `
              <div style="color:black; min-width:160px;">
                <strong>${user.userName || "Rider"}</strong><br/>
                <span>${user.userEmail || ""}</span><br/><br/>
                <button
                  type="button"
                  class="route-btn"
                  data-rider-id="${id}"
                  data-lng="${user.lng}"
                  data-lat="${user.lat}"
                  style="
                    background:#2563eb;
                    color:white;
                    border:none;
                    border-radius:6px;
                    padding:8px 10px;
                    cursor:pointer;
                    font-weight:bold;
                  "
                >
                  Route to rider
                </button>
              </div>
            `;

            const popup = new mapboxgl.Popup().setHTML(popupHtml);

            const marker = new mapboxgl.Marker({ color: "#3b82f6" })
              .setLngLat([user.lng, user.lat])
              .setPopup(popup)
              .addTo(mapRef.current);

            popup.on("open", () => {
              setTimeout(() => {
                const btn = document.querySelector(
                  `.route-btn[data-rider-id="${id}"]`
                );
                if (!btn) return;

                btn.onclick = () => {
                  const lng = Number(btn.getAttribute("data-lng"));
                  const lat = Number(btn.getAttribute("data-lat"));
                  drawRouteToUser(lng, lat);
                };
              }, 0);
            });

            otherMarkersRef.current[id] = marker;
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
  }, [email, coords]);

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

  const handleEmergency = async () => {
    setEmergencyCalled(true);
    setError("");

    if (!email) {
      setError("You must be logged in.");
      return;
    }

    if (!coords?.lat || !coords?.lng) {
      setError("Current location is not available yet.");
      return;
    }

    const { lat, lng } = coords;

    if (mapRef.current) {
      if (!markerRef.current) {
        markerRef.current = new mapboxgl.Marker({ color: "#e74c3c" })
          .setLngLat([lng, lat])
          .setPopup(
            new mapboxgl.Popup().setHTML(
              `<div style="color:black;"><strong>${fullName || "You"}</strong><br/>Your emergency location</div>`
            )
          )
          .addTo(mapRef.current);
      } else {
        markerRef.current.setLngLat([lng, lat]);
      }

      if (!hasCenteredRef.current) {
        mapRef.current.jumpTo({
          center: [lng, lat],
          zoom: 17,
          pitch: 65,
          bearing: 0,
        });
        hasCenteredRef.current = true;
      }

      updateDrivingCamera(lat, lng);
    }

    const res = await fetch("/api/emergency", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lng }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Could not save emergency.");
    }
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

        <div style={{ display: "flex", gap: "10px", marginTop: "4px", flexWrap: "wrap" }}>
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
            }}
          >
            Call for Help
          </button>

          <button
            onClick={clearRoute}
            style={{
              padding: "15px 25px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: "#2563eb",
              color: "#fff",
              fontSize: "1rem",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Clear Route
          </button>

          <button
            onClick={() => setFollowMode((prev) => !prev)}
            style={{
              padding: "15px 25px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: followMode ? "#16a34a" : "#444",
              color: "#fff",
              fontSize: "1rem",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {followMode ? "Following You" : "Follow Off"}
          </button>
        </div>

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
          <button onClick={() => setChatOpen(false)} style={styles.closeBtn}>
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
