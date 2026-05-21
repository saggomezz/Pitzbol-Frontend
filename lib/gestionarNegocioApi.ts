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
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.message || `Error ${res.status}`);
  }
  return res.json();
}
