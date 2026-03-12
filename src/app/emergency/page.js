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
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  const handleEmergency = () => {
    setEmergencyCalled(true);
    setError("");

    // ✅ email from session (NOT localStorage)
    const email = session?.user?.email;
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

        // show marker on map
        if (mapRef.current) {
          if (!markerRef.current) {
            markerRef.current = new mapboxgl.Marker({ color: "#e74c3c" })
              .setLngLat([lng, lat])
              .addTo(mapRef.current);
          } else {
            markerRef.current.setLngLat([lng, lat]);
          }
          mapRef.current.flyTo({ center: [lng, lat], zoom: 15 });
        }

        // save to MongoDB via API
        const res = await fetch("/api/emergency", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userEmail: email, lat, lng }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) setError(data.error || "Could not save emergency.");
      },
      (err) => setError(err.message || "Could not get your location."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Optional loading screen while session loads
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
