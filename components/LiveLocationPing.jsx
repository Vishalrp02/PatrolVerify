"use client";
import { useEffect, useRef } from "react";
import { updateGuardLocation } from "@/app/actions/location";

const PING_INTERVAL_MS = 20000; // 20 seconds

export default function LiveLocationPing({ userId }) {
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!userId || !navigator.geolocation) return;

    const sendLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          updateGuardLocation(userId, pos.coords.latitude, pos.coords.longitude);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
      );
    };

    sendLocation();
    intervalRef.current = setInterval(sendLocation, PING_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [userId]);

  return null;
}
