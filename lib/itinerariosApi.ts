export interface ItinerarioGuardado {
  id: string;
  titulo: string;
  fecha: string;
  meta: { budget: number; groupSize: number; duration: string };
  stops: { nombre: string; categoria: string; direccion: string; horaLlegada: string; horaSalida: string; costo: string }[];
}

export async function getItinerariosUsuario(uid: string, role: string = 'turista'): Promise<ItinerarioGuardado[]> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('pitzbol_token') || '' : '';

    // Endpoint autenticado con JWT — ya existe en el backend, no depende de PM2 restart
    if (token) {
      const res = await fetch('/api/itinerarios/itinerarios', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      }
    }

    // Fallback: endpoint público por uid (requiere PM2 restart en VPS)
    const res = await fetch(
      `/api/auth/itinerarios?uid=${encodeURIComponent(uid)}&role=${encodeURIComponent(role)}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
