const getBackendUrl = () => {
  const raw = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001").trim();
  return raw.replace(/\/+$/, "");
};

export interface AdminBookingPayload {
  guideId: string;
  guideName: string;
  touristId: string;
  touristName: string;
  fecha: string;
  horaInicio: string;
  duracion: "medio" | "completo";
  numPersonas: number;
  notas?: string;
  total: number;
}

export async function adminCreateBooking(payload: AdminBookingPayload, token: string) {
  const backendUrl = getBackendUrl();
  const res = await fetch(`${backendUrl}/api/admin/bookings/create`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Error al crear reserva como admin");
  }

  return data;
}
