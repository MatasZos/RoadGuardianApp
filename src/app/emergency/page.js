"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  Container,
  Card,
  Button,
  Form,
  Alert,
  Spinner,
  Stack,
} from "react-bootstrap";

import Navbar from "../components/Navbar";
import { getAblyClient } from "../../lib/ablyClient";

import {
  isClosedStatus,
  haversineKm,
  markerColorForIncident,
  popupBtnStyle,
  prettify,
  formatTime,
} from "./utils";
import { STATUS_LABELS } from "./constants";
import { useMapbox } from "./useMapbox";

import EmergencyForm from "./EmergencyForm";
import ActiveIncidentCard from "./ActiveIncidentCard";
import IncidentList from "./IncidentList";
import ChatSidebar from "./ChatSidebar";

const LOCATION_PUSH_INTERVAL_MS = 5000;

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
    reportMode: "self",
    reportedForName: "",
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

  const {
    mapContainerRef,
    mapRef,
    myMarkerRef,
    incidentMarkersRef,
    riderMarkersRef,
    followModeRef,
  } = useMapbox({ status, chatOpen, setError, setFollowMode });

  // Refs that persist across renders without triggering re-renders themselves.
  const hasCenteredRef = useRef(false);
  const lastCoordsRef = useRef(null);
  const watchIdRef = useRef(null);
  const lastEmergencyLocationUpdateRef = useRef(0);
  const lastRiderLocationUpdateRef = useRef(0);
  const ablyRef = useRef(null);
  const userSubscriptionRef = useRef(null);
  const conversationSubscriptionRef = useRef(null);
  const emergenciesSubscriptionRef = useRef(null);
  const ridersSubscriptionRef = useRef(null);

  // The incident the current user has open and is waiting for help on (if any).
  const myActiveIncident = useMemo(
    () =>
      incidents.find(
        (i) =>
          i.userEmail === email &&
          i.reportMode === "self" &&
          !isClosedStatus(i.status)
      ),
    [incidents, email]
  );

  const activeIncidents = useMemo(
    () => incidents.filter((i) => !isClosedStatus(i.status)),
    [incidents]
  );
  const recentHistory = useMemo(
    () => incidents.filter((i) => isClosedStatus(i.status)).slice(0, 8),
    [incidents]
  );

  // followModeRef mirrors the state so map handlers can read it without
  // forcing a re-render of the whole map effect.
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

  // Track the user's location while the page is open.
  useEffect(() => {
    if (!email || !("geolocation" in navigator) || watchIdRef.current !== null)
      return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCoords({ lat, lng });
        myMarkerRef.current?.setLngLat([lng, lat]);

        // Only chase the camera when this user is the one in distress.
        if (myActiveIncident) {
          updateDrivingCamera(lat, lng);
          maybeSendEmergencyLocationUpdate(lat, lng);
        }
        maybeSendLiveLocation(lat, lng);
      },
      (err) => console.error("Location watch error:", err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [email, myActiveIncident, shareLiveLocation]);

  // Drop the user's "you are here" marker, and centre the map on first fix.
  useEffect(() => {
    if (!mapRef.current || !coords) return;

    if (!myMarkerRef.current) {
      myMarkerRef.current = new mapboxgl.Marker({ color: "#f97316" })
        .setLngLat([coords.lng, coords.lat])
        .setPopup(
          new mapboxgl.Popup().setHTML(
            `<div style="color:#111;"><strong>${
              fullName || "You"
            }</strong><br/>Your live position</div>`
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

  // Render a Mapbox marker for every active incident, attaching click handlers
  // to the buttons we inject into each popup's HTML.
  useEffect(() => {
    if (!mapRef.current) return;
    const seenIds = new Set();

    activeIncidents.forEach((incident) => {
      if (typeof incident.lat !== "number" || typeof incident.lng !== "number")
        return;
      const id = String(incident._id);
      const isMine = incident.userEmail === email;
      seenIds.add(id);

      const distanceKm = coords
        ? haversineKm(coords, { lat: incident.lat, lng: incident.lng })
        : null;

      // Action set varies with the viewer's relationship to the incident:
      // reporter sees cancel/resolve, others see "offer help" + route + chat.
      const helperActions = !isMine
        ? `
        <button class="claim-help-btn"     data-id="${id}" style="${popupBtnStyle("#16a34a")}">Offer help</button>
        <button class="route-incident-btn" data-id="${id}" data-lng="${incident.lng}" data-lat="${incident.lat}" style="${popupBtnStyle("#2563eb")}">Route there</button>
        <button class="chat-incident-btn"  data-id="${id}" data-email="${incident.userEmail}" style="${popupBtnStyle("#7c3aed")}">Message rider</button>
      `
        : `
        <button class="cancel-incident-btn"  data-id="${id}" style="${popupBtnStyle("#dc2626")}">Cancel request</button>
        <button class="resolve-incident-btn" data-id="${id}" style="${popupBtnStyle("#16a34a")}">Mark resolved</button>
      `;

      // The user who claimed this incident gets the "on the way / arrived" controls.
      const helperControls =
        incident.helperUserEmail === email
          ? `
        <button class="route-started-btn" data-id="${id}" data-lng="${incident.lng}" data-lat="${incident.lat}" style="${popupBtnStyle("#0ea5e9")}">I'm on the way</button>
        <button class="arrived-btn"       data-id="${id}" style="${popupBtnStyle("#f59e0b")}">Mark arrived</button>
        <button class="resolve-incident-btn" data-id="${id}" style="${popupBtnStyle("#16a34a")}">Resolve</button>
      `
          : "";

      const popupHtml = `
        <div style="color:#111; min-width:240px; line-height:1.45;">
          <div style="font-weight:800; font-size:15px; margin-bottom:6px;">${incident.userName || "Rider"} • ${prettify(incident.type)}</div>
          <div><strong>Report type:</strong> ${incident.reportMode === "third_party" ? "Reported by another rider" : "Self reported"}</div>
          ${incident.reportMode === "third_party" && incident.reportedForName ? `<div><strong>Reported for:</strong> ${incident.reportedForName}</div>` : ""}
          <div><strong>Status:</strong> ${STATUS_LABELS[incident.status] || incident.status}</div>
          <div><strong>Severity:</strong> ${prettify(incident.severity)}</div>
          <div><strong>Injured:</strong> ${incident.injured ? "Yes" : "No"}</div>
          <div><strong>Bike rideable:</strong> ${incident.bikeRideable === null ? "Unknown" : incident.bikeRideable ? "Yes" : "No"}</div>
          <div><strong>Phone:</strong> ${incident.phone || "—"}</div>
          <div><strong>Created:</strong> ${formatTime(incident.createdAt)}</div>
          <div><strong>Latest update:</strong> ${incident.latestUpdate || "—"}</div>
          <div><strong>Distance:</strong> ${distanceKm == null ? "—" : `${distanceKm.toFixed(1)} km`}</div>
          ${incident.description ? `<div style="margin-top:8px;"><strong>Description:</strong><br/>${incident.description}</div>` : ""}
          ${incident.helperUserName ? `<div style="margin-top:8px;"><strong>Helper:</strong> ${incident.helperUserName}</div>` : `<div style="margin-top:8px;"><strong>Helper:</strong> Not assigned</div>`}
          <div style="display:grid; gap:8px; margin-top:12px;">${helperActions}${helperControls}</div>
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

        // Bind the action buttons after the popup actually mounts to the DOM.
        popup.on("open", () =>
          setTimeout(() => {
            const el = popup.getElement();
            if (!el) return;
            const on = (cls, fn) => {
              const btn = el.querySelector(cls);
              if (btn) btn.onclick = fn;
            };
            on(".claim-help-btn", async () => await updateIncident(id, "claim-help"));
            on(".route-incident-btn", async () => {
              await drawRouteToUser(incident.lng, incident.lat);
              await updateIncident(id, "route-started");
            });
            on(".chat-incident-btn", async () =>
              await startOrOpenConversation(
                incident.userEmail,
                "Hi, I saw your emergency. I'm nearby.",
                incident
              )
            );
            on(".cancel-incident-btn", async () => await updateIncident(id, "cancel"));
            on(".resolve-incident-btn", async () => await updateIncident(id, "resolve"));
            on(".route-started-btn", async () => {
              await drawRouteToUser(incident.lng, incident.lat);
              await updateIncident(id, "route-started");
            });
            on(".arrived-btn", async () => await updateIncident(id, "arrived"));
          }, 0)
        );

        incidentMarkersRef.current[id] = marker;
      } else {
        // Marker already exists — just move it.
        incidentMarkersRef.current[id].setLngLat([incident.lng, incident.lat]);
      }
    });

    // Remove markers for incidents we no longer have in state.
    Object.keys(incidentMarkersRef.current).forEach((id) => {
      if (!seenIds.has(id)) {
        incidentMarkersRef.current[id].remove();
        delete incidentMarkersRef.current[id];
      }
    });
  }, [activeIncidents, coords, email, conversations]);

  // Same dance for nearby riders that are broadcasting their location.
  useEffect(() => {
    if (!mapRef.current) return;
    const activeEmails = new Set(activeIncidents.map((i) => i.userEmail));
    const seenIds = new Set();

    liveRiders.forEach((rider) => {
      if (!rider?.enabled || rider.userEmail === email) return;
      if (activeEmails.has(rider.userEmail)) return;
      if (typeof rider.lat !== "number" || typeof rider.lng !== "number") return;

      const id = String(rider._id);
      seenIds.add(id);
      const distanceKm = coords
        ? haversineKm(coords, { lat: rider.lat, lng: rider.lng })
        : null;

      const popupHtml = `
        <div style="color:#111; min-width:220px; line-height:1.45;">
          <div style="font-weight:800; margin-bottom:6px;">${rider.userName || "Rider"}</div>
          <div><strong>Email:</strong> ${rider.userEmail}</div>
          <div><strong>Status:</strong> Nearby rider</div>
          <div><strong>Distance:</strong> ${distanceKm == null ? "—" : `${distanceKm.toFixed(1)} km`}</div>
          <div style="display:grid; gap:8px; margin-top:12px;">
            <button class="route-rider-btn" data-id="${id}" style="${popupBtnStyle("#2563eb")}">Route to rider</button>
            <button class="chat-rider-btn"  data-id="${id}" data-email="${rider.userEmail}" style="${popupBtnStyle("#7c3aed")}">Message rider</button>
          </div>
        </div>
      `;

      if (!riderMarkersRef.current[id]) {
        const popup = new mapboxgl.Popup().setHTML(popupHtml);
        const marker = new mapboxgl.Marker({ color: "#3b82f6" })
          .setLngLat([rider.lng, rider.lat])
          .setPopup(popup)
          .addTo(mapRef.current);

        popup.on("open", () =>
          setTimeout(() => {
            const el = popup.getElement();
            if (!el) return;
            const routeBtn = el.querySelector(".route-rider-btn");
            const chatBtn = el.querySelector(".chat-rider-btn");
            if (routeBtn)
              routeBtn.onclick = async () =>
                await drawRouteToUser(rider.lng, rider.lat);
            if (chatBtn)
              chatBtn.onclick = async () =>
                await startOrOpenConversation(
                  rider.userEmail,
                  "Hey, I can see you nearby on the map.",
                  null
                );
          }, 0)
        );

        riderMarkersRef.current[id] = marker;
      } else {
        riderMarkersRef.current[id].setLngLat([rider.lng, rider.lat]);
      }
    });

    Object.keys(riderMarkersRef.current).forEach((id) => {
      if (!seenIds.has(id)) {
        riderMarkersRef.current[id].remove();
        delete riderMarkersRef.current[id];
      }
    });
  }, [liveRiders, coords, email, activeIncidents, conversations]);

  // Subscribe to the global "emergencies" and "riders" channels.
  useEffect(() => {
    if (!email) return;
    const ably = getAblyClient();
    const emergenciesChannel = ably.channels.get("emergencies:live");
    const ridersChannel = ably.channels.get("riders:live");

    const emergencyHandler = async (msg) => {
      if (msg.name === "emergency-updated") await fetchIncidents();
    };
    const riderHandler = async (msg) => {
      if (msg.name === "live-location-updated") await fetchLiveRiders();
    };

    emergenciesSubscriptionRef.current = emergencyHandler;
    ridersSubscriptionRef.current = riderHandler;
    emergenciesChannel.subscribe(emergencyHandler);
    ridersChannel.subscribe(riderHandler);

    return () => {
      emergenciesChannel.unsubscribe(emergencyHandler);
      ridersChannel.unsubscribe(riderHandler);
    };
  }, [email]);

  // Per-user channel: someone started a new chat with us, or sent a message.
  useEffect(() => {
    if (!email) return;
    const ably = getAblyClient();
    ablyRef.current = ably;
    const userChannel = ably.channels.get(`user:${email}`);
    const handler = async (msg) => {
      if (
        msg?.name === "conversation-updated" ||
        msg?.name === "new-conversation"
      )
        await loadConversations();
    };
    userSubscriptionRef.current = handler;
    userChannel.subscribe(handler);
    return () => userChannel.unsubscribe(handler);
  }, [email]);

  // Per-conversation channel: refresh messages whenever the active chat moves.
  useEffect(() => {
    if (!selectedConversation?._id || !email) return;
    const ably = ablyRef.current || getAblyClient();
    const channel = ably.channels.get(`conversation:${selectedConversation._id}`);
    const handler = async (msg) => {
      if (msg?.name === "new-message") {
        await loadMessages(selectedConversation._id);
        await loadConversations();
      }
    };
    conversationSubscriptionRef.current = handler;
    channel.subscribe(handler);
    return () => channel.unsubscribe(handler);
  }, [selectedConversation?._id, email]);

  // Push the live-location switch state up to the server whenever it flips.
  useEffect(() => {
    if (!email || !coords) return;
    fetch("/api/live-location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lat: coords.lat,
        lng: coords.lng,
        enabled: shareLiveLocation,
      }),
    }).catch(console.error);
  }, [shareLiveLocation, email, coords]);

  useEffect(() => {
    if (!chatOpen || !email) return;
    loadConversations();
  }, [chatOpen, email]);

  // Initial load of incidents + nearby riders once we know who the user is.
  useEffect(() => {
    if (!email) return;
    fetchIncidents();
    fetchLiveRiders();
  }, [email]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  function getLiveCoords() {
    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) {
        reject(new Error("Geolocation not supported."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        reject,
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }

  // Compass bearing (degrees) from one lat/lng to another. Used to point the
  // sat-nav-style camera in the direction the user is travelling.
  function getBearing(from, to) {
    const toRad = (d) => (d * Math.PI) / 180;
    const toDeg = (r) => (r * 180) / Math.PI;
    const lat1 = toRad(from.lat),
      lon1 = toRad(from.lng);
    const lat2 = toRad(to.lat),
      lon2 = toRad(to.lng);
    const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
  }

  function updateDrivingCamera(lat, lng) {
    if (!mapRef.current || !followModeRef.current) return;
    const bearing = lastCoordsRef.current
      ? getBearing(lastCoordsRef.current, { lat, lng })
      : mapRef.current.getBearing();
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
      const res = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${start.lng},${start.lat};${targetLng},${targetLat}?geometries=geojson&overview=full&access_token=${token}`
      );
      const data = await res.json();
      const route = data?.routes?.[0]?.geometry;
      if (!route) {
        setError("Could not generate route.");
        return;
      }

      const geoJSON = { type: "Feature", properties: {}, geometry: route };
      if (mapRef.current.getSource("route")) {
        mapRef.current.getSource("route").setData(geoJSON);
      } else {
        mapRef.current.addSource("route", {
          type: "geojson",
          data: geoJSON,
        });
        mapRef.current.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#38bdf8",
            "line-width": 5,
            "line-opacity": 0.9,
          },
        });
      }

      // Frame the whole route on screen.
      const bounds = new mapboxgl.LngLatBounds();
      route.coordinates.forEach((c) => bounds.extend(c));
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
    } catch {
      setError("Failed to fetch emergencies.");
    } finally {
      setLoadingIncidents(false);
    }
  }

  async function fetchLiveRiders() {
    try {
      const res = await fetch("/api/live-location", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setLiveRiders(Array.isArray(data.riders) ? data.riders : []);
    } catch (err) {
      console.error("Error fetching live riders:", err);
    }
  }

  // Throttled location push for an active emergency.
  async function maybeSendEmergencyLocationUpdate(lat, lng) {
    if (!myActiveIncident?.shareLiveLocation) return;
    const now = Date.now();
    if (now - lastEmergencyLocationUpdateRef.current < LOCATION_PUSH_INTERVAL_MS) return;
    lastEmergencyLocationUpdateRef.current = now;
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

  // Throttled location push for the "I'm visible to nearby riders" feature.
  async function maybeSendLiveLocation(lat, lng) {
    if (!shareLiveLocation || !email) return;
    const now = Date.now();
    if (now - lastRiderLocationUpdateRef.current < LOCATION_PUSH_INTERVAL_MS) return;
    lastRiderLocationUpdateRef.current = now;
    try {
      await fetch("/api/live-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng, enabled: true }),
      });
    } catch (err) {
      console.error("Live location update failed:", err);
    }
  }

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

      // When the user starts helping, pop the chat open with a preset message.
      if (action === "claim-help" || action === "route-started") {
        setChatOpen(true);
        const incident = data?.emergency;
        if (incident?.userEmail) {
          await startOrOpenConversation(
            incident.userEmail,
            action === "claim-help"
              ? "I've claimed your incident and I'm helping."
              : "I'm on the way.",
            incident
          );
        }
      }
      if (action === "resolve" || action === "cancel") clearRoute();
    } catch {
      setError("Failed to update incident.");
    }
  }

  async function handleCreateEmergency() {
    setSubmitLoading(true);
    setError("");

    // Live location is mandatory — otherwise helpers can't find the user.
    if (!shareLiveLocation) {
      setError("Live location must be enabled before sending an emergency.");
      setSubmitLoading(false);
      return;
    }

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
          ...form,
          shareLiveLocation: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not create emergency.");
        return;
      }
      setShowEmergencyForm(false);
      await fetchIncidents();
    } catch {
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
      { headers: { "x-user-email": email }, cache: "no-store" }
    );
    const data = await res.json().catch(() => []);
    setMessages(Array.isArray(data) ? data : []);
  }

  // Open the chat panel with a conversation — creating one server-side if
  // this is the first time these two users have spoken.
  async function startOrOpenConversation(
    otherUserEmail,
    presetText = "",
    incident = null
  ) {
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

    // Notify both sides so the new conversation shows up immediately.
    try {
      const ably = ablyRef.current || getAblyClient();
      await ably.channels
        .get(`user:${otherUserEmail}`)
        .publish("new-conversation", {
          conversationId: String(data._id),
          with: email,
        });
      await ably.channels
        .get(`user:${email}`)
        .publish("conversation-updated", {
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
    const otherUser = selectedConversation.participants.find(
      (p) => p !== email
    );
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

    // Realtime fan-out: conversation channel for the message itself, plus
    // a per-user "conversation-updated" ping so each side's list refreshes.
    try {
      const ably = ablyRef.current || getAblyClient();
      const convChannel = ably.channels.get(
        `conversation:${selectedConversation._id}`
      );
      const senderChannel = ably.channels.get(`user:${email}`);
      const receiverChannel = ably.channels.get(`user:${otherUser}`);
      await convChannel.publish("new-message", {
        conversationId: String(selectedConversation._id),
        senderEmail: email,
        receiverEmail: otherUser,
        text,
      });
      await senderChannel.publish("conversation-updated", {
        conversationId: String(selectedConversation._id),
      });
      await receiverChannel.publish("conversation-updated", {
        conversationId: String(selectedConversation._id),
      });
    } catch (err) {
      console.error("ABLY send publish error:", err);
    }
  }

  if (status === "loading") {
    return (
      <div className="rg-emergency-page d-flex align-items-center justify-content-center min-vh-100">
        <Spinner animation="border" variant="danger" />
      </div>
    );
  }

  return (
    <div className="rg-emergency-page min-vh-100">
      <Navbar />

      <Container fluid="xxl" className="py-4">
        <Stack gap={3}>
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3">
            <div>
              <h1 className="rg-page-title fw-bold mb-1 text-danger">
                <i className="bi bi-broadcast-pin me-2"></i>
                Emergency Hub
              </h1>
              <p className="text-body-secondary mb-0">
                Report incidents, see nearby riders, and coordinate support
                live.
              </p>
            </div>

            <div className="d-flex flex-wrap gap-2">
              <Button
                variant="danger"
                size="lg"
                onClick={() => {
                  if (!shareLiveLocation) {
                    setError(
                      "You must enable live location before reporting an emergency."
                    );
                    return;
                  }
                  setError("");
                  setShowEmergencyForm((p) => !p);
                }}
                disabled={Boolean(myActiveIncident)}
              >
                <i className="bi bi-exclamation-octagon-fill me-2"></i>
                {myActiveIncident
                  ? "Active Emergency Exists"
                  : "Report Emergency"}
              </Button>
              <Button variant="outline-light" onClick={clearRoute}>
                <i className="bi bi-x-lg me-2"></i>Clear Route
              </Button>
              <Button
                variant={followMode ? "success" : "outline-secondary"}
                onClick={() => setFollowMode((p) => !p)}
              >
                <i
                  className={`bi ${
                    followMode ? "bi-cursor-fill" : "bi-cursor"
                  } me-2`}
                ></i>
                {followMode ? "Following You" : "Follow Off"}
              </Button>
            </div>
          </div>

          {/* Live-location toggle + map colour legend. */}
          <Card className="rg-control-bar border-0">
            <Card.Body className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 py-3">
              <Form.Check
                type="switch"
                id="shareLiveLocation"
                label="Enable live location for emergency reporting"
                checked={shareLiveLocation}
                onChange={(e) => setShareLiveLocation(e.target.checked)}
              />

              <div className="d-flex flex-wrap gap-3 small text-body-secondary">
                <LegendDot color="#ef4444" label="Emergency active" />
                <LegendDot color="#3b82f6" label="Nearby rider" />
                <LegendDot color="#22c55e" label="Help responding" />
                <LegendDot color="#9ca3af" label="Resolved / closed" />
              </div>
            </Card.Body>
          </Card>

          <div className="rg-map-wrap rounded-4 overflow-hidden shadow">
            <div ref={mapContainerRef} className="rg-map" />
          </div>

          {error && (
            <Alert
              variant="danger"
              dismissible
              onClose={() => setError("")}
              className="mb-0"
            >
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error}
            </Alert>
          )}

          {showEmergencyForm && !myActiveIncident && (
            <EmergencyForm
              form={form}
              setForm={setForm}
              submitLoading={submitLoading}
              onSubmit={handleCreateEmergency}
              onClose={() => setShowEmergencyForm(false)}
            />
          )}

          {myActiveIncident && (
            <ActiveIncidentCard
              incident={myActiveIncident}
              onResolve={() => updateIncident(myActiveIncident._id, "resolve")}
              onCancel={() => updateIncident(myActiveIncident._id, "cancel")}
            />
          )}

          <IncidentList
            activeIncidents={activeIncidents}
            recentHistory={recentHistory}
            loadingIncidents={loadingIncidents}
            email={email}
            onRoute={drawRouteToUser}
            onUpdateIncident={updateIncident}
            onMessage={startOrOpenConversation}
          />
        </Stack>
      </Container>

      <ChatSidebar
        open={chatOpen}
        onClose={setChatOpen}
        email={email}
        conversations={conversations}
        selectedConversation={selectedConversation}
        messages={messages}
        chatText={chatText}
        setChatText={setChatText}
        newChatEmail={newChatEmail}
        setNewChatEmail={setNewChatEmail}
        chatLoading={chatLoading}
        chatError={chatError}
        selectedIncidentContext={selectedIncidentContext}
        onSelectConversation={handleSelectConversation}
        onStartChat={handleStartChat}
        onSendMessage={handleSendMessage}
      />

      <style>{`
        .rg-emergency-page {
          background:
            radial-gradient(circle at top left, rgba(239, 68, 68, 0.12), transparent 25%),
            radial-gradient(circle at top right, rgba(var(--bs-primary-rgb), 0.10), transparent 25%),
            linear-gradient(180deg, #111827 0%, #0b0f17 100%);
          color: #fff;
        }
        .rg-page-title {
          font-size: clamp(1.8rem, 3.5vw, 2.4rem);
          letter-spacing: -0.02em;
        }
        .rg-control-bar,
        .rg-emergency-panel,
        .rg-active-incident,
        .rg-list-panel {
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02)),
            rgba(15, 23, 42, 0.92) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
        }
        .rg-active-incident {
          border-color: rgba(239, 68, 68, 0.35) !important;
          box-shadow: 0 10px 28px rgba(239, 68, 68, 0.12);
        }
        .rg-map-wrap {
          background: #0a0f17;
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        .rg-map {
          width: 100%;
          height: 460px;
        }
        .rg-emergency-page .form-control,
        .rg-emergency-page .form-select {
          background: rgba(0, 0, 0, 0.3);
          border-color: rgba(255, 255, 255, 0.12);
          color: #fff;
        }
        .rg-emergency-page .form-control:focus,
        .rg-emergency-page .form-select:focus {
          background: rgba(0, 0, 0, 0.4);
          border-color: var(--bs-primary);
          box-shadow: 0 0 0 0.2rem rgba(var(--bs-primary-rgb), 0.18);
          color: #fff;
        }
        .rg-emergency-page .form-control::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }
        .rg-emergency-page .form-check-input:checked {
          background-color: var(--bs-primary);
          border-color: var(--bs-primary);
        }
        .rg-emergency-page .form-check-input:focus {
          box-shadow: 0 0 0 0.2rem rgba(var(--bs-primary-rgb), 0.25);
          border-color: var(--bs-primary);
        }
        .rg-incident-item {
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        .rg-history-item {
          background: rgba(0, 0, 0, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.04);
        }
      `}</style>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <span className="d-inline-flex align-items-center gap-2">
      <span
        className="rounded-circle d-inline-block"
        style={{ width: 10, height: 10, background: color }}
      />
      {label}
    </span>
  );
}
