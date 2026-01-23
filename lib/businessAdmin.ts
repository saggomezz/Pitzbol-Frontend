

export interface Business {
  id: string;
  name: string;
  description: string;
  owner: string;
  images: string[];
  status: string;
  createdAt: any;
  updatedAt: any;
}

export async function getAllBusinesses(): Promise<Business[]> {
  // TODO: Reemplazar por llamada a la API REST del backend para obtener todos los negocios
  // Ejemplo:
  // const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/negocios`);
  // return await res.json();
  return [];
}

export async function getPendingBusinesses(): Promise<Business[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/negocios?status=pendiente`);
  if (!res.ok) throw new Error('Error al obtener negocios pendientes');
  return await res.json();
}
