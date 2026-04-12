"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Navbar from "../components/Navbar";
import { getAblyClient } from "../../lib/ablyClient";

import { isClosedStatus, haversineKm, markerColorForIncident, popupBtnStyle, prettify, formatTime } from "./utils";
import { STATUS_LABELS } from "./constants";
import { useMapbox } from "./useMapbox";
import s from "./emergency.module.css";

import EmergencyForm      from "./EmergencyForm";
import ActiveIncidentCard from "./ActiveIncidentCard";
import IncidentList       from "./IncidentList";
import ChatSidebar        from "./ChatSidebar";

export default function EmergencyPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const email = session?.user?.email || null;

  const [fullName,                setFullName]                = useState("");
  const [error,                   setError]                   = useState("");
  const [coords,                  setCoords]                  = useState(null);
  const [followMode,              setFollowMode]              = useState(true);
  const [incidents,               setIncidents]               = useState([]);
  const [liveRiders,              setLiveRiders]              = useState([]);
  const [loadingIncidents,        setLoadingIncidents]        = useState(false);
  const [submitLoading,           setSubmitLoading]           = useState(false);
  const [selectedIncidentContext, setSelectedIncidentContext] = useState(null);
  const [showEmergencyForm,       setShowEmergencyForm]       = useState(false);
  const [shareLiveLocation,       setShareLiveLocation]       = useState(false);

  const [form, setForm] = useState({
    reportMode: "self", reportedForName: "", type: "breakdown",
    severity: "medium", description: "", injured: false, bikeRideable: true, phone: "",
  });

  const [chatOpen,             setChatOpen]             = useState(false);
  const [conversations,        setConversations]        = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages,             setMessages]             = useState([]);
  const [chatText,             setChatText]             = useState("");
  const [newChatEmail,         setNewChatEmail]         = useState("");
  const [chatLoading,          setChatLoading]          = useState(false);
  const [chatError,            setChatError]            = useState("");

  const { mapContainerRef, mapRef, myMarkerRef, incidentMarkersRef, riderMarkersRef, followModeRef } =
    useMapbox({ status, chatOpen, setError, setFollowMode });

  const hasCenteredRef                 = useRef(false);
  const lastCoordsRef                  = useRef(null);
  const watchIdRef                     = useRef(null);
  const lastEmergencyLocationUpdateRef = useRef(0);
  const lastRiderLocationUpdateRef     = useRef(0);
  const ablyRef                        = useRef(null);
  const emergenciesSubscriptionRef     = useRef(null);
  const ridersSubscriptionRef          = useRef(null);
  const conversationSubscriptionRef    = useRef(null);

  const myActiveIncident = useMemo(() =>
    incidents.find((i) => i.userEmail === email && i.reportMode === "self" && !isClosedStatus(i.status)),
    [incidents, email]);
  const activeIncidents = useMemo(() => incidents.filter((i) => !isClosedStatus(i.status)), [incidents]);
  const recentHistory   = useMemo(() => incidents.filter((i) => isClosedStatus(i.status)).slice(0, 8), [incidents]);

  useEffect(() => { followModeRef.current = followMode; }, [followMode]);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") { router.push("/login"); return; }
    setFullName(session?.user?.name || "");
  }, [status, session, router]);

  useEffect(() => {
    if (!email || !("geolocation" in navigator) || watchIdRef.current !== null) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCoords({ lat, lng });
        myMarkerRef.current?.setLngLat([lng, lat]);
        if (myActiveIncident) { updateDrivingCamera(lat, lng); maybeSendEmergencyLocationUpdate(lat, lng); }
        maybeSendLiveLocation(lat, lng);
      },
      (err) => console.error("Location watch error:", err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
    return () => { if (watchIdRef.current !== null) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; } };
  }, [email, myActiveIncident, shareLiveLocation]);

  useEffect(() => {
    if (!mapRef.current || !coords) return;
    if (!myMarkerRef.current) {
      myMarkerRef.current = new mapboxgl.Marker({ color: "#f97316" })
        .setLngLat([coords.lng, coords.lat])
        .setPopup(new mapboxgl.Popup().setHTML(`<div style="color:#111"><strong>${fullName || "You"}</strong><br/>Your live position</div>`))
        .addTo(mapRef.current);
    } else {
      myMarkerRef.current.setLngLat([coords.lng, coords.lat]);
    }
    if (!hasCenteredRef.current) {
      mapRef.current.jumpTo({ center: [coords.lng, coords.lat], zoom: 15.5, pitch: 40, bearing: 0 });
      hasCenteredRef.current = true;
    }
  }, [coords, fullName]);

  useEffect(() => {
    if (!mapRef.current) return;
    const seenIds = new Set();
    activeIncidents.forEach((incident) => {
      if (typeof incident.lat !== "number" || typeof incident.lng !== "number") return;
      const id    = String(incident._id);
      const isMine = incident.userEmail === email;
      seenIds.add(id);
      const distanceKm = coords ? haversineKm(coords, { lat: incident.lat, lng: incident.lng }) : null;

      const helperActions = !isMine ? `
        <button class="claim-help-btn"     data-id="${id}" style="${popupBtnStyle("#16a34a")}">Offer help</button>
        <button class="route-incident-btn" data-id="${id}" data-lng="${incident.lng}" data-lat="${incident.lat}" style="${popupBtnStyle("#2563eb")}">Route there</button>
        <button class="chat-incident-btn"  data-id="${id}" data-email="${incident.userEmail}" style="${popupBtnStyle("#7c3aed")}">Message rider</button>
      ` : `
        <button class="cancel-incident-btn"  data-id="${id}" style="${popupBtnStyle("#dc2626")}">Cancel</button>
        <button class="resolve-incident-btn" data-id="${id}" style="${popupBtnStyle("#16a34a")}">Mark resolved</button>
      `;
      const helperControls = incident.helperUserEmail === email ? `
        <button class="route-started-btn"   data-id="${id}" style="${popupBtnStyle("#0ea5e9")}">I'm on the way</button>
        <button class="arrived-btn"         data-id="${id}" style="${popupBtnStyle("#f59e0b")}">Mark arrived</button>
        <button class="resolve-incident-btn" data-id="${id}" style="${popupBtnStyle("#16a34a")}">Resolve</button>
      ` : "";

      const popupHtml = `<div style="color:#111;min-width:240px;line-height:1.5;font-family:system-ui">
        <div style="font-weight:800;font-size:15px;margin-bottom:6px">${incident.userName || "Rider"} · ${prettify(incident.type)}</div>
        <div><strong>Status:</strong> ${STATUS_LABELS[incident.status] || incident.status}</div>
        <div><strong>Severity:</strong> ${prettify(incident.severity)}</div>
        <div><strong>Injured:</strong> ${incident.injured ? "Yes" : "No"}</div>
        <div><strong>Phone:</strong> ${incident.phone || "—"}</div>
        <div><strong>Distance:</strong> ${distanceKm == null ? "—" : `${distanceKm.toFixed(1)} km`}</div>
        ${incident.description ? `<div style="margin-top:8px"><strong>Note:</strong> ${incident.description}</div>` : ""}
        <div style="display:grid;gap:6px;margin-top:12px">${helperActions}${helperControls}</div>
      </div>`;

      if (!incidentMarkersRef.current[id]) {
        const popup = new mapboxgl.Popup().setHTML(popupHtml);
        const marker = new mapboxgl.Marker({ color: isMine ? "#f97316" : markerColorForIncident(incident.status) })
          .setLngLat([incident.lng, incident.lat]).setPopup(popup).addTo(mapRef.current);

        popup.on("open", () => setTimeout(() => {
          const el = popup.getElement();
          if (!el) return;
          const on = (cls, fn) => { const btn = el.querySelector(cls); if (btn) btn.onclick = fn; };
          on(".claim-help-btn",     async () => await updateIncident(id, "claim-help"));
          on(".route-incident-btn", async () => { await drawRouteToUser(incident.lng, incident.lat); await updateIncident(id, "route-started"); });
          on(".chat-incident-btn",  async () => await startOrOpenConversation(incident.userEmail, "Hi, I saw your emergency. I'm nearby.", incident));
          on(".cancel-incident-btn",  async () => await updateIncident(id, "cancel"));
          on(".resolve-incident-btn", async () => await updateIncident(id, "resolve"));
          on(".route-started-btn",  async () => { await drawRouteToUser(incident.lng, incident.lat); await updateIncident(id, "route-started"); });
          on(".arrived-btn",        async () => await updateIncident(id, "arrived"));
        }, 0));
        incidentMarkersRef.current[id] = marker;
      } else {
        incidentMarkersRef.current[id].setLngLat([incident.lng, incident.lat]);
      }
    });
    Object.keys(incidentMarkersRef.current).forEach((id) => {
      if (!seenIds.has(id)) { incidentMarkersRef.current[id].remove(); delete incidentMarkersRef.current[id]; }
    });
  }, [activeIncidents, coords, email, conversations]);

  useEffect(() => {
    if (!mapRef.current) return;
    const activeEmails = new Set(activeIncidents.map((i) => i.userEmail));
    const seenIds = new Set();
    liveRiders.forEach((rider) => {
      if (!rider?.enabled || rider.userEmail === email || activeEmails.has(rider.userEmail)) return;
      if (typeof rider.lat !== "number" || typeof rider.lng !== "number") return;
      const id = String(rider._id);
      seenIds.add(id);
      const distanceKm = coords ? haversineKm(coords, { lat: rider.lat, lng: rider.lng }) : null;
      const popupHtml = `<div style="color:#111;min-width:200px;line-height:1.5;font-family:system-ui">
        <div style="font-weight:800;margin-bottom:6px">${rider.userName || "Rider"}</div>
        <div><strong>Distance:</strong> ${distanceKm == null ? "—" : `${distanceKm.toFixed(1)} km`}</div>
        <div style="display:grid;gap:6px;margin-top:10px">
          <button class="route-rider-btn" data-id="${id}" style="${popupBtnStyle("#2563eb")}">Route to rider</button>
          <button class="chat-rider-btn"  data-id="${id}" data-email="${rider.userEmail}" style="${popupBtnStyle("#7c3aed")}">Message rider</button>
        </div>
      </div>`;
      if (!riderMarkersRef.current[id]) {
        const popup = new mapboxgl.Popup().setHTML(popupHtml);
        const marker = new mapboxgl.Marker({ color: "#3b82f6" })
          .setLngLat([rider.lng, rider.lat]).setPopup(popup).addTo(mapRef.current);
        popup.on("open", () => setTimeout(() => {
          const el = popup.getElement();
          if (!el) return;
          const rb = el.querySelector(".route-rider-btn");
          const cb = el.querySelector(".chat-rider-btn");
          if (rb) rb.onclick = async () => await drawRouteToUser(rider.lng, rider.lat);
          if (cb) cb.onclick = async () => await startOrOpenConversation(rider.userEmail, "Hey, I can see you nearby.", null);
        }, 0));
        riderMarkersRef.current[id] = marker;
      } else { riderMarkersRef.current[id].setLngLat([rider.lng, rider.lat]); }
    });
    Object.keys(riderMarkersRef.current).forEach((id) => {
      if (!seenIds.has(id)) { riderMarkersRef.current[id].remove(); delete riderMarkersRef.current[id]; }
    });
  }, [liveRiders, coords, email, activeIncidents, conversations]);

  useEffect(() => {
    if (!email) return;
    const ably = getAblyClient();
    const ec = ably.channels.get("emergencies:live");
    const rc = ably.channels.get("riders:live");
    const eh = async (msg) => { if (msg.name === "emergency-updated") await fetchIncidents(); };
    const rh = async (msg) => { if (msg.name === "live-location-updated") await fetchLiveRiders(); };
    emergenciesSubscriptionRef.current = eh;
    ridersSubscriptionRef.current      = rh;
    ec.subscribe(eh); rc.subscribe(rh);
    return () => { ec.unsubscribe(eh); rc.unsubscribe(rh); };
  }, [email]);

  useEffect(() => {
    if (!email) return;
    const ably = getAblyClient();
    ablyRef.current = ably;
    const uc = ably.channels.get(`user:${email}`);
    const h = async (msg) => {
      if (msg?.name === "conversation-updated" || msg?.name === "new-conversation") await loadConversations();
    };
    uc.subscribe(h);
    return () => uc.unsubscribe(h);
  }, [email]);

  useEffect(() => {
    if (!selectedConversation?._id || !email) return;
    const ably = ablyRef.current || getAblyClient();
    const ch = ably.channels.get(`conversation:${selectedConversation._id}`);
    const h = async (msg) => {
      if (msg?.name === "new-message") { await loadMessages(selectedConversation._id); await loadConversations(); }
    };
    conversationSubscriptionRef.current = h;
    ch.subscribe(h);
    return () => ch.unsubscribe(h);
  }, [selectedConversation?._id, email]);

  useEffect(() => {
    if (!email || !coords) return;
    fetch("/api/live-location", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lat: coords.lat, lng: coords.lng, enabled: shareLiveLocation }) }).catch(console.error);
  }, [shareLiveLocation, email, coords]);

  useEffect(() => { if (chatOpen && email) loadConversations(); }, [chatOpen, email]);
  useEffect(() => { if (email) { fetchIncidents(); fetchLiveRiders(); } }, [email]);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function getLiveCoords() {
    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) { reject(new Error("Geolocation not supported.")); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        reject, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }

  function getBearing(from, to) {
    const toRad = (d) => (d * Math.PI) / 180;
    const toDeg = (r) => (r * 180) / Math.PI;
    const y = Math.sin(toRad(to.lng) - toRad(from.lng)) * Math.cos(toRad(to.lat));
    const x = Math.cos(toRad(from.lat)) * Math.sin(toRad(to.lat)) - Math.sin(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.cos(toRad(to.lng) - toRad(from.lng));
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
  }

  function updateDrivingCamera(lat, lng) {
    if (!mapRef.current || !followModeRef.current) return;
    const bearing = lastCoordsRef.current ? getBearing(lastCoordsRef.current, { lat, lng }) : mapRef.current.getBearing();
    mapRef.current.easeTo({ center: [lng, lat], zoom: 16.8, pitch: 65, bearing, duration: 800, offset: [0, 170], essential: true });
    lastCoordsRef.current = { lat, lng };
  }

  async function drawRouteToUser(targetLng, targetLat) {
    if (!mapRef.current) return;
    try {
      let start = coords;
      if (!start?.lat || !start?.lng) { start = await getLiveCoords(); setCoords(start); }
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      const res   = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${start.lng},${start.lat};${targetLng},${targetLat}?geometries=geojson&overview=full&access_token=${token}`);
      const data  = await res.json();
      const route = data?.routes?.[0]?.geometry;
      if (!route) { setError("Could not generate route."); return; }
      const geoJSON = { type: "Feature", properties: {}, geometry: route };
      if (mapRef.current.getSource("route")) {
        mapRef.current.getSource("route").setData(geoJSON);
      } else {
        mapRef.current.addSource("route", { type: "geojson", data: geoJSON });
        mapRef.current.addLayer({ id: "route", type: "line", source: "route", layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": "#38bdf8", "line-width": 5, "line-opacity": 0.9 } });
      }
      const bounds = new mapboxgl.LngLatBounds();
      route.coordinates.forEach((c) => bounds.extend(c));
      mapRef.current.fitBounds(bounds, { padding: 55 });
    } catch (err) { setError(err.message || "Could not get location."); }
  }

  function clearRoute() {
    if (!mapRef.current) return;
    if (mapRef.current.getLayer("route")) mapRef.current.removeLayer("route");
    if (mapRef.current.getSource("route")) mapRef.current.removeSource("route");
  }

  async function fetchIncidents() {
    setLoadingIncidents(true);
    try {
      const res  = await fetch("/api/emergency", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data?.error || "Failed to fetch emergencies."); return; }
      setIncidents(Array.isArray(data.emergencies) ? data.emergencies : []);
    } catch { setError("Failed to fetch emergencies."); }
    finally { setLoadingIncidents(false); }
  }

  async function fetchLiveRiders() {
    try {
      const res  = await fetch("/api/live-location", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setLiveRiders(Array.isArray(data.riders) ? data.riders : []);
    } catch (err) { console.error(err); }
  }

  async function maybeSendEmergencyLocationUpdate(lat, lng) {
    if (!myActiveIncident?.shareLiveLocation) return;
    const now = Date.now();
    if (now - lastEmergencyLocationUpdateRef.current < 5000) return;
    lastEmergencyLocationUpdateRef.current = now;
    try { await fetch("/api/emergency", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ emergencyId: myActiveIncident._id, action: "update-location", lat, lng }) }); }
    catch (err) { console.error(err); }
  }

  async function maybeSendLiveLocation(lat, lng) {
    if (!shareLiveLocation || !email) return;
    const now = Date.now();
    if (now - lastRiderLocationUpdateRef.current < 5000) return;
    lastRiderLocationUpdateRef.current = now;
    try { await fetch("/api/live-location", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lat, lng, enabled: true }) }); }
    catch (err) { console.error(err); }
  }

  async function updateIncident(emergencyId, action) {
    try {
      const res  = await fetch("/api/emergency", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ emergencyId, action }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "Failed to update."); return; }
      await fetchIncidents();
      if (action === "claim-help" || action === "route-started") {
        setChatOpen(true);
        const incident = data?.emergency;
        if (incident?.userEmail) await startOrOpenConversation(incident.userEmail, action === "claim-help" ? "I've claimed your incident and I'm helping." : "I'm on the way.", incident);
      }
      if (action === "resolve" || action === "cancel") clearRoute();
    } catch { setError("Failed to update incident."); }
  }

  async function handleCreateEmergency() {
    setSubmitLoading(true);
    setError("");
    if (!shareLiveLocation) { setError("Enable live location first."); setSubmitLoading(false); return; }
    try {
      let c = coords;
      if (!c?.lat || !c?.lng) { c = await getLiveCoords(); setCoords(c); }
      const res  = await fetch("/api/emergency", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lat: c.lat, lng: c.lng, ...form, shareLiveLocation: true }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "Could not create emergency."); return; }
      setShowEmergencyForm(false);
      await fetchIncidents();
    } catch { setError("Could not create emergency."); }
    finally { setSubmitLoading(false); }
  }

  async function loadConversations() {
    if (!email) return;
    const res  = await fetch("/api/conversations", { headers: { "x-user-email": email }, cache: "no-store" });
    const data = await res.json().catch(() => []);
    setConversations(Array.isArray(data) ? data : []);
  }

  async function loadMessages(conversationId) {
    if (!email || !conversationId) return;
    const res  = await fetch(`/api/messages?conversationId=${encodeURIComponent(conversationId)}`, { headers: { "x-user-email": email }, cache: "no-store" });
    const data = await res.json().catch(() => []);
    setMessages(Array.isArray(data) ? data : []);
  }

  async function startOrOpenConversation(otherUserEmail, presetText = "", incident = null) {
    if (!email || !otherUserEmail) return;
    const lower = otherUserEmail.trim().toLowerCase();
    if (!lower || lower === email) return;
    setChatOpen(true); setChatError("");
    let conversation = conversations.find((c) => c.participants?.includes(lower)) || null;
    if (!conversation) {
      const res  = await fetch("/api/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userEmail: email, otherUserEmail: lower }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setChatError(data.error || "Could not start chat."); return; }
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
    const other = newChatEmail.trim().toLowerCase();
    if (!email || !other) { setChatError("Enter an email to start a chat."); return; }
    if (other === email) { setChatError("You cannot message yourself."); return; }
    const res  = await fetch("/api/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userEmail: email, otherUserEmail: other }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setChatError(data.error || "Could not start chat."); return; }
    await loadConversations();
    setSelectedConversation(data);
    setNewChatEmail("");
    await loadMessages(String(data._id));
    try {
      const ably = ablyRef.current || getAblyClient();
      await ably.channels.get(`user:${other}`).publish("new-conversation", { conversationId: String(data._id), with: email });
      await ably.channels.get(`user:${email}`).publish("conversation-updated", { conversationId: String(data._id) });
    } catch (err) { console.error(err); }
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
    if (!otherUser) { setChatError("Could not determine recipient."); return; }
    setChatLoading(true); setChatError("");
    const res  = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: String(selectedConversation._id), senderEmail: email, receiverEmail: otherUser, text }) });
    const data = await res.json().catch(() => ({}));
    setChatLoading(false);
    if (!res.ok) { setChatError(data.error || "Could not send."); return; }
    setChatText("");
    await loadConversations();
    await loadMessages(String(selectedConversation._id));
    try {
      const ably = ablyRef.current || getAblyClient();
      await ably.channels.get(`conversation:${selectedConversation._id}`).publish("new-message", { conversationId: String(selectedConversation._id), senderEmail: email, receiverEmail: otherUser, text });
      await ably.channels.get(`user:${email}`).publish("conversation-updated", { conversationId: String(selectedConversation._id) });
      await ably.channels.get(`user:${otherUser}`).publish("conversation-updated", { conversationId: String(selectedConversation._id) });
    } catch (err) { console.error(err); }
  }

  if (status === "loading") return <div className={s.loading}>Initialising ops…</div>;

  return (
    <div className={s.root}>
      <Navbar />
      <div className={s.container}>

        {/* Header */}
        <div className={s.header}>
          <div className={s.headerLeft}>
            <p className={s.eyebrow}>RoadGuardian · Live Ops</p>
            <h1 className={s.pageTitle}>Emergency Hub</h1>
            <p className={s.pageSub}>Report incidents, coordinate support, and track nearby riders in real time.</p>
          </div>

          <div className={s.headerBtns}>
            <button
              className={s.btnEmergency}
              onClick={() => {
                if (!shareLiveLocation) { setError("Enable live location first."); return; }
                setError("");
                setShowEmergencyForm((p) => !p);
              }}
              disabled={Boolean(myActiveIncident)}
            >
              {myActiveIncident ? "Active Emergency" : "Report Emergency"}
            </button>

            <button className={s.btnSecondary} onClick={clearRoute}>Clear Route</button>

            <button
              className={s.btnFollow}
              onClick={() => setFollowMode((p) => !p)}
              style={{
                background: followMode ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${followMode ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.08)"}`,
                color: followMode ? "#4ade80" : "#475569",
              }}
            >
              {followMode ? "Following" : "Follow Off"}
            </button>
          </div>
        </div>

        {/* Controls bar */}
        <div className={s.controlBar}>
          <label className={s.liveToggle}>
            <input type="checkbox" checked={shareLiveLocation} onChange={(e) => setShareLiveLocation(e.target.checked)} />
            Enable live location for emergency reporting
          </label>

          <div className={s.legend}>
            <span><span className={s.legendDot} style={{ background: "#ef4444" }} />Emergency</span>
            <span><span className={s.legendDot} style={{ background: "#3b82f6" }} />Nearby rider</span>
            <span><span className={s.legendDot} style={{ background: "#22c55e" }} />Responding</span>
            <span><span className={s.legendDot} style={{ background: "#6b7280", animationDuration: "4s" }} />Resolved</span>
          </div>
        </div>

        {/* Map */}
        <div className={s.mapWrap}>
          <div ref={mapContainerRef} className={s.map} />
        </div>

        {error && <div className={s.errorBar}>{error}</div>}

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

      </div>

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
    </div>
  );
}
