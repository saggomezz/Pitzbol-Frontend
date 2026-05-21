"use client";

import { useEffect, useRef } from "react";

/**
 * Layout global del panel admin.
 *
 * Escucha el evento `pitzbol:auth-expired` que dispara `fetchWithAuth` cuando
 * el JWT del admin expira y el refresh falla. Muestra un aviso al usuario y
 * lo redirige a /login conservando la ruta actual en `?next=` para volver
 * automáticamente tras autenticarse de nuevo.
 *
 * Esto centraliza el manejo de 401/sesión expirada en todo el panel admin
 * sin tener que duplicar el `try/catch` en cada botón.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const handledRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onAuthExpired = () => {
      // Evitar múltiples redirecciones si varios requests fallan a la vez.
      if (handledRef.current) return;
      handledRef.current = true;

      try {
        localStorage.removeItem("pitzbol_token");
      } catch {
        /* ignore */
      }

      try {
        alert("Tu sesión expiró. Vuelve a iniciar sesión para continuar.");
      } catch {
        /* ignore */
      }

      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?next=${next}`;
    };

    window.addEventListener("pitzbol:auth-expired", onAuthExpired);
    return () => {
      window.removeEventListener("pitzbol:auth-expired", onAuthExpired);
    };
  }, []);

  return <>{children}</>;
}
