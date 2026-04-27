import axios from "axios";


export interface BusinessData {
  name: string;
  description: string;
  owner: string; // userId
  images: File[];
  logo: File;
  email: string;
  password: string;
  rfc: string;
  cp: string;
  category?: string;
  phone?: string;
  location?: string;
  website?: string;
  schedule?: Record<string, { apertura: string; cierre: string } | "cerrado">;
}

export async function uploadImagesToCloudinary(files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_PRESET!);
    // Guardar en carpeta negocios/pendientes
    formData.append("folder", "negocios/pendientes");
    const res = await axios.post(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD!}/upload`,
      formData
    );
    urls.push(res.data.secure_url);
  }
  return urls;
}


export async function createBusiness(business: BusinessData) {
  // Enviar formulario como multipart/form-data al backend
  const formData = new FormData();
  formData.append('email', business.email);
  formData.append('password', business.password);
  formData.append('businessName', business.name);
  if (business.category) formData.append('category', business.category);
  if (business.phone) formData.append('phone', business.phone);
  if (business.location) formData.append('location', business.location);
  if (business.website) formData.append('website', business.website);
  formData.append('rfc', business.rfc);
  formData.append('cp', business.cp);
  formData.append('description', business.description);
  formData.append('owner', business.owner);
  if (business.schedule) formData.append('schedule', JSON.stringify(business.schedule));
  if (business.logo) {
    formData.append('logo', business.logo);
  }
  for (const img of business.images) {
    formData.append('images', img);
  }
  const response = await axios.post(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/business/register-with-images`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
}
