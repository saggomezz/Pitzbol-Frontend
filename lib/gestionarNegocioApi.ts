import axios from "axios";
import { getBackendOrigin } from "./backendUrl";

export async function gestionarNegocioPendiente({
  negocioId,
  accion,
  adminUid,
  motivoRechazo,
}: {
  negocioId: string;
  accion: "aprobar" | "rechazar";
  adminUid: string;
  motivoRechazo?: string;
}) {
  const backendUrl = getBackendOrigin();
  const res = await axios.post(
    `${backendUrl}/api/admin/negocios/gestionar`,
    { negocioId, accion, adminUid, motivoRechazo },
    { withCredentials: true }
  );
  return res.data;
}
