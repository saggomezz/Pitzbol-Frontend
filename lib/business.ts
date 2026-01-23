import axios from "axios";


export interface BusinessData {
  name: string;
  description: string;
  owner: string; // userId
  images: File[];
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
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/negocios`,
    {
      name: business.name,
      description: business.description,
      owner: business.owner,
      images: imageUrls
    }
  );
  return response.data;
}
