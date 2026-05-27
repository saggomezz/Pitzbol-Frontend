"use client";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type Status = "checking" | "awake" | "waking";

interface ServerStatusContextValue {
  status: Status;
}

const ServerStatusContext = createContext<ServerStatusContextValue>({ status: "awake" });

const HEALTH_CHECK_TIMEOUT_MS = 5000;   // 5 s sin respuesta → servidor dormido
const POLL_INTERVAL_MS = 5000;          // reintentar cada 5 s mientras duerme
const PATIENCE_BEFORE_SCREEN_MS = 4000; // mostrar pantalla si no responde en 4 s

/** GET /api/health — returns 200 { ok: true } with no auth required.
 *  Qualquier respuesta 2xx = servidor despierto.
 *  Timeout / 523 / 502 / 504 = servidor dormido. */
async function pingBackend(): Promise<boolean> {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);
  try {
    const res = await fetch("/api/health", {
      method: "GET",
      signal: controller.signal,
      headers: { "Cache-Control": "no-cache" },
    });
    clearTimeout(tid);
    // 523 = Cloudflare "origin unreachable" / VPS offline
    // 502/504 = upstream caído / reiniciando
    return res.status !== 523 && res.status !== 502 && res.status !== 504;
  } catch {
    clearTimeout(tid);
    return false;
  }
}

export function ServerStatusProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("checking");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wakingTriggered = useRef(false);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollRef.current) return;
    pollRef.current = setInterval(async () => {
      const awake = await pingBackend();
      if (awake) {
        stopPolling();
        setStatus("awake");
      }
    }, POLL_INTERVAL_MS);
  }, [stopPolling]);

  const triggerWaking = useCallback(() => {
    if (!wakingTriggered.current) {
      wakingTriggered.current = true;
      setStatus("waking");
      startPolling();
    }
  }, [startPolling]);

  useEffect(() => {
    let patienceTimer: ReturnType<typeof setTimeout>;

    const doInitialCheck = async () => {
      // Mostrar pantalla si no hay respuesta en PATIENCE_BEFORE_SCREEN_MS
      patienceTimer = setTimeout(triggerWaking, PATIENCE_BEFORE_SCREEN_MS);

      const awake = await pingBackend();
      clearTimeout(patienceTimer);

      if (awake) {
        setStatus("awake");
      } else {
        triggerWaking();
      }
    };

    doInitialCheck();

    // Interceptor global: detecta 523/502/504 en CUALQUIER fetch posterior
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const res = await originalFetch(...args);
      if (res.status === 523 || res.status === 502 || res.status === 504) {
        // Solo activar si la petición va a nuestra propia API (proxy de Vercel)
        const url = typeof args[0] === "string" ? args[0] : (args[0] as Request).url;
        if (url.startsWith("/api/") || url.startsWith(window.location.origin + "/api/")) {
          triggerWaking();
        }
      } else if (
        (res.status === 200 || res.status === 401 || res.status === 403) &&
        status === "waking"
      ) {
        // Una respuesta válida significa que ya despertó
        const url = typeof args[0] === "string" ? args[0] : (args[0] as Request).url;
        if (url.startsWith("/api/") || url.startsWith(window.location.origin + "/api/")) {
          stopPolling();
          setStatus("awake");
        }
      }
      return res;
    };

    return () => {
      clearTimeout(patienceTimer);
      stopPolling();
      window.fetch = originalFetch;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ServerStatusContext.Provider value={{ status }}>
      {children}
    </ServerStatusContext.Provider>
  );
}

export const useServerStatus = () => useContext(ServerStatusContext);
