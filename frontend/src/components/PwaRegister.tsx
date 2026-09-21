"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[VidhiScan PWA] ServiceWorker registered with scope:", registration.scope);
        })
        .catch((error) => {
          console.warn("[VidhiScan PWA] ServiceWorker registration failed:", error);
        });
    }
  }, []);

  return null;
}
