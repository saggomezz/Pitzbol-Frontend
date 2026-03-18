import axios from "axios";

export async function archivarNegocio({ negocioId, motivo, adminUid }: { negocioId: string; motivo?: string; adminUid: string; }) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
  const motivoFinal = (motivo || "").trim() || "Archivado por administrador";
  const res = await axios.post(
    `${backendUrl}/api/admin/negocios/${negocioId}/archivar`,
    { motivo: motivoFinal, adminUid },
    { withCredentials: true }
  );
  return res.data;
}
