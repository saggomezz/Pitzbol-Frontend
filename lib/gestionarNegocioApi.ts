import axios from "axios";
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
  const res = await axios.post(
    `${backendUrl}/api/admin/negocios/gestionar`,
    { negocioId, accion, adminUid, motivoRechazo, categoriaEspecial },
    { withCredentials: true }
  );
  return res.data;
}
