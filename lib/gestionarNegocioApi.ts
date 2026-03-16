import axios from "axios";

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
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
  const res = await axios.post(
    `${backendUrl}/api/admin/negocios/gestionar`,
    { negocioId, accion, adminUid, motivoRechazo },
    { withCredentials: true }
  );
  return res.data;
}
