import { useEffect } from "react";
import { getAblyClient } from "@/lib/ablyClient";

// Subscribes to the two global Ably channels that drive the live map:
//   - "emergencies:live"  — fires whenever any incident is created/updated
//   - "riders:live"       — fires whenever a rider's broadcast position moves
// On either event the page re-fetches the relevant list.
export function useEmergencyRealtime({ email, onIncidentEvent, onRiderEvent }) {
  useEffect(() => {
    if (!email) return;

    const ably = getAblyClient();
    const emergencies = ably.channels.get("emergencies:live");
    const riders = ably.channels.get("riders:live");

    const incidentHandler = (msg) => {
      if (msg.name === "emergency-updated") onIncidentEvent?.();
    };
    const riderHandler = (msg) => {
      if (msg.name === "live-location-updated") onRiderEvent?.();
    };

    emergencies.subscribe(incidentHandler);
    riders.subscribe(riderHandler);

    return () => {
      emergencies.unsubscribe(incidentHandler);
      riders.unsubscribe(riderHandler);
    };
  }, [email]);
}
