import axios from "axios";

export async function gestionarNegocioPendiente({ negocioId, accion, adminUid }: { negocioId: string; accion: "aprobar" | "rechazar"; adminUid: string; }) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
  const res = await axios.post(
    `${backendUrl}/admin/negocios/gestionar`,
    { negocioId, accion, adminUid },
    { withCredentials: true }
  );
  return res.data;
}
