// Utilidad para obtener imágenes de lugares
// Solo usa fotos guardadas manualmente en Firestore o imágenes por categoría como fallback

interface PlaceImageOptions {
  nombre: string;
  categoria: string;
  ubicacion?: string;
  latitud?: string | number;
  longitud?: string | number;
}

/**
 * Imagen por categoría (fallback cuando no hay fotos guardadas)
 */
export function getPlaceImageByCategory(categoria: string): string {
  const categoryImages: Record<string, string> = {
    "Fútbol": 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&q=80&w=800',
    "Gastronomía": 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800',
    "Arte": 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&q=80&w=800',
    "Cultura": 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=800',
    "Eventos": 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800',
    "Casas de Cambio": 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=800',
    "Hospitales": 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?auto=format&fit=crop&q=80&w=800',
    "Médico": 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&q=80&w=800',
  };
  
  return categoryImages[categoria] || categoryImages["Cultura"] || 
         'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800';
}

/**
 * Versión síncrona - usa imagen por categoría inmediatamente
 */
export function getPlaceImageUrlSync(options: PlaceImageOptions): string {
  return getPlaceImageByCategory(options.categoria);
}

/**
 * Obtiene fotos guardadas de Firestore (las que el admin agregó manualmente)
 */
async function getStoredPhotos(nombre: string): Promise<string[] | null> {
  try {
    const response = await fetch(`/api/lugares/${encodeURIComponent(nombre)}`);
    
    if (response.ok) {
      const data = await response.json();
      const fotos = data.fotos || [];
      
      if (fotos.length > 0) {
        return fotos;
      }
    }
    
    return null;
  } catch (error) {
    // Silenciar errores 404 (lugares sin fotos guardadas)
    return null;
  }
}

/**
 * Versión asíncrona - Solo usa fotos guardadas en Firestore
 * Si no hay fotos guardadas, usa imagen por categoría
 */
export async function getPlaceImageUrlWithFallback(options: PlaceImageOptions): Promise<string> {
  const { nombre, categoria } = options;
  
  // Solo buscar fotos guardadas manualmente en Firestore
  const storedPhotos = await getStoredPhotos(nombre);
  if (storedPhotos && storedPhotos.length > 0) {
    return storedPhotos[0];
  }
  
  // Fallback: imagen por categoría
  return getPlaceImageByCategory(categoria);
}
