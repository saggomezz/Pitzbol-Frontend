import axios from "axios";

export async function archivarNegocio({ negocioId, motivo, adminUid }: { negocioId: string; motivo: string; adminUid: string; }) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
  const res = await axios.post(
    `${backendUrl}/admin/negocios/${negocioId}/archivar`,
    { motivo, adminUid },
    { withCredentials: true }
  );
  return res.data;
}
