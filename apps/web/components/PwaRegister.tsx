"use client";

import { useEffect } from "react";
import { getApiBaseUrl } from "@/lib/apiBase";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;

    navigator.serviceWorker.register("/sw.js").then(async (registration) => {
      if (!("PushManager" in window) || !("Notification" in window)) return;
      if (Notification.permission === "denied") return;
      const existing = await registration.pushManager.getSubscription();
      if (existing) return;
      if (Notification.permission !== "granted") return;
      const apiUrl = getApiBaseUrl();
      const publicKeyResponse = await fetch(`${apiUrl}/push/vapid-public-key`, { cache: "no-store" });
      if (!publicKeyResponse.ok) return;
      const { publicKey } = await publicKeyResponse.json();
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });
      await fetch(`${apiUrl}/push/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(subscription)
      }).catch(() => undefined);
    }).catch((error) => {
      console.warn("NODERE PWA service worker registration failed", error);
    });
  }, []);

  return null;
}

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
