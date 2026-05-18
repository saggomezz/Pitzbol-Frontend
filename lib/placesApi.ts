import Papa from "papaparse";

const API_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.pitzbol.me:8443') + '/api';

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
  images?: string[];
  galeria?: string[];
  logo?: string;
  rating?: number | string;
  views?: number | string;
}

function normalizeMediaUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^(javascript|vbscript|file):/i.test(trimmed)) return null;

  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^\/\//.test(trimmed)) return `https:${trimmed}`;
  if (/^\//.test(trimmed) || /^\.\.?\//.test(trimmed)) return trimmed;
  if (/^data:image\//i.test(trimmed) || /^blob:/i.test(trimmed)) return trimmed;
  if (/^([a-z0-9-]+\.)+[a-z]{2,}(\/|$)/i.test(trimmed)) return `https://${trimmed}`;

  return null;
}

function normalizeMediaList(values: unknown[]): string[] {
  return values
    .map((value) => normalizeMediaUrl(value))
    .filter((value): value is string => Boolean(value));
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
    let firestoreResponse: Response | undefined;

    try {
      firestoreResponse = await fetch(`${API_BASE}/lugares?includeApprovedBusinesses=true`);
    } catch {
      // error de red en la petición principal — intentamos el fallback
    }

    // Fallback defensivo: si la integración con negocios aprobados falla
    // (error HTTP o de red), intentamos al menos recuperar lugares base.
    if (!firestoreResponse || !firestoreResponse.ok) {
      try {
        firestoreResponse = await fetch(`${API_BASE}/lugares`);
      } catch {
        // error de red en el fallback también — usamos datos CSV
      }
    }

    if (!firestoreResponse || !firestoreResponse.ok) {
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

      const photosFromPlace = [
        ...(Array.isArray(firestorePlace.fotos) ? firestorePlace.fotos : []),
        ...(Array.isArray(firestorePlace.images) ? firestorePlace.images : []),
        ...(Array.isArray(firestorePlace.galeria) ? firestorePlace.galeria : []),
      ];

      const normalizedPhotos = normalizeMediaList(photosFromPlace);
      const normalizedLogo = normalizeMediaUrl(firestorePlace.logo);

      const mergedPhotos = Array.from(
        new Set([
          ...(normalizedLogo ? [normalizedLogo] : []),
          ...normalizedPhotos,
          ...(existing?.fotos || []),
        ])
      );

      // Si Firebase tiene categorias[] (editadas por el admin), son autoritativas.
      // No mezclar con CSV — el admin decidió exactamente qué categorías tiene el lugar.
      const hasAdminCats = Array.isArray(firestorePlace.categorias) && firestorePlace.categorias.length > 0;
      const nextValue: PlaceRecord = {
        nombre,
        rawCategoria: hasAdminCats
          ? firestorePlace.categorias!.join(', ')
          : existing?.rawCategoria || normalizeCategory(String(firestorePlace.categoria || "")),
        categoria: hasAdminCats
          ? firestorePlace.categorias![0]
          : normalizeCategory(String(firestorePlace.categoria || existing?.categoria || "")),
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
        fotos: mergedPhotos,
        rating: realRating ?? existing?.rating ?? fallbackRating(nombre),
        views: realViews ?? existing?.views ?? fallbackViews(nombre),
        negocioId: firestorePlace.negocioId || (firestorePlace as any).id || existing?.negocioId,
      };

      mergedByName.set(nombre, nextValue);
    });
  } catch (error) {
    console.warn("Error obteniendo lugares de Firestore:", error);
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