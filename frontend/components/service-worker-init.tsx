'use client';
import { useEffect } from 'react';

// Registers public/sw.js once per browser. Guarded for browsers without
// service worker support (and for SSR, where `navigator` doesn't exist).
export const ServiceWorkerInit = () => {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Registration can fail (e.g. unsupported browser edge cases) — the
      // app works fine without it, this is purely an enhancement.
    });
  }, []);

  return null;
};
