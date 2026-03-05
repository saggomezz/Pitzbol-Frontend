export interface ItinerarioGuardado {
  id: string;
  titulo: string;
  fecha: string;
  meta: { budget: number; groupSize: number; duration: string };
  stops: { nombre: string; categoria: string; direccion: string; horaLlegada: string; horaSalida: string; costo: string }[];
}

export async function getItinerariosUsuario(uid: string, role: string = 'turista'): Promise<ItinerarioGuardado[]> {
  const res = await fetch(`/api/auth/itinerarios?uid=${encodeURIComponent(uid)}&role=${encodeURIComponent(role)}`);
  if (!res.ok) return [];
  return res.json();
}
