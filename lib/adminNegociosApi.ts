import { fetchWithAuth } from "./fetchWithAuth";
import { getBackendOrigin } from "./backendUrl";

async function extractError(res: Response): Promise<string> {
  const fallback = `Error ${res.status}`;
  try {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const data: any = await res.json();
      return (
        data?.message ||
        data?.msg ||
        data?.error ||
        (Array.isArray(data?.errors) && data.errors[0]?.msg) ||
        fallback
      );
    }
    const text = await res.text();
    return text?.trim() || fallback;
  } catch {
    return fallback;
  }
}

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
    const message = await extractError(res);
    const error: any = new Error(message);
    error.status = res.status;
    throw error;
  }
  return res.json();
}
