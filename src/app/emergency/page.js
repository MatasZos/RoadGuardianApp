"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "../components/Navbar";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { getAblyClient } from "../../lib/ablyClient";

const INCIDENT_TYPES = [
  "breakdown",
  "crash",
  "flat_tyre",
  "mechanical_issue",
  "fuel_issue",
  "medical_issue",
  "other",
];

const SEVERITIES = ["low", "medium", "high", "critical"];

const STATUS_LABELS = {
  reported: "Reported",
  dispatching: "Dispatching",
  rider_responding: "Rider responding",
  help_on_the_way: "Help on the way",
  assistance_received: "Assistance received",
  resolved: "Resolved",
  cancelled: "Cancelled",
};

const QUICK_REPLIES = [
  "I’m nearby.",
  "Are you safe?",
  "I’m on the way.",
  "What exactly happened?",
  "Do you need medical help?",
];

function prettify(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function isClosedStatus(status) {
  return status === "resolved" || status === "cancelled";
}

function markerColorForIncident(status) {
  if (status === "reported" || status === "dispatching") return "#ef4444";
  if (status === "rider_responding" || status === "help_on_the_way") return "#22c55e";
  if (status === "assistance_received") return "#f59e0b";
  if (status === "resolved" || status === "cancelled") return "#9ca3af";
  return "#ef4444";
}

function formatTime(dateValue) {
  if (!dateValue) return "—";
  try {
    return new Date(dateValue).toLocaleString();
  } catch {
    return "—";
  }
}

function haversineKm(a, b) {
  if (!a || !b) return null;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(a.lat)) *
      Math.cos(toRad(b.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

export default function EmergencyPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const email = session?.user?.email || null;

  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [coords, setCoords] = useState(null);
  const [followMode, setFollowMode] = useState(true);

  const [incidents, setIncidents] = useState([]);
  const [liveRiders, setLiveRiders] = useState([]);
  const [loadingIncidents, setLoadingIncidents] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [selectedIncidentContext, setSelectedIncidentContext] = useState(null);

  const [showEmergencyForm, setShowEmergencyForm] = useState(false);
  const [shareLiveLocation, setShareLiveLocation] = useState(false);

  const [form, setForm] = useState({
    type: "breakdown",
    severity: "medium",
    description: "",
    injured: false,
    bikeRideable: true,
    phone: "",
  });

  const [chatOpen, setChatOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatText, setChatText] = useState("");
  const [newChatEmail, setNewChatEmail] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const myMarkerRef = useRef(null);
  const incidentMarkersRef = useRef({});
  const riderMarkersRef = useRef({});
  const watchIdRef = useRef(null);
  const hasCenteredRef = useRef(false);
  const lastCoordsRef = useRef(null);
  const followModeRef = useRef(true);
  const lastLiveLocationPublishRef = useRef(0);

  const ablyRef = useRef(null);
  const userChannelRef = useRef(null);
  const conversationChannelRef = useRef(null);
  const emergenciesChannelRef = useRef(null);
  const ridersChannelRef = useRef(null);
  const userSubscriptionRef = useRef(null);
  const conversationSubscriptionRef = useRef(null);
  const emergenciesSubscriptionRef = useRef(null);
  const ridersSubscriptionRef = useRef(null);

  const myActiveIncident = useMemo(() => {
    return incidents.find(
      (item) => item.userEmail === email && !isClosedStatus(item.status)
    );
  }, [incidents, email]);

  const activeIncidents = useMemo(() => {
    return incidents.filter((item) => !isClosedStatus(item.status));
  }, [incidents]);

  const recentHistory = useMemo(() => {
    return incidents.filter((item) => isClosedStatus(item.status)).slice(0, 8);
  }, [incidents]);

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
    if (status === "loading") return;
    if (status === "unauthenticated") return;
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    if (!mapboxgl.accessToken) {
      setError("Missing Mapbox token (NEXT_PUBLIC_MAPBOX_TOKEN).");
      return;
    }

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-6.2603, 53.3498],
      zoom: 12,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.on("load", () => map.resize());
    map.on("dragstart", () => {
      followModeRef.current = false;
      setFollowMode(false);
    });

    mapRef.current = map;

    const resizeTimer = setTimeout(() => map.resize(), 300);

    return () => {
      clearTimeout(resizeTimer);

      Object.values(incidentMarkersRef.current).forEach((m) => m.remove());
      Object.values(riderMarkersRef.current).forEach((m) => m.remove());
      incidentMarkersRef.current = {};
      riderMarkersRef.current = {};

      myMarkerRef.current?.remove();
      myMarkerRef.current = null;

      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      if (mapRef.current?.getLayer("route")) mapRef.current.removeLayer("route");
      if (mapRef.current?.getSource("route")) mapRef.current.removeSource("route");

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [status]);

  useEffect(() => {
    if (!mapRef.current) return;
    const timer = setTimeout(() => mapRef.current?.resize(), 250);
    return () => clearTimeout(timer);
  }, [chatOpen]);

  useEffect(() => {
    if (!email) return;
    if (!("geolocation" in navigator)) return;
    if (watchIdRef.current !== null) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const nextCoords = { lat, lng };

        setCoords(nextCoords);

        if (myMarkerRef.current && myActiveIncident) {
          myMarkerRef.current.setLngLat([lng, lat]);
        }

        if (myActiveIncident) {
          updateDrivingCamera(lat, lng);
          maybeSendEmergencyLocationUpdate(lat, lng);
        }

        maybeSendLiveLocation(lat, lng);
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
  }, [email, myActiveIncident, shareLiveLocation]);

  async function getLiveCoords() {
    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) {
        reject(new Error("Geolocation not supported."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
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
      zoom: 16.8,
      pitch: 65,
      bearing,
      duration: 800,
      offset: [0, 170],
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
      mapRef.current.fitBounds(bounds, { padding: 55 });
    } catch (err) {
      console.error("Route error:", err);
      setError(err.message || "Could not get your current location.");
    }
  }

  function clearRoute() {
    if (!mapRef.current) return;
    if (mapRef.current.getLayer("route")) mapRef.current.removeLayer("route");
    if (mapRef.current.getSource("route")) mapRef.current.removeSource("route");
  }

  async function fetchIncidents() {
    setLoadingIncidents(true);
    try {
      const res = await fetch("/api/emergency", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "Failed to fetch emergencies.");
        return;
      }

      setIncidents(Array.isArray(data.emergencies) ? data.emergencies : []);
    } catch (err) {
      console.error("Error fetching emergencies:", err);
      setError("Failed to fetch emergencies.");
    } finally {
      setLoadingIncidents(false);
    }
  }

  async function fetchLiveRiders() {
    try {
      const res = await fetch("/api/live-location", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return;
      setLiveRiders(Array.isArray(data.riders) ? data.riders : []);
    } catch (err) {
      console.error("Error fetching live riders:", err);
    }
  }

  useEffect(() => {
    if (!email) return;
    fetchIncidents();
    fetchLiveRiders();
  }, [email]);

  useEffect(() => {
    if (!email) return;

    const ably = getAblyClient();
    const emergenciesChannel = ably.channels.get("emergencies:live");
    const ridersChannel = ably.channels.get("riders:live");

    emergenciesChannelRef.current = emergenciesChannel;
    ridersChannelRef.current = ridersChannel;

    const emergencyHandler = async (msg) => {
      if (msg.name === "emergency-updated") {
        await fetchIncidents();
      }
    };

    const riderHandler = async (msg) => {
      if (msg.name === "live-location-updated") {
        await fetchLiveRiders();
      }
    };

    emergenciesSubscriptionRef.current = emergencyHandler;
    ridersSubscriptionRef.current = riderHandler;

    emergenciesChannel.subscribe(emergencyHandler);
    ridersChannel.subscribe(riderHandler);

    return () => {
      if (emergenciesSubscriptionRef.current) {
        emergenciesChannel.unsubscribe(emergenciesSubscriptionRef.current);
      }
      if (ridersSubscriptionRef.current) {
        ridersChannel.unsubscribe(ridersSubscriptionRef.current);
      }
    };
  }, [email]);

  async function maybeSendEmergencyLocationUpdate(lat, lng) {
    if (!myActiveIncident?.shareLiveLocation) return;
    const now = Date.now();
    if (now - lastLiveLocationPublishRef.current < 5000) return;

    lastLiveLocationPublishRef.current = now;

    try {
      await fetch("/api/emergency", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emergencyId: myActiveIncident._id,
          action: "update-location",
          lat,
          lng,
        }),
      });
    } catch (err) {
      console.error("Emergency location update failed:", err);
    }
  }

  async function maybeSendLiveLocation(lat, lng) {
    if (!shareLiveLocation || !email) return;
    const now = Date.now();
    if (now - lastLiveLocationPublishRef.current < 5000) return;

    lastLiveLocationPublishRef.current = now;

    try {
      await fetch("/api/live-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat,
          lng,
          enabled: true,
        }),
      });
    } catch (err) {
      console.error("Live location update failed:", err);
    }
  }

  useEffect(() => {
    if (!email || !coords) return;

    if (!shareLiveLocation) {
      fetch("/api/live-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: coords.lat,
          lng: coords.lng,
          enabled: false,
        }),
      }).catch((err) => console.error(err));
      return;
    }

    fetch("/api/live-location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lat: coords.lat,
        lng: coords.lng,
        enabled: true,
      }),
    }).catch((err) => console.error(err));
  }, [shareLiveLocation, email]);

  async function startOrOpenConversation(otherUserEmail, presetText = "", incident = null) {
    if (!email || !otherUserEmail) return;
    const lower = otherUserEmail.trim().toLowerCase();
    if (!lower || lower === email) return;

    setChatOpen(true);
    setChatError("");

    let conversation =
      conversations.find((c) => c.participants?.includes(lower)) || null;

    if (!conversation) {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: email, otherUserEmail: lower }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setChatError(data.error || "Could not start chat.");
        return;
      }
      conversation = data;
      await loadConversations();
    }

    setSelectedConversation(conversation);
    setSelectedIncidentContext(incident || null);
    await loadMessages(String(conversation._id));
    if (presetText) setChatText(presetText);
  }

  useEffect(() => {
    if (!mapRef.current) return;

    const seenIncidentIds = new Set();

    activeIncidents.forEach((incident) => {
      if (typeof incident.lat !== "number" || typeof incident.lng !== "number") return;

      const id = String(incident._id);
      seenIncidentIds.add(id);

      const isMine = incident.userEmail === email;
      const distanceKm = coords
        ? haversineKm(coords, { lat: incident.lat, lng: incident.lng })
        : null;

      const helperActions = !isMine
        ? `
          <button class="claim-help-btn" data-id="${id}" style="${popupBtnStyle("#16a34a")}">Offer help</button>
          <button class="route-incident-btn" data-id="${id}" data-lng="${incident.lng}" data-lat="${incident.lat}" style="${popupBtnStyle("#2563eb")}">Route there</button>
          <button class="chat-incident-btn" data-id="${id}" data-email="${incident.userEmail}" style="${popupBtnStyle("#7c3aed")}">Message rider</button>
        `
        : `
          <button class="cancel-incident-btn" data-id="${id}" style="${popupBtnStyle("#dc2626")}">Cancel request</button>
          <button class="resolve-incident-btn" data-id="${id}" style="${popupBtnStyle("#16a34a")}">Mark resolved</button>
        `;

      const helperControls =
        incident.helperUserEmail === email
          ? `
            <button class="route-started-btn" data-id="${id}" data-lng="${incident.lng}" data-lat="${incident.lat}" style="${popupBtnStyle("#0ea5e9")}">I'm on the way</button>
            <button class="arrived-btn" data-id="${id}" style="${popupBtnStyle("#f59e0b")}">Mark arrived</button>
            <button class="resolve-incident-btn" data-id="${id}" style="${popupBtnStyle("#16a34a")}">Resolve</button>
          `
          : "";

      const popupHtml = `
        <div style="color:#111; min-width:240px; line-height:1.45;">
          <div style="font-weight:800; font-size:15px; margin-bottom:6px;">
            ${incident.userName || "Rider"} • ${prettify(incident.type)}
          </div>
          <div><strong>Status:</strong> ${STATUS_LABELS[incident.status] || incident.status}</div>
          <div><strong>Severity:</strong> ${prettify(incident.severity)}</div>
          <div><strong>Injured:</strong> ${incident.injured ? "Yes" : "No"}</div>
          <div><strong>Bike rideable:</strong> ${
            incident.bikeRideable === null ? "Unknown" : incident.bikeRideable ? "Yes" : "No"
          }</div>
          <div><strong>Phone:</strong> ${incident.phone || "—"}</div>
          <div><strong>Created:</strong> ${formatTime(incident.createdAt)}</div>
          <div><strong>Latest update:</strong> ${incident.latestUpdate || "—"}</div>
          <div><strong>Distance:</strong> ${
            distanceKm == null ? "—" : `${distanceKm.toFixed(1)} km`
          }</div>
          ${
            incident.description
              ? `<div style="margin-top:8px;"><strong>Description:</strong><br/>${incident.description}</div>`
              : ""
          }
          ${
            incident.helperUserName
              ? `<div style="margin-top:8px;"><strong>Helper:</strong> ${incident.helperUserName}</div>`
              : `<div style="margin-top:8px;"><strong>Helper:</strong> Not assigned</div>`
          }
          <div style="display:grid; gap:8px; margin-top:12px;">
            ${helperActions}
            ${helperControls}
          </div>
        </div>
      `;

      if (!incidentMarkersRef.current[id]) {
        const popup = new mapboxgl.Popup().setHTML(popupHtml);
        const marker = new mapboxgl.Marker({
          color: isMine ? "#f97316" : markerColorForIncident(incident.status),
        })
          .setLngLat([incident.lng, incident.lat])
          .setPopup(popup)
          .addTo(mapRef.current);

        popup.on("open", () => {
          setTimeout(() => {
            const popupEl = popup.getElement();
            if (!popupEl) return;

            const claimBtn = popupEl.querySelector(".claim-help-btn");
            const routeBtn = popupEl.querySelector(".route-incident-btn");
            const chatBtn = popupEl.querySelector(".chat-incident-btn");
            const cancelBtn = popupEl.querySelector(".cancel-incident-btn");
            const resolveBtn = popupEl.querySelector(".resolve-incident-btn");
            const routeStartedBtn = popupEl.querySelector(".route-started-btn");
            const arrivedBtn = popupEl.querySelector(".arrived-btn");

            if (claimBtn) {
              claimBtn.onclick = async () => {
                await updateIncident(id, "claim-help");
              };
            }

            if (routeBtn) {
              routeBtn.onclick = async () => {
                await drawRouteToUser(incident.lng, incident.lat);
                await updateIncident(id, "route-started");
              };
            }

            if (chatBtn) {
              chatBtn.onclick = async () => {
                await startOrOpenConversation(
                  incident.userEmail,
                  "Hi, I saw your emergency. I’m nearby.",
                  incident
                );
              };
            }

            if (cancelBtn) {
              cancelBtn.onclick = async () => {
                await updateIncident(id, "cancel");
              };
            }

            if (resolveBtn) {
              resolveBtn.onclick = async () => {
                await updateIncident(id, "resolve");
              };
            }

            if (routeStartedBtn) {
              routeStartedBtn.onclick = async () => {
                await drawRouteToUser(incident.lng, incident.lat);
                await updateIncident(id, "route-started");
              };
            }

            if (arrivedBtn) {
              arrivedBtn.onclick = async () => {
                await updateIncident(id, "arrived");
              };
            }
          }, 0);
        });

        incidentMarkersRef.current[id] = marker;
      } else {
        incidentMarkersRef.current[id].setLngLat([incident.lng, incident.lat]);
      }
    });

    Object.keys(incidentMarkersRef.current).forEach((id) => {
      if (!seenIncidentIds.has(id)) {
        incidentMarkersRef.current[id].remove();
        delete incidentMarkersRef.current[id];
      }
    });
  }, [activeIncidents, coords, email, conversations]);

  useEffect(() => {
    if (!mapRef.current) return;

    const activeIncidentEmails = new Set(activeIncidents.map((i) => i.userEmail));
    const seenRiderIds = new Set();

    liveRiders.forEach((rider) => {
      if (!rider?.enabled) return;
      if (rider.userEmail === email) return;
      if (activeIncidentEmails.has(rider.userEmail)) return;
      if (typeof rider.lat !== "number" || typeof rider.lng !== "number") return;

      const id = String(rider._id);
      seenRiderIds.add(id);

      const distanceKm = coords
        ? haversineKm(coords, { lat: rider.lat, lng: rider.lng })
        : null;

      const popupHtml = `
        <div style="color:#111; min-width:220px; line-height:1.45;">
          <div style="font-weight:800; margin-bottom:6px;">${rider.userName || "Rider"}</div>
          <div><strong>Email:</strong> ${rider.userEmail}</div>
          <div><strong>Status:</strong> Nearby rider</div>
          <div><strong>Distance:</strong> ${
            distanceKm == null ? "—" : `${distanceKm.toFixed(1)} km`
          }</div>
          <div style="display:grid; gap:8px; margin-top:12px;">
            <button class="route-rider-btn" data-id="${id}" style="${popupBtnStyle("#2563eb")}">Route to rider</button>
            <button class="chat-rider-btn" data-id="${id}" data-email="${rider.userEmail}" style="${popupBtnStyle("#7c3aed")}">Message rider</button>
          </div>
        </div>
      `;

      if (!riderMarkersRef.current[id]) {
        const popup = new mapboxgl.Popup().setHTML(popupHtml);
        const marker = new mapboxgl.Marker({ color: "#3b82f6" })
          .setLngLat([rider.lng, rider.lat])
          .setPopup(popup)
          .addTo(mapRef.current);

        popup.on("open", () => {
          setTimeout(() => {
            const popupEl = popup.getElement();
            if (!popupEl) return;

            const routeBtn = popupEl.querySelector(".route-rider-btn");
            const chatBtn = popupEl.querySelector(".chat-rider-btn");

            if (routeBtn) {
              routeBtn.onclick = async () => {
                await drawRouteToUser(rider.lng, rider.lat);
              };
            }

            if (chatBtn) {
              chatBtn.onclick = async () => {
                await startOrOpenConversation(
                  rider.userEmail,
                  "Hey, I can see you nearby on the map.",
                  null
                );
              };
            }
          }, 0);
        });

        riderMarkersRef.current[id] = marker;
      } else {
        riderMarkersRef.current[id].setLngLat([rider.lng, rider.lat]);
      }
    });

    Object.keys(riderMarkersRef.current).forEach((id) => {
      if (!seenRiderIds.has(id)) {
        riderMarkersRef.current[id].remove();
        delete riderMarkersRef.current[id];
      }
    });
  }, [liveRiders, coords, email, activeIncidents, conversations]);

  useEffect(() => {
    if (!mapRef.current || !coords) return;

    if (!myMarkerRef.current) {
      myMarkerRef.current = new mapboxgl.Marker({ color: "#f97316" })
        .setLngLat([coords.lng, coords.lat])
        .setPopup(
          new mapboxgl.Popup().setHTML(
            `<div style="color:#111;"><strong>${fullName || "You"}</strong><br/>Your live position</div>`
          )
        )
        .addTo(mapRef.current);
    } else {
      myMarkerRef.current.setLngLat([coords.lng, coords.lat]);
    }

    if (!hasCenteredRef.current) {
      mapRef.current.jumpTo({
        center: [coords.lng, coords.lat],
        zoom: 15.5,
        pitch: 40,
        bearing: 0,
      });
      hasCenteredRef.current = true;
    }
  }, [coords, fullName]);

  async function updateIncident(emergencyId, action) {
    try {
      const res = await fetch("/api/emergency", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emergencyId, action }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to update incident.");
        return;
      }

      await fetchIncidents();

      if (action === "claim-help" || action === "route-started") {
        setChatOpen(true);
        const incident = data?.emergency;
        if (incident?.userEmail) {
          await startOrOpenConversation(
            incident.userEmail,
            action === "claim-help" ? "I’ve claimed your incident and I’m helping." : "I’m on the way.",
            incident
          );
        }
      }

      if (action === "resolve" || action === "cancel") {
        clearRoute();
      }
    } catch (err) {
      console.error("Incident update error:", err);
      setError("Failed to update incident.");
    }
  }

  async function handleCreateEmergency() {
    setSubmitLoading(true);
    setError("");

    try {
      let currentCoords = coords;
      if (!currentCoords?.lat || !currentCoords?.lng) {
        currentCoords = await getLiveCoords();
        setCoords(currentCoords);
      }

      const res = await fetch("/api/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: currentCoords.lat,
          lng: currentCoords.lng,
          type: form.type,
          severity: form.severity,
          description: form.description,
          injured: form.injured,
          bikeRideable: form.bikeRideable,
          phone: form.phone,
          shareLiveLocation,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Could not create emergency.");
        return;
      }

      setShowEmergencyForm(false);
      await fetchIncidents();
    } catch (err) {
      console.error(err);
      setError("Could not create emergency.");
    } finally {
      setSubmitLoading(false);
    }
  }

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
    if (!email) return;

    const ably = getAblyClient();
    ablyRef.current = ably;

    const userChannel = ably.channels.get(`user:${email}`);
    userChannelRef.current = userChannel;

    const handler = async (message) => {
      if (
        message?.name === "conversation-updated" ||
        message?.name === "new-conversation"
      ) {
        await loadConversations();
      }
    };

    userSubscriptionRef.current = handler;
    userChannel.subscribe(handler);

    return () => {
      if (userSubscriptionRef.current) {
        userChannel.unsubscribe(userSubscriptionRef.current);
      }
    };
  }, [email]);

  useEffect(() => {
    if (!selectedConversation?._id || !email) return;

    const ably = ablyRef.current || getAblyClient();
    const channelName = `conversation:${selectedConversation._id}`;
    const conversationChannel = ably.channels.get(channelName);
    conversationChannelRef.current = conversationChannel;

    const handler = async (message) => {
      if (message?.name === "new-message") {
        await loadMessages(selectedConversation._id);
        await loadConversations();
      }
    };

    conversationSubscriptionRef.current = handler;
    conversationChannel.subscribe(handler);

    return () => {
      if (conversationSubscriptionRef.current) {
        conversationChannel.unsubscribe(conversationSubscriptionRef.current);
      }
    };
  }, [selectedConversation?._id, email]);

  useEffect(() => {
    if (!chatOpen || !email) return;
    loadConversations();
  }, [chatOpen, email]);

  async function handleStartChat() {
    setChatError("");
    const otherUserEmail = newChatEmail.trim().toLowerCase();

    if (!email) return;

    if (!otherUserEmail) {
      setChatError("Enter an email address to start a chat.");
      return;
    }

    if (otherUserEmail === email) {
      setChatError("You cannot message yourself.");
      return;
    }

    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userEmail: email, otherUserEmail }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setChatError(data.error || "Could not start chat.");
      return;
    }

    await loadConversations();
    setSelectedConversation(data);
    setNewChatEmail("");
    await loadMessages(String(data._id));

    try {
      const ably = ablyRef.current || getAblyClient();
      const otherUserChannel = ably.channels.get(`user:${otherUserEmail}`);
      const myUserChannel = ably.channels.get(`user:${email}`);

      await otherUserChannel.publish("new-conversation", {
        conversationId: String(data._id),
        with: email,
      });

      await myUserChannel.publish("conversation-updated", {
        conversationId: String(data._id),
      });
    } catch (err) {
      console.error("ABLY start chat publish error:", err);
    }
  }

  async function handleSelectConversation(conversation) {
    setSelectedConversation(conversation);
    await loadMessages(String(conversation._id));
    setChatError("");
  }

  async function handleSendMessage() {
    const text = chatText.trim();
    if (!text || !selectedConversation || !email) return;

    const otherUser = selectedConversation.participants.find((p) => p !== email);
    if (!otherUser) {
      setChatError("Could not determine who to send this message to.");
      return;
    }

    setChatLoading(true);
    setChatError("");

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
      setChatError(data.error || "Could not send message.");
      return;
    }

    setChatText("");
    await loadConversations();
    await loadMessages(String(selectedConversation._id));

    try {
      const ably = ablyRef.current || getAblyClient();
      const conversationChannel = ably.channels.get(
        `conversation:${selectedConversation._id}`
      );
      const senderUserChannel = ably.channels.get(`user:${email}`);
      const receiverUserChannel = ably.channels.get(`user:${otherUser}`);

      await conversationChannel.publish("new-message", {
        conversationId: String(selectedConversation._id),
        senderEmail: email,
        receiverEmail: otherUser,
        text,
      });

      await senderUserChannel.publish("conversation-updated", {
        conversationId: String(selectedConversation._id),
      });

      await receiverUserChannel.publish("conversation-updated", {
        conversationId: String(selectedConversation._id),
      });
    } catch (err) {
      console.error("ABLY send publish error:", err);
    }
  }

  if (status === "loading") {
    return (
      <div style={styles.loadingWrap}>
        Loading...
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <Navbar />

      <div style={styles.container}>
        <div style={styles.headerRow}>
          <div>
            <h1 style={{ color: "#ef4444", marginBottom: 6 }}>Emergency Hub</h1>
            <p style={{ color: "#cbd5e1", margin: 0 }}>
              Report incidents, see nearby riders, and coordinate support live.
            </p>
          </div>

          <div style={styles.toggleRow}>
            <button
              onClick={() => setShowEmergencyForm((prev) => !prev)}
              style={styles.emergencyBtn}
              disabled={Boolean(myActiveIncident)}
            >
              {myActiveIncident ? "Active Emergency Exists" : "Report Emergency"}
            </button>

            <button onClick={clearRoute} style={styles.secondaryBtn}>
              Clear Route
            </button>

            <button
              onClick={() => setFollowMode((prev) => !prev)}
              style={{
                ...styles.secondaryBtn,
                background: followMode ? "#16a34a" : "#374151",
              }}
            >
              {followMode ? "Following You" : "Follow Off"}
            </button>
          </div>
        </div>

        <div style={styles.shareRow}>
          <label style={styles.switchLabel}>
            <input
              type="checkbox"
              checked={shareLiveLocation}
              onChange={(e) => setShareLiveLocation(e.target.checked)}
            />
            <span>Share live location temporarily</span>
          </label>

          <div style={styles.legend}>
            <span><b style={{ color: "#ef4444" }}>●</b> Emergency active</span>
            <span><b style={{ color: "#3b82f6" }}>●</b> Nearby rider</span>
            <span><b style={{ color: "#22c55e" }}>●</b> Help responding</span>
            <span><b style={{ color: "#9ca3af" }}>●</b> Resolved / closed</span>
          </div>
        </div>

        <div style={styles.mapWrap}>
          <div ref={mapContainerRef} style={styles.map} />
        </div>

        {error && <p style={styles.errorText}>{error}</p>}

        {showEmergencyForm && !myActiveIncident && (
          <div style={styles.panel}>
            <h2 style={styles.panelTitle}>Create Emergency</h2>

            <div style={styles.formGrid}>
              <label style={styles.field}>
                <span>Incident type</span>
                <select
                  value={form.type}
                  onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                  style={styles.input}
                >
                  {INCIDENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {prettify(type)}
                    </option>
                  ))}
                </select>
              </label>

              <label style={styles.field}>
                <span>Severity</span>
                <select
                  value={form.severity}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, severity: e.target.value }))
                  }
                  style={styles.input}
                >
                  {SEVERITIES.map((level) => (
                    <option key={level} value={level}>
                      {prettify(level)}
                    </option>
                  ))}
                </select>
              </label>

              <label style={styles.fieldWide}>
                <span>Short description</span>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={4}
                  style={{ ...styles.input, resize: "vertical" }}
                  placeholder="Explain what happened..."
                />
              </label>

              <label style={styles.field}>
                <span>Phone</span>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  style={styles.input}
                  placeholder="Contact phone"
                />
              </label>

              <label style={styles.checkboxField}>
                <input
                  type="checkbox"
                  checked={form.injured}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, injured: e.target.checked }))
                  }
                />
                <span>Someone is injured</span>
              </label>

              <label style={styles.checkboxField}>
                <input
                  type="checkbox"
                  checked={form.bikeRideable}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      bikeRideable: e.target.checked,
                    }))
                  }
                />
                <span>Bike is still rideable</span>
              </label>
            </div>

            <div style={styles.actionRow}>
              <button
                onClick={handleCreateEmergency}
                style={styles.emergencyBtn}
                disabled={submitLoading}
              >
                {submitLoading ? "Creating..." : "Send Emergency"}
              </button>
              <button
                onClick={() => setShowEmergencyForm(false)}
                style={styles.secondaryBtn}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {myActiveIncident && (
          <div style={styles.activeCard}>
            <div style={styles.activeCardTop}>
              <div>
                <h2 style={{ margin: 0, color: "#ef4444" }}>
                  {prettify(myActiveIncident.type)}
                </h2>
                <p style={{ margin: "6px 0 0", color: "#e2e8f0" }}>
                  {STATUS_LABELS[myActiveIncident.status] || myActiveIncident.status}
                </p>
              </div>

              <div style={styles.badge}>
                {prettify(myActiveIncident.severity)}
              </div>
            </div>

            <div style={styles.infoGrid}>
              <div><strong>Created:</strong> {formatTime(myActiveIncident.createdAt)}</div>
              <div><strong>Phone:</strong> {myActiveIncident.phone || "—"}</div>
              <div><strong>Injured:</strong> {myActiveIncident.injured ? "Yes" : "No"}</div>
              <div>
                <strong>Bike rideable:</strong>{" "}
                {myActiveIncident.bikeRideable ? "Yes" : "No"}
              </div>
              <div><strong>Latest update:</strong> {myActiveIncident.latestUpdate || "—"}</div>
              <div>
                <strong>Helper:</strong>{" "}
                {myActiveIncident.helperUserName || "No rider assigned yet"}
              </div>
            </div>

            {myActiveIncident.description && (
              <div style={{ marginTop: 12 }}>
                <strong>Description:</strong>
                <p style={{ marginTop: 6, color: "#cbd5e1" }}>
                  {myActiveIncident.description}
                </p>
              </div>
            )}

            <div style={styles.actionRow}>
              <button
                onClick={() => updateIncident(myActiveIncident._id, "resolve")}
                style={styles.successBtn}
              >
                Assistance Received / Resolve
              </button>
              <button
                onClick={() => updateIncident(myActiveIncident._id, "cancel")}
                style={styles.dangerBtn}
              >
                Cancel Request
              </button>
            </div>
          </div>
        )}

        <div style={styles.columns}>
          <div style={styles.panel}>
            <h2 style={styles.panelTitle}>
              Active Incidents {loadingIncidents ? "..." : `(${activeIncidents.length})`}
            </h2>

            {activeIncidents.length === 0 ? (
              <p style={styles.muted}>No active incidents right now.</p>
            ) : (
              activeIncidents.map((incident) => (
                <div key={incident._id} style={styles.listCard}>
                  <div style={styles.listCardTop}>
                    <div>
                      <strong>{incident.userName}</strong> • {prettify(incident.type)}
                    </div>
                    <span style={styles.smallBadge}>
                      {STATUS_LABELS[incident.status] || incident.status}
                    </span>
                  </div>

                  <div style={styles.listCardMeta}>
                    <div>Severity: {prettify(incident.severity)}</div>
                    <div>Created: {formatTime(incident.createdAt)}</div>
                    <div>Helper: {incident.helperUserName || "None assigned"}</div>
                    <div>Latest update: {incident.latestUpdate || "—"}</div>
                  </div>

                  <div style={styles.actionRow}>
                    <button
                      style={styles.secondaryBtn}
                      onClick={() => drawRouteToUser(incident.lng, incident.lat)}
                    >
                      Route
                    </button>

                    {incident.userEmail !== email && (
                      <>
                        <button
                          style={styles.successBtn}
                          onClick={() => updateIncident(incident._id, "claim-help")}
                        >
                          Offer Help
                        </button>
                        <button
                          style={styles.secondaryBtn}
                          onClick={() =>
                            startOrOpenConversation(
                              incident.userEmail,
                              "Hi, I can see your incident and I’m checking in.",
                              incident
                            )
                          }
                        >
                          Message
                        </button>
                      </>
                    )}

                    {incident.helperUserEmail === email && (
                      <>
                        <button
                          style={styles.secondaryBtn}
                          onClick={async () => {
                            await drawRouteToUser(incident.lng, incident.lat);
                            await updateIncident(incident._id, "route-started");
                          }}
                        >
                          I’m On The Way
                        </button>

                        <button
                          style={styles.successBtn}
                          onClick={() => updateIncident(incident._id, "arrived")}
                        >
                          Mark Arrived
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={styles.panel}>
            <h2 style={styles.panelTitle}>Recent Incidents</h2>

            {recentHistory.length === 0 ? (
              <p style={styles.muted}>No recent incident history yet.</p>
            ) : (
              recentHistory.map((incident) => (
                <div key={incident._id} style={styles.historyItem}>
                  <div style={{ fontWeight: 700 }}>
                    {incident.userName} • {prettify(incident.type)}
                  </div>
                  <div style={styles.historyMeta}>
                    {STATUS_LABELS[incident.status] || incident.status} •{" "}
                    {formatTime(incident.updatedAt || incident.createdAt)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <button onClick={() => setChatOpen((prev) => !prev)} style={styles.chatButton}>
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

        {selectedIncidentContext && (
          <div style={styles.incidentChatHeader}>
            <div style={{ fontWeight: 700 }}>
              Active incident chat: {prettify(selectedIncidentContext.type)}
            </div>
            <div style={{ color: "#cbd5e1", fontSize: "0.85rem", marginTop: 4 }}>
              Rider: {selectedIncidentContext.userName} • Status:{" "}
              {STATUS_LABELS[selectedIncidentContext.status] || selectedIncidentContext.status}
            </div>

            <div style={styles.quickReplyWrap}>
              {QUICK_REPLIES.map((reply) => (
                <button
                  key={reply}
                  style={styles.quickReplyBtn}
                  onClick={() => setChatText(reply)}
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>
        )}

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

        {chatError && <div style={styles.chatError}>{chatError}</div>}

        <div style={styles.chatBody}>
          <div style={styles.chatList}>
            {conversations.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>No conversations yet</p>
            ) : (
              conversations.map((conv) => {
                const otherUser =
                  conv.participants.find((p) => p !== email) || "Unknown";

                return (
                  <button
                    key={String(conv._id)}
                    style={{
                      ...styles.chatListItem,
                      ...(String(selectedConversation?._id) === String(conv._id)
                        ? styles.chatListItemActive
                        : {}),
                    }}
                    onClick={() => handleSelectConversation(conv)}
                  >
                    <div style={{ fontWeight: "700", color: "#fff" }}>{otherUser}</div>
                    <div style={styles.chatListSnippet}>
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
                    <p style={{ color: "#94a3b8" }}>No messages yet</p>
                  ) : (
                    messages.map((msg, i) => {
                      const isMine = msg.senderEmail === email;
                      return (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: isMine ? "flex-end" : "flex-start",
                            gap: "4px",
                          }}
                        >
                          <div
                            style={{
                              ...styles.messageBubble,
                              ...(isMine
                                ? styles.myMessageBubble
                                : styles.otherMessageBubble),
                            }}
                          >
                            {msg.text}
                          </div>
                          <span style={styles.messageMeta}>
                            {isMine ? "You" : msg.senderEmail}
                          </span>
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

function popupBtnStyle(background) {
  return `
    background:${background};
    color:white;
    border:none;
    border-radius:8px;
    padding:8px 10px;
    cursor:pointer;
    font-weight:700;
  `;
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#111827",
    color: "#fff",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    position: "relative",
  },
  loadingWrap: {
    minHeight: "100vh",
    background: "#111827",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  toggleRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  shareRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  switchLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#e2e8f0",
  },
  legend: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
    color: "#cbd5e1",
    fontSize: "0.92rem",
  },
  mapWrap: {
    width: "100%",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 12px 28px rgba(0,0,0,0.35)",
  },
  map: {
    width: "100%",
    height: "420px",
    minHeight: "420px",
  },
  errorText: {
    color: "#fecaca",
    margin: 0,
  },
  panel: {
    background: "#0f172a",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "16px",
    padding: "18px",
    boxShadow: "0 10px 24px rgba(0,0,0,0.24)",
  },
  panelTitle: {
    marginTop: 0,
    marginBottom: 14,
    color: "#f8fafc",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    color: "#e2e8f0",
  },
  fieldWide: {
    gridColumn: "1 / -1",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    color: "#e2e8f0",
  },
  checkboxField: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#e2e8f0",
    paddingTop: "28px",
  },
  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "#111827",
    color: "#fff",
    outline: "none",
  },
  actionRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "14px",
  },
  emergencyBtn: {
    padding: "13px 20px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#ef4444",
    color: "#fff",
    fontSize: "1rem",
    fontWeight: "bold",
    cursor: "pointer",
  },
  secondaryBtn: {
    padding: "13px 20px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#2563eb",
    color: "#fff",
    fontSize: "0.96rem",
    fontWeight: "bold",
    cursor: "pointer",
  },
  successBtn: {
    padding: "13px 20px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#16a34a",
    color: "#fff",
    fontSize: "0.96rem",
    fontWeight: "bold",
    cursor: "pointer",
  },
  dangerBtn: {
    padding: "13px 20px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#dc2626",
    color: "#fff",
    fontSize: "0.96rem",
    fontWeight: "bold",
    cursor: "pointer",
  },
  activeCard: {
    background: "linear-gradient(180deg, #1f2937, #111827)",
    border: "1px solid rgba(239,68,68,0.35)",
    borderRadius: "16px",
    padding: "18px",
    boxShadow: "0 10px 28px rgba(0,0,0,0.3)",
  },
  activeCardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  badge: {
    padding: "6px 10px",
    borderRadius: "999px",
    background: "rgba(239,68,68,0.16)",
    color: "#fecaca",
    fontWeight: 700,
    border: "1px solid rgba(239,68,68,0.25)",
  },
  smallBadge: {
    padding: "4px 9px",
    borderRadius: "999px",
    background: "rgba(59,130,246,0.14)",
    color: "#bfdbfe",
    fontSize: "0.82rem",
    fontWeight: 700,
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "10px",
    marginTop: "14px",
    color: "#e2e8f0",
  },
  columns: {
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr",
    gap: "16px",
  },
  listCard: {
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "14px",
    padding: "14px",
    background: "#111827",
    marginBottom: "12px",
  },
  listCardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: "10px",
  },
  listCardMeta: {
    display: "grid",
    gap: "6px",
    color: "#cbd5e1",
    fontSize: "0.92rem",
  },
  historyItem: {
    padding: "12px 0",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  historyMeta: {
    color: "#94a3b8",
    marginTop: "4px",
    fontSize: "0.9rem",
  },
  muted: {
    color: "#94a3b8",
    margin: 0,
  },
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
    zIndex: 200,
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
    boxShadow: "-12px 0 32px rgba(0,0,0,0.35)",
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
    fontWeight: "700",
  },
  incidentChatHeader: {
    padding: "12px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "#131d2d",
  },
  quickReplyWrap: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "10px",
  },
  quickReplyBtn: {
    padding: "8px 10px",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "#1e293b",
    color: "#fff",
    cursor: "pointer",
    fontSize: "0.82rem",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "#cbd5e1",
    cursor: "pointer",
    fontSize: "1rem",
  },
  newChatBox: {
    padding: "12px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    gap: "8px",
    background: "#0b111b",
  },
  chatError: {
    padding: "10px 12px",
    color: "#fca5a5",
    background: "rgba(127,29,29,0.22)",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    fontSize: "0.85rem",
  },
  chatBody: {
    display: "grid",
    gridTemplateColumns: "165px 1fr",
    flex: 1,
    minHeight: 0,
  },
  chatList: {
    borderRight: "1px solid rgba(255,255,255,0.06)",
    overflowY: "auto",
    padding: "10px",
    background: "#0a0f18",
  },
  chatListItem: {
    width: "100%",
    textAlign: "left",
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.05)",
    marginBottom: "8px",
    cursor: "pointer",
    background: "#0f1724",
    transition: "0.2s ease",
  },
  chatListItemActive: {
    background: "#162033",
    border: "1px solid rgba(59,130,246,0.35)",
    boxShadow: "0 0 0 1px rgba(59,130,246,0.08) inset",
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
    background: "#0b111b",
  },
  emptyChat: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#94a3b8",
    fontSize: "0.95rem",
  },
  messagesArea: {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.01), rgba(255,255,255,0))",
  },
  messageBubble: {
    maxWidth: "78%",
    padding: "12px 14px",
    borderRadius: "10px",
    color: "#fff",
    wordBreak: "break-word",
    lineHeight: "1.4",
    fontSize: "0.95rem",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  myMessageBubble: {
    background: "#1d4ed8",
    borderTopRightRadius: "4px",
    boxShadow: "0 6px 16px rgba(37,99,235,0.18)",
  },
  otherMessageBubble: {
    background: "#151c28",
    borderTopLeftRadius: "4px",
    color: "#e5e7eb",
  },
  messageMeta: {
    fontSize: "0.72rem",
    color: "#94a3b8",
    padding: "0 4px",
  },
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
    outline: "none",
  },
  startBtn: {
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.06)",
    background: "linear-gradient(180deg, #2563eb, #1d4ed8)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "700",
  },
};