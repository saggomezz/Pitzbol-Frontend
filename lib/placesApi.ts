import Papa from "papaparse";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export interface PlaceRecord {
  nombre: string;
  categoria: string;
  descripcion: string;
  ubicacion: string;
  latitud: string;
  longitud: string;
  fotos: string[];
}

interface FirestorePlace {
  nombre?: string;
  categoria?: string;
  descripcion?: string;
  ubicacion?: string;
  latitud?: string;
  longitud?: string;
  fotos?: string[];
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
      categoria: normalizeCategory(String(row["Categoría"] || "").trim()),
      descripcion: String(row["Nota para IA"] || "").trim(),
      ubicacion: String(row["Dirección"] || "").trim(),
      latitud: String(row["Latitud"] || "").replace(",", ".").trim(),
      longitud: String(row["Longitud"] || "").replace(",", ".").trim(),
      fotos: [],
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
    const firestoreResponse = await fetch(`${BACKEND_URL}/api/lugares`);
    if (!firestoreResponse.ok) {
      return Array.from(mergedByName.values());
    }

    const firestoreData = await firestoreResponse.json();
    const firestorePlaces: FirestorePlace[] = firestoreData.lugares || [];

    firestorePlaces.forEach((firestorePlace) => {
      const nombre = String(firestorePlace.nombre || "").trim();
      if (!nombre) return;

      const existing = mergedByName.get(nombre);
      const nextValue: PlaceRecord = {
        nombre,
        categoria: normalizeCategory(String(firestorePlace.categoria || existing?.categoria || "")),
        descripcion: String(firestorePlace.descripcion || existing?.descripcion || "").trim(),
        ubicacion: String(firestorePlace.ubicacion || existing?.ubicacion || "").trim(),
        latitud: String(firestorePlace.latitud || existing?.latitud || "").trim(),
        longitud: String(firestorePlace.longitud || existing?.longitud || "").trim(),
        fotos: Array.isArray(firestorePlace.fotos) ? firestorePlace.fotos : existing?.fotos || [],
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