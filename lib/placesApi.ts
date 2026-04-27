import Papa from "papaparse";

const API_BASE = "/api";

export interface PlaceRecord {
  nombre: string;
  categoria: string;
  rawCategoria: string;
  subcategoria?: string;
  descripcion: string;
  ubicacion: string;
  latitud: string;
  longitud: string;
  telefono?: string;
  phone?: string;
  website?: string;
  email?: string;
  ownerEmail?: string;
  contactEmail?: string;
  codigoPostal?: string;
  tiempoEstancia?: number;
  costoEstimado?: string;
  horario?: Record<string, { enabled?: boolean; open?: string; close?: string }> | null;
  horariosJson?: string;
  subcategorias?: string[];
  fotos: string[];
  rating: number;
  views: number;
  negocioId?: string;
}

interface FirestorePlace {
  nombre?: string;
  negocioId?: string;
  categoria?: string;
  descripcion?: string;
  ubicacion?: string;
  latitud?: string;
  longitud?: string;
  telefono?: string;
  phone?: string;
  website?: string;
  web?: string;
  sitioWeb?: string;
  email?: string;
  ownerEmail?: string;
  contactEmail?: string;
  userEmail?: string;
  codigoPostal?: string;
  cp?: string;
  tiempoEstancia?: number | string;
  costoEstimado?: string;
  estimatedCost?: string;
  suggestedStayTime?: number | string;
  schedule?: Record<string, { enabled?: boolean; open?: string; close?: string }> | null;
  horariosJson?: string;
  subcategoria?: string;
  subcategorias?: string[];
  categorias?: string[];
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
      telefono:
        String(row["Teléfono"] || row["Telefono"] || row["Phone"] || "").trim() || undefined,
      phone:
        String(row["Phone"] || row["Teléfono"] || row["Telefono"] || "").trim() || undefined,
      website:
        String(row["Sitio Web"] || row["Website"] || row["Web"] || "").trim() || undefined,
      email:
        String(row["Email"] || row["Correo"] || row["Correo electrónico"] || "").trim() || undefined,
      codigoPostal:
        String(row["Código Postal"] || row["Codigo Postal"] || row["CP"] || "").trim() || undefined,
      tiempoEstancia:
        parseNumber(row["Tiempo de Estancia"]) ??
        parseNumber(row["Tiempo estimado de visita"]) ??
        undefined,
      costoEstimado: String(row["Costo Estimado"] || "").trim() || undefined,
      horario: null,
      subcategorias: row["Subcategoría"] ? [String(row["Subcategoría"]).trim()].filter(Boolean) : undefined,
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
    const firestoreResponse = await fetch(`${API_BASE}/lugares?includeApprovedBusinesses=true`);
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
        rawCategoria: (Array.isArray(firestorePlace.categorias) && firestorePlace.categorias.length > 1)
          ? firestorePlace.categorias.join(', ')
          : existing?.rawCategoria || normalizeCategory(String(firestorePlace.categoria || "")),
        categoria: normalizeCategory(String(firestorePlace.categoria || existing?.categoria || "")),
        subcategoria:
          String(
            firestorePlace.subcategoria ||
            (Array.isArray(firestorePlace.subcategorias) ? firestorePlace.subcategorias[0] : "") ||
            existing?.subcategoria ||
            ""
          ).trim() || undefined,
        subcategorias:
          Array.isArray(firestorePlace.subcategorias) && firestorePlace.subcategorias.length
            ? firestorePlace.subcategorias.map((item) => String(item).trim()).filter(Boolean)
            : existing?.subcategorias,
        descripcion: String(firestorePlace.descripcion || existing?.descripcion || "").trim(),
        ubicacion: String(firestorePlace.ubicacion || existing?.ubicacion || "").trim(),
        latitud: String(firestorePlace.latitud || existing?.latitud || "").trim(),
        longitud: String(firestorePlace.longitud || existing?.longitud || "").trim(),
        telefono:
          String(
            firestorePlace.telefono || firestorePlace.phone || existing?.telefono || ""
          ).trim() || undefined,
        phone:
          String(
            firestorePlace.phone || firestorePlace.telefono || existing?.phone || ""
          ).trim() || undefined,
        website:
          String(
            firestorePlace.website || firestorePlace.sitioWeb || firestorePlace.web || existing?.website || ""
          ).trim() || undefined,
        email:
          String(
            firestorePlace.email ||
            firestorePlace.ownerEmail ||
            firestorePlace.contactEmail ||
            firestorePlace.userEmail ||
            existing?.email ||
            ""
          ).trim() || undefined,
        ownerEmail:
          String(firestorePlace.ownerEmail || existing?.ownerEmail || "").trim() || undefined,
        contactEmail:
          String(firestorePlace.contactEmail || existing?.contactEmail || "").trim() || undefined,
        codigoPostal:
          String(
            firestorePlace.codigoPostal || firestorePlace.cp || existing?.codigoPostal || ""
          ).trim() || undefined,
        tiempoEstancia:
          parseNumber(firestorePlace.tiempoEstancia) ??
          parseNumber(firestorePlace.suggestedStayTime) ??
          existing?.tiempoEstancia,
        costoEstimado:
          String(firestorePlace.costoEstimado || firestorePlace.estimatedCost || existing?.costoEstimado || "").trim() ||
          undefined,
        horario: firestorePlace.schedule ?? existing?.horario ?? null,
        horariosJson: firestorePlace.horariosJson ?? existing?.horariosJson,
        fotos: Array.isArray(firestorePlace.fotos) ? firestorePlace.fotos : existing?.fotos || [],
        rating: realRating ?? existing?.rating ?? fallbackRating(nombre),
        views: realViews ?? existing?.views ?? fallbackViews(nombre),
        negocioId: firestorePlace.negocioId || (firestorePlace as any).id || existing?.negocioId,
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