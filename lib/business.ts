import axios from "axios";


export interface BusinessData {
  name: string;
  description: string;
  owner: string; // userId
  images: File[];
  email: string;
  password: string;
  rfc: string;
  cp: string;
  category?: string;
  phone?: string;
  location?: string;
  website?: string;
}

export async function uploadImagesToCloudinary(files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_PRESET!);
    const res = await axios.post(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD!}/upload`,
      formData
    );
    urls.push(res.data.secure_url);
  }
  return urls;
}


export async function createBusiness(business: BusinessData) {
  // 1. Subir imágenes a Cloudinary
  const imageUrls = await uploadImagesToCloudinary(business.images);
  // 2. Guardar negocio usando la API REST del backend
  const response = await axios.post(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/business/register`,
    {
      email: business.email,
      password: business.password,
      businessName: business.name,
      category: business.category,
      phone: business.phone,
      location: business.location,
      website: business.website,
      rfc: business.rfc,
      cp: business.cp,
      images: imageUrls,
      description: business.description,
      owner: business.owner
    }
  );
  return response.data;
}
