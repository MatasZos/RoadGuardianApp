import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

/**
 * Initialises the Mapbox map and returns the refs that the rest of the page needs.
 * The caller is responsible for providing setError and setFollowMode.
 */
export function useMapbox({ status, chatOpen, setError, setFollowMode }) {
  const mapContainerRef    = useRef(null);
  const mapRef             = useRef(null);
  const myMarkerRef        = useRef(null);
  const incidentMarkersRef = useRef({});
  const riderMarkersRef    = useRef({});
  const followModeRef      = useRef(true);

  // Keep followModeRef in sync so map drag handler can read it synchronously
  // (caller should call setFollowMode AND pass the same value in here)
  // We expose followModeRef so the page can update it directly.

  useEffect(() => {
    if (status === "loading" || status === "unauthenticated") return;
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!mapboxgl.accessToken) {
      setError("Missing Mapbox token (NEXT_PUBLIC_MAPBOX_TOKEN).");
      return;
    }

    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }

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
      riderMarkersRef.current    = {};
      myMarkerRef.current?.remove();
      myMarkerRef.current = null;
      if (mapRef.current?.getLayer("route")) mapRef.current.removeLayer("route");
      if (mapRef.current?.getSource("route")) mapRef.current.removeSource("route");
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, [status]);

  // Resize when chat panel opens/closes
  useEffect(() => {
    if (!mapRef.current) return;
    const t = setTimeout(() => mapRef.current?.resize(), 250);
    return () => clearTimeout(t);
  }, [chatOpen]);

  return { mapContainerRef, mapRef, myMarkerRef, incidentMarkersRef, riderMarkersRef, followModeRef };
}
