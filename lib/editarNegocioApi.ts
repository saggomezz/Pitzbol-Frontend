import axios from "axios";

export async function editarNegocio({ negocioId, data, adminUid }: { negocioId: string; data: any; adminUid: string; }) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
  const res = await axios.patch(
    `${backendUrl}/admin/negocios/${negocioId}/editar`,
    { ...data, adminUid },
    { withCredentials: true }
  );
  return res.data;
}
