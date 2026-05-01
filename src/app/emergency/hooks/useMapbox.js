// Boots up the Mapbox instance for the emergency page and hands back the refs
// the page needs to drop markers / draw routes.

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

const DUBLIN_CENTER = [-6.2603, 53.3498];

export function useMapbox({ status, chatOpen, setError, setFollowMode }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  // These are mutated by the marker hooks, so refs are the easiest option.
  const myMarkerRef = useRef(null);
  const emergencyMarkersRef = useRef({});
  const riderMarkersRef = useRef({});
  const followModeRef = useRef(true);

  useEffect(() => {
    if (status === "loading" || status === "unauthenticated") return;
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!mapboxgl.accessToken) {
      setError("Missing Mapbox token (NEXT_PUBLIC_MAPBOX_TOKEN).");
      return;
    }

    // If the page hot-reloads, make sure we don't leave a zombie map behind.
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: DUBLIN_CENTER,
      zoom: 12,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.on("load", () => map.resize());

    // Once the user drags manually, stop chasing them with the camera.
    map.on("dragstart", () => {
      followModeRef.current = false;
      setFollowMode(false);
    });

    mapRef.current = map;

    // First tile load can leave the canvas at the wrong size on slow connections.
    const resizeTimer = setTimeout(() => map.resize(), 300);

    return () => {
      clearTimeout(resizeTimer);

      Object.values(emergencyMarkersRef.current).forEach((marker) => marker.remove());
      Object.values(riderMarkersRef.current).forEach((marker) => marker.remove());

      emergencyMarkersRef.current = {};
      riderMarkersRef.current = {};

      myMarkerRef.current?.remove();
      myMarkerRef.current = null;

      if (mapRef.current?.getLayer("route")) mapRef.current.removeLayer("route");
      if (mapRef.current?.getSource("route")) mapRef.current.removeSource("route");

      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [status]);

  // Chat sidebar is an offcanvas — when it slides in/out the map's container
  // width changes, so we nudge Mapbox to redraw at the new size.
  useEffect(() => {
    if (!mapRef.current) return;
    const t = setTimeout(() => mapRef.current?.resize(), 250);
    return () => clearTimeout(t);
  }, [chatOpen]);

  return {
    mapContainerRef,
    mapRef,
    myMarkerRef,
    emergencyMarkersRef,
    riderMarkersRef,
    followModeRef,
  };
}
