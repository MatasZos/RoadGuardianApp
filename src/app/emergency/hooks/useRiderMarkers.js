import { useEffect } from "react";
import mapboxgl from "mapbox-gl";
import { distanceKmBetween } from "../emergencyHelpers";
import { buildRiderPopupHtml } from "../emergencyPopups";

// Same marker-management pattern as incidents, but for nearby riders who
// have toggled "share my live location" on. Riders who currently have an
// active emergency get filtered out — that incident's own marker takes priority.
export function useRiderMarkers({
  mapRef,
  markersRef,
  riders,
  activeEmergencies,
  coords,
  email,
  onDrawRoute,
  onMessageUser,
}) {
  useEffect(() => {
    if (!mapRef.current) return;

    const emergencyEmails = new Set(activeEmergencies.map((e) => e.userEmail));
    const seenIds = new Set();

    riders.forEach((rider) => {
      if (!rider?.enabled || rider.userEmail === email) return;
      if (emergencyEmails.has(rider.userEmail)) return;
      if (typeof rider.lat !== "number" || typeof rider.lng !== "number") return;

      const id = String(rider._id);
      seenIds.add(id);

      const distanceKm = coords
        ? distanceKmBetween(coords, { lat: rider.lat, lng: rider.lng })
        : null;

      if (markersRef.current[id]) {
        markersRef.current[id].setLngLat([rider.lng, rider.lat]);
        return;
      }

      const popup = new mapboxgl.Popup().setHTML(
        buildRiderPopupHtml({ rider, distanceKm })
      );
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

          if (routeBtn) {
            routeBtn.onclick = () => onDrawRoute(rider.lng, rider.lat);
          }
          if (chatBtn) {
            chatBtn.onclick = () =>
              onMessageUser(
                rider.userEmail,
                "Hey, I can see you nearby on the map.",
                null
              );
          }
        }, 0)
      );

      markersRef.current[id] = marker;
    });

    Object.keys(markersRef.current).forEach((id) => {
      if (!seenIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });
  }, [riders, activeEmergencies, coords, email]);
}
