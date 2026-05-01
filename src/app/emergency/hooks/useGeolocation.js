import { useEffect, useRef, useState } from "react";

const HIGH_ACCURACY_OPTS = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

// Subscribes to the browser's geolocation watch and surfaces the latest
// coords as React state. The `onPosition` callback fires on every fix and is
// stored in a ref so the watch doesn't have to re-register every time the
// callback closure changes.
export function useGeolocation({ email, onPosition }) {
  const [coords, setCoords] = useState(null);
  const watchIdRef = useRef(null);
  const onPositionRef = useRef(onPosition);

  useEffect(() => {
    onPositionRef.current = onPosition;
  });

  useEffect(() => {
    if (!email || !("geolocation" in navigator)) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const point = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(point);
        onPositionRef.current?.(point);
      },
      (err) => console.error("Location watch error:", err),
      HIGH_ACCURACY_OPTS
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [email]);

  return { coords, setCoords };
}

// One-shot reading of the current position. Used when the user fires off an
// action that needs coords *now* (e.g. submitting a new emergency before the
// watcher has produced its first fix).
export function getLiveCoords() {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation not supported."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      reject,
      HIGH_ACCURACY_OPTS
    );
  });
}
