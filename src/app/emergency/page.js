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

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const otherMarkersRef = useRef({});

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    setFullName(session?.user?.name || "");
  }, [status, session, router]);

  // init map once
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
      center: [-6.2603, 53.3498], // Dublin default
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

  // poll active emergencies and show other users
  useEffect(() => {
    if (!mapRef.current || !session?.user?.email) return;

    const fetchEmergencies = async () => {
      try {
        const res = await fetch("/api/emergency", { cache: "no-store" });
        const data = await res.json();

        if (!res.ok) return;

        const users = data.emergencies || [];
        const myEmail = session.user.email;
        const seen = new Set();

        users.forEach((user) => {
          if (!user?._id) return;
          if (user.userEmail === myEmail) return;
          if (typeof user.lat !== "number" || typeof user.lng !== "number") return;

          const id = user._id.toString();
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
  }, [session]);

  const handleEmergency = () => {
    setEmergencyCalled(true);
    setError("");

    if (!session?.user) {
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

        // show your marker on map
        if (mapRef.current) {
          if (!markerRef.current) {
            markerRef.current = new mapboxgl.Marker({ color: "#e74c3c" })
              .setLngLat([lng, lat])
              .setPopup(
                new mapboxgl.Popup().setHTML(
                  `<strong>${fullName || session?.user?.name || "You"}</strong><br/>Your emergency location`
                )
              )
              .addTo(mapRef.current);
          } else {
            markerRef.current.setLngLat([lng, lat]);
          }

          mapRef.current.flyTo({ center: [lng, lat], zoom: 15 });
        }

        // save to MongoDB via API using session on backend
        const res = await fetch("/api/emergency", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat, lng }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error || "Could not save emergency.");
        }
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
      }}
    >
      <Navbar themeColor="#e74c3c" />

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
          <div ref={mapContainerRef} style={{ width: "100%", height: "320px" }} />
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
    </div>
  );
}
