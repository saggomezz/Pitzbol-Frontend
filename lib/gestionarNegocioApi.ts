import { fetchWithAuth } from "./fetchWithAuth";
import { getBackendOrigin } from "./backendUrl";

export async function gestionarNegocioPendiente({
  negocioId,
  accion,
  adminUid,
  motivoRechazo,
  categoriaEspecial,
}: {
  negocioId: string;
  accion: "aprobar" | "rechazar";
  adminUid: string;
  motivoRechazo?: string;
  categoriaEspecial?: string;
}) {
  const backendUrl = getBackendOrigin();
  const res = await fetchWithAuth(
    `${backendUrl}/api/admin/negocios/gestionar`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ negocioId, accion, adminUid, motivoRechazo, categoriaEspecial }),
    }
  );
  if (!res.ok) {
    let message = `Error ${res.status}`;
    try {
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const data: any = await res.json();
        message =
          data?.message ||
          data?.msg ||
          data?.error ||
          (Array.isArray(data?.errors) && data.errors[0]?.msg) ||
          message;
      } else {
        const text = await res.text();
        if (text?.trim()) message = text.trim();
      }
    } catch {
      /* ignore */
    }
    const error: any = new Error(message);
    error.status = res.status;
    throw error;
  }
  return res.json();
}
