import { useEffect } from "react";
import { getAblyClient } from "@/lib/ablyClient";

// Listen for live updates and refresh the lists when something changes.
export function useEmergencyRealtime({ email, onEmergencyEvent, onRiderEvent }) {
  useEffect(() => {
    if (!email) return;

    const ably = getAblyClient();
    const emergencyChannel = ably.channels.get("emergencies:live");
    const riderChannel = ably.channels.get("riders:live");

    const handleEmergencyEvent = (msg) => {
      if (msg.name === "emergency-updated") onEmergencyEvent?.();
    };
    const handleRiderEvent = (msg) => {
      if (msg.name === "live-location-updated") onRiderEvent?.();
    };

    emergencyChannel.subscribe(handleEmergencyEvent);
    riderChannel.subscribe(handleRiderEvent);

    return () => {
      emergencyChannel.unsubscribe(handleEmergencyEvent);
      riderChannel.unsubscribe(handleRiderEvent);
    };
  }, [email]);
}
