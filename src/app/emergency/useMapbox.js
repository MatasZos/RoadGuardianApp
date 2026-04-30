//emergency feature: mapbox initialisation 

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

/**
 * Initialise the Mapbox map 
 *
 * @param status         - NextAuth session status
 * @param chatOpen       - Whether the chat sidebar is open
 * @param setError       - error setter that will show it in the UI and stop the map from loading
 * @param setFollowMode  - Setter that turns OFF "follow user" mode the momentthe user manually drags the map.
 */
export function useMapbox({ status, chatOpen, setError, setFollowMode }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const myMarkerRef = useRef(null);
  const incidentMarkersRef = useRef({});
  const riderMarkersRef = useRef({});
  // Whether the map should be in "follow user" mode
  const followModeRef = useRef(true);

  // create the map if authenticated
  useEffect(() => {
    if (status === "loading" || status === "unauthenticated") return;
    if (!mapContainerRef.current) return;

    // Set the public access token. Without it the map silently fails to load.
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!mapboxgl.accessToken) {
      setError("Missing Mapbox token (NEXT_PUBLIC_MAPBOX_TOKEN).");
      return;
    }

    // if there was an instance of an old map remove it
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Create the map. Centre defaults to Dublin
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-6.2603, 53.3498],
      zoom: 12,
    });

    // Standard zoom/rotate/compass controls in the top-right.
    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Force a resize on load 
    map.on("load", () => map.resize());

    // The instant the user drags the map, stop chasing them with the camera.
    map.on("dragstart", () => {
      followModeRef.current = false;
      setFollowMode(false);
    });

    mapRef.current = map;

    //delay for map to resize and render correctly
    const resizeTimer = setTimeout(() => map.resize(), 300);

    // Cleanup 
    return () => {
      clearTimeout(resizeTimer);
      Object.values(incidentMarkersRef.current).forEach((m) => m.remove());
      Object.values(riderMarkersRef.current).forEach((m) => m.remove());
      incidentMarkersRef.current = {};
      riderMarkersRef.current = {};
      myMarkerRef.current?.remove();
      myMarkerRef.current = null;
      if (mapRef.current?.getLayer("route")) mapRef.current.removeLayer("route");
      if (mapRef.current?.getSource("route")) mapRef.current.removeSource("route");
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [status]);

  // Resize when the chat sidebar opens/closes 
  useEffect(() => {
    if (!mapRef.current) return;
    const t = setTimeout(() => mapRef.current?.resize(), 250);
    return () => clearTimeout(t);
  }, [chatOpen]);

  return {
    mapContainerRef,
    mapRef,
    myMarkerRef,
    incidentMarkersRef,
    riderMarkersRef,
    followModeRef,
  };
}
