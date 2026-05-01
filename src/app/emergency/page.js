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
import { isClosedStatus } from "./utils";

import { useMapbox } from "./hooks/useMapbox";
import { useGeolocation, getLiveCoords } from "./hooks/useGeolocation";
import { useMapRoute } from "./hooks/useMapRoute";
import { useIncidentMarkers } from "./hooks/useIncidentMarkers";
import { useRiderMarkers } from "./hooks/useRiderMarkers";
import { useEmergencyRealtime } from "./hooks/useEmergencyRealtime";
import { useEmergencyChat } from "./hooks/useEmergencyChat";

import EmergencyForm from "./EmergencyForm";
import ActiveIncidentCard from "./ActiveIncidentCard";
import IncidentList from "./IncidentList";
import ChatSidebar from "./ChatSidebar";

// Don't push location updates more than once every five seconds.
const LOCATION_PUSH_INTERVAL_MS = 5000;

const EMPTY_FORM = {
  reportMode: "self",
  reportedForName: "",
  type: "breakdown",
  severity: "medium",
  description: "",
  injured: false,
  bikeRideable: true,
  phone: "",
};

export default function EmergencyPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const email = session?.user?.email || null;

  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [followMode, setFollowMode] = useState(true);
  const [incidents, setIncidents] = useState([]);
  const [liveRiders, setLiveRiders] = useState([]);
  const [loadingIncidents, setLoadingIncidents] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showEmergencyForm, setShowEmergencyForm] = useState(false);
  const [shareLiveLocation, setShareLiveLocation] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const {
    mapContainerRef,
    mapRef,
    myMarkerRef,
    incidentMarkersRef,
    riderMarkersRef,
    followModeRef,
  } = useMapbox({ status, chatOpen, setError, setFollowMode });

  const hasCenteredRef = useRef(false);
  const lastEmergencyPushRef = useRef(0);
  const lastLivePushRef = useRef(0);

  const activeIncidents = useMemo(
    () => incidents.filter((i) => !isClosedStatus(i.status)),
    [incidents]
  );
  const recentHistory = useMemo(
    () => incidents.filter((i) => isClosedStatus(i.status)).slice(0, 8),
    [incidents]
  );

  // The user's own active emergency (if any). Drives the camera, the
  // active-incident banner, and the throttled location push.
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

  const { coords, setCoords } = useGeolocation({
    email,
    onPosition: ({ lat, lng }) => {
      myMarkerRef.current?.setLngLat([lng, lat]);
      if (myActiveIncident) {
        updateDrivingCamera(lat, lng);
        maybeSendEmergencyLocationUpdate(lat, lng);
      }
      maybeSendLiveLocation(lat, lng);
    },
  });

  const { updateDrivingCamera, drawRouteToUser, clearRoute } = useMapRoute({
    mapRef,
    followModeRef,
    coords,
    setCoords,
    onError: setError,
  });

  const chat = useEmergencyChat({ email, setChatOpen });

  useIncidentMarkers({
    mapRef,
    markersRef: incidentMarkersRef,
    incidents: activeIncidents,
    coords,
    email,
    onUpdateIncident: updateIncident,
    onDrawRoute: drawRouteToUser,
    onMessageUser: chat.startOrOpenConversation,
  });

  useRiderMarkers({
    mapRef,
    markersRef: riderMarkersRef,
    riders: liveRiders,
    activeIncidents,
    coords,
    email,
    onDrawRoute: drawRouteToUser,
    onMessageUser: chat.startOrOpenConversation,
  });

  useEmergencyRealtime({
    email,
    onIncidentEvent: fetchIncidents,
    onRiderEvent: fetchLiveRiders,
  });

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

  // Drop the "you are here" marker, and centre the map on first fix only.
  useEffect(() => {
    if (!mapRef.current || !coords) return;

    if (!myMarkerRef.current) {
      myMarkerRef.current = new mapboxgl.Marker({ color: "#f97316" })
        .setLngLat([coords.lng, coords.lat])
        .setPopup(
          new mapboxgl.Popup().setHTML(
            `<div style="color:#111;"><strong>${fullName || "You"}</strong>` +
              `<br/>Your live position</div>`
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

  // Sync the live-location switch state up to the server so other riders
  // see us appear/disappear from their map.
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
    chat.loadConversations();
  }, [chatOpen, email]);

  useEffect(() => {
    if (!email) return;
    fetchIncidents();
    fetchLiveRiders();
  }, [email]);

  // ── Server actions ───────────────────────────────────────────────────────

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

  async function maybeSendEmergencyLocationUpdate(lat, lng) {
    if (!myActiveIncident?.shareLiveLocation) return;
    const now = Date.now();
    if (now - lastEmergencyPushRef.current < LOCATION_PUSH_INTERVAL_MS) return;
    lastEmergencyPushRef.current = now;
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
    if (now - lastLivePushRef.current < LOCATION_PUSH_INTERVAL_MS) return;
    lastLivePushRef.current = now;
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
          const presetText =
            action === "claim-help"
              ? "I've claimed your incident and I'm helping."
              : "I'm on the way.";
          await chat.startOrOpenConversation(incident.userEmail, presetText);
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

  function handleReportClick() {
    if (!shareLiveLocation) {
      setError("You must enable live location before reporting an emergency.");
      return;
    }
    setError("");
    setShowEmergencyForm((p) => !p);
  }

  // ── Render ───────────────────────────────────────────────────────────────

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
                Report incidents, see nearby riders, and coordinate support live.
              </p>
            </div>

            <div className="d-flex flex-wrap gap-2">
              <Button
                variant="danger"
                size="lg"
                onClick={handleReportClick}
                disabled={Boolean(myActiveIncident)}
              >
                <i className="bi bi-exclamation-octagon-fill me-2"></i>
                {myActiveIncident ? "Active Emergency Exists" : "Report Emergency"}
              </Button>
              <Button variant="outline-light" onClick={clearRoute}>
                <i className="bi bi-x-lg me-2"></i>Clear Route
              </Button>
              <Button
                variant={followMode ? "success" : "outline-secondary"}
                onClick={() => setFollowMode((p) => !p)}
              >
                <i className={`bi ${followMode ? "bi-cursor-fill" : "bi-cursor"} me-2`}></i>
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
            <Alert variant="danger" dismissible onClose={() => setError("")} className="mb-0">
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
            onMessage={chat.startOrOpenConversation}
          />
        </Stack>
      </Container>

      <ChatSidebar
        open={chatOpen}
        onClose={setChatOpen}
        email={email}
        conversations={chat.conversations}
        selectedConversation={chat.selectedConversation}
        messages={chat.messages}
        chatText={chat.chatText}
        setChatText={chat.setChatText}
        newChatEmail={chat.newChatEmail}
        setNewChatEmail={chat.setNewChatEmail}
        chatLoading={chat.chatLoading}
        chatError={chat.chatError}
        onSelectConversation={chat.handleSelectConversation}
        onStartChat={chat.handleStartChat}
        onSendMessage={chat.handleSendMessage}
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
