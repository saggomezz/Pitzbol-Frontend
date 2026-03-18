import Papa from "papaparse";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export interface PlaceRecord {
  nombre: string;
  categoria: string;
  rawCategoria: string;
  subcategoria?: string;
  descripcion: string;
  ubicacion: string;
  latitud: string;
  longitud: string;
  fotos: string[];
  rating: number;
  views: number;
}

interface FirestorePlace {
  nombre?: string;
  categoria?: string;
  descripcion?: string;
  ubicacion?: string;
  latitud?: string;
  longitud?: string;
  fotos?: string[];
  rating?: number | string;
  views?: number | string;
}

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const normalized = String(value).replace(",", ".").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function fallbackRating(name: string): number {
  // Sin ratings reales, devolver 0
  return 0;
}

function fallbackViews(name: string): number {
  // Sin vistas reales, devolver 0
  return 0;
}

export function getPopularityScore(place: PlaceRecord): number {
  return place.rating * 100 + Math.log10(place.views + 1) * 25;
}

function normalizeCategory(categoria: string): string {
  return categoria.split(",")[0]?.trim() || "";
}

function parseCsvPlaces(csvText: string): PlaceRecord[] {
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  return (parsed.data as any[])
    .filter((row) => row && row["Nombre del Lugar"])
    .map((row) => ({
      nombre: String(row["Nombre del Lugar"] || "").trim(),
      rawCategoria: String(row["Categoría"] || "").trim(),
      categoria: normalizeCategory(String(row["Categoría"] || "").trim()),
      subcategoria: String(row["Subcategoría"] || "").trim() || undefined,
      descripcion: String(row["Nota para IA"] || "").trim(),
      ubicacion: String(row["Dirección"] || "").trim(),
      latitud: String(row["Latitud"] || "").replace(",", ".").trim(),
      longitud: String(row["Longitud"] || "").replace(",", ".").trim(),
      fotos: [],
      rating:
        parseNumber(row["Rating"]) ??
        parseNumber(row["Calificación"]) ??
        parseNumber(row["Calificacion"]) ??
        fallbackRating(String(row["Nombre del Lugar"] || "")),
      views:
        parseNumber(row["Views"]) ??
        parseNumber(row["Vistas"]) ??
        fallbackViews(String(row["Nombre del Lugar"] || "")),
    }))
    .filter((place) => place.nombre !== "");
}

export async function getMergedPlaces(): Promise<PlaceRecord[]> {
  const csvResponse = await fetch("/datosLugares.csv");
  const csvText = await csvResponse.text();
  const csvPlaces = parseCsvPlaces(csvText);

  const mergedByName = new Map<string, PlaceRecord>();
  csvPlaces.forEach((place) => {
    mergedByName.set(place.nombre, place);
  });

  try {
    const firestoreResponse = await fetch(`${BACKEND_URL}/api/lugares?includeApprovedBusinesses=true`);
    if (!firestoreResponse.ok) {
      return Array.from(mergedByName.values());
    }

    const firestoreData = await firestoreResponse.json();
    const firestorePlaces: FirestorePlace[] = firestoreData.lugares || [];

    firestorePlaces.forEach((firestorePlace) => {
      const nombre = String(firestorePlace.nombre || "").trim();
      if (!nombre) return;

      const existing = mergedByName.get(nombre);
      
      // Usar datos reales de Firestore para rating y views si existen
      const realRating = parseNumber(firestorePlace.rating) ?? 
                        parseNumber((firestorePlace as any).averageRating);
      const realViews = parseNumber(firestorePlace.views);

      const nextValue: PlaceRecord = {
        nombre,
        rawCategoria: existing?.rawCategoria || normalizeCategory(String(firestorePlace.categoria || "")),
        categoria: normalizeCategory(String(firestorePlace.categoria || existing?.categoria || "")),
        subcategoria: existing?.subcategoria,
        descripcion: String(firestorePlace.descripcion || existing?.descripcion || "").trim(),
        ubicacion: String(firestorePlace.ubicacion || existing?.ubicacion || "").trim(),
        latitud: String(firestorePlace.latitud || existing?.latitud || "").trim(),
        longitud: String(firestorePlace.longitud || existing?.longitud || "").trim(),
        fotos: Array.isArray(firestorePlace.fotos) ? firestorePlace.fotos : existing?.fotos || [],
        // Prioridad: datos reales > CSV > fallback
        rating: realRating ?? existing?.rating ?? fallbackRating(nombre),
        views: realViews ?? existing?.views ?? fallbackViews(nombre),
      };

      mergedByName.set(nombre, nextValue);
    });
  } catch (error) {
    console.error("Error obteniendo lugares de Firestore:", error);
  }

  return Array.from(mergedByName.values());
}

export function matchesCategory(placeCategory: string, targetCategory: string): boolean {
  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  return normalize(placeCategory) === normalize(targetCategory);
}