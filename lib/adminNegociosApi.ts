import axios from "axios";
import { getBackendOrigin } from "./backendUrl";

export async function archivarNegocio({ negocioId, motivo, adminUid }: { negocioId: string; motivo?: string; adminUid: string; }) {
  const backendUrl = getBackendOrigin();
  const motivoFinal = (motivo || "").trim() || "Archivado por administrador";
  const res = await axios.post(
    `${backendUrl}/api/admin/negocios/${negocioId}/archivar`,
    { motivo: motivoFinal, adminUid },
    { withCredentials: true }
  );
  return res.data;
}
