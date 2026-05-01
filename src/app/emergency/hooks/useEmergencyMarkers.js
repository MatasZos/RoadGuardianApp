import { useEffect } from "react";
import mapboxgl from "mapbox-gl";
import { distanceKmBetween, markerColorForEmergency } from "../emergencyHelpers";
import { buildEmergencyPopupHtml } from "../emergencyPopups";

// For each active emergency, drop a Mapbox marker (or move it if it already
// exists), and wire up the action buttons embedded in its popup.
export function useEmergencyMarkers({
  mapRef,
  markersRef,
  emergencies,
  coords,
  email,
  onUpdateEmergency,
  onDrawRoute,
  onMessageUser,
}) {
  useEffect(() => {
    if (!mapRef.current) return;

    const seenIds = new Set();

    emergencies.forEach((emergency) => {
      if (typeof emergency.lat !== "number" || typeof emergency.lng !== "number") {
        return;
      }

      const id = String(emergency._id);
      const isMine = emergency.userEmail === email;
      seenIds.add(id);

      const distanceKm = coords
        ? distanceKmBetween(coords, { lat: emergency.lat, lng: emergency.lng })
        : null;

      const popupHtml = buildEmergencyPopupHtml({
        emergency,
        viewerEmail: email,
        distanceKm,
      });

      if (markersRef.current[id]) {
        const marker = markersRef.current[id];
        marker.setLngLat([emergency.lng, emergency.lat]);
        marker.getPopup()?.setHTML(popupHtml);

        const nextColour = isMine ? "#f97316" : markerColorForEmergency(emergency.status);
        const el = marker.getElement?.();
        if (el) el.style.backgroundColor = nextColour;
        return;
      }

      const popup = new mapboxgl.Popup().setHTML(popupHtml);
      const marker = new mapboxgl.Marker({
        color: isMine ? "#f97316" : markerColorForEmergency(emergency.status),
      })
        .setLngLat([emergency.lng, emergency.lat])
        .setPopup(popup)
        .addTo(mapRef.current);

      // Bind handlers after the popup actually mounts to the DOM.
      popup.on("open", () =>
        setTimeout(() => {
          const el = popup.getElement();
          if (!el) return;

          const on = (cls, fn) => {
            const btn = el.querySelector(cls);
            if (btn) btn.onclick = fn;
          };

          on(".claim-help-btn", () => onUpdateEmergency(id, "assign-helper"));
          on(".route-incident-btn", async () => {
            await onDrawRoute(emergency);
            await onUpdateEmergency(id, "on-the-way");
          });
          on(".chat-incident-btn", () =>
            onMessageUser(
              emergency.userEmail,
              "Hi, I saw your emergency. I'm nearby.",
              emergency
            )
          );
          on(".cancel-incident-btn", () =>
            onUpdateEmergency(id, "cancel-request")
          );
          on(".resolve-incident-btn", () =>
            onUpdateEmergency(id, "mark-resolved")
          );
          on(".route-started-btn", async () => {
            await onDrawRoute(emergency);
            await onUpdateEmergency(id, "on-the-way");
          });
          on(".arrived-btn", () => onUpdateEmergency(id, "mark-arrived"));
        }, 0)
      );

      markersRef.current[id] = marker;
    });

    // Garbage-collect markers for emergencies no longer in state.
    Object.keys(markersRef.current).forEach((id) => {
      if (!seenIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });
  }, [emergencies, coords, email]);
}
