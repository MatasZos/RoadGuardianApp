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
  const watchIdRef = useRef(null);
  const hasCenteredRef = useRef(false);

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
      setError("Missing Mapbox token.");
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
      mapRef.current?.remove();
    };
  }, []);

  //fallback location getter
  async function getLiveCoords() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        reject,
        { enableHighAccuracy: true }
      );
    });
  }

  //ROUTE FUNCTION
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

      const route = data.routes[0].geometry;

      const routeGeoJSON = {
        type: "Feature",
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
          paint: {
            "line-color": "#38bdf8",
            "line-width": 5,
          },
        });
      }

      const bounds = new mapboxgl.LngLatBounds();
      route.coordinates.forEach((c) => bounds.extend(c));
      mapRef.current.fitBounds(bounds, { padding: 50 });
    } catch (err) {
      setError("Could not get route.");
    }
  }

  // load other users
  useEffect(() => {
    if (!email) return;

    const fetchData = async () => {
      const res = await fetch("/api/emergency");
      const data = await res.json();

      data.emergencies.forEach((user) => {
        if (user.userEmail === email) return;

        const id = user._id;

        if (!otherMarkersRef.current[id]) {
          const popup = new mapboxgl.Popup().setHTML(`
            <div style="color:black">
              <strong>${user.userName}</strong><br/>
              <button class="route-btn" data-lng="${user.lng}" data-lat="${user.lat}">
                Route to rider
              </button>
            </div>
          `);

          const marker = new mapboxgl.Marker({ color: "blue" })
            .setLngLat([user.lng, user.lat])
            .setPopup(popup)
            .addTo(mapRef.current);

          popup.on("open", () => {
            setTimeout(() => {
              const btn = document.querySelector(".route-btn");
              if (!btn) return;

              btn.onclick = () => {
                drawRouteToUser(
                  Number(btn.dataset.lng),
                  Number(btn.dataset.lat)
                );
              };
            }, 0);
          });

          otherMarkersRef.current[id] = marker;
        }
      });
    };

    fetchData();
    const i = setInterval(fetchData, 5000);
    return () => clearInterval(i);
  }, [email, coords]);

  const handleEmergency = async () => {
    setEmergencyCalled(true);

    let start = coords;

    if (!start) {
      start = await getLiveCoords();
      setCoords(start);
    }

    const { lat, lng } = start;

    if (!markerRef.current) {
      markerRef.current = new mapboxgl.Marker({ color: "red" })
        .setLngLat([lng, lat])
        .addTo(mapRef.current);
    } else {
      markerRef.current.setLngLat([lng, lat]);
    }

    if (!hasCenteredRef.current) {
      mapRef.current.flyTo({ center: [lng, lat], zoom: 15 });
      hasCenteredRef.current = true;
    }

    await fetch("/api/emergency", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lat, lng }),
    });
  };

  if (status === "loading") return <div>Loading...</div>;

  return (
    <div style={{ background: "#111", color: "#fff", minHeight: "100vh" }}>
      <Navbar />

      <div style={{ padding: 20 }}>
        <h1>Emergency Page</h1>

        <div ref={mapContainerRef} style={{ height: 400 }} />

        {error && <p>{error}</p>}

        <button onClick={handleEmergency}>Call for Help</button>
      </div>
    </div>
  );
}
