import axios from "axios";
import { getBackendOrigin } from "./backendUrl";

export async function editarNegocio({ negocioId, data, adminUid }: { negocioId: string; data: any; adminUid: string; }) {
  const backendUrl = getBackendOrigin();
  const res = await axios.patch(
    `${backendUrl}/api/admin/negocios/${negocioId}/editar`,
    { ...data, adminUid },
    { withCredentials: true }
  );
  return res.data;
}
