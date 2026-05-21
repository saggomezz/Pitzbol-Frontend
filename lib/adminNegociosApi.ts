import { fetchWithAuth } from "./fetchWithAuth";
import { getBackendOrigin } from "./backendUrl";

export async function archivarNegocio({ negocioId, motivo, adminUid }: { negocioId: string; motivo?: string; adminUid: string; }) {
  const backendUrl = getBackendOrigin();
  const motivoFinal = (motivo || "").trim() || "Archivado por administrador";
  const res = await fetchWithAuth(
    `${backendUrl}/api/admin/negocios/${negocioId}/archivar`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ motivo: motivoFinal, adminUid }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.message || `Error ${res.status}`);
  }
  return res.json();
}
