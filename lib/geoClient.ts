/**
 * Cliente de API para funcionalidades de geonavegación
 * Interfaz unificada para comunicar con backend de navegación
 */

import { fetchWithAuth } from './fetchWithAuth';

const BACKEND_API = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/api';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface RouteRequest {
  origin: GeoPoint;
  destination: GeoPoint;
  mode?: 'driving' | 'walking' | 'cycling' | 'transit-like' | 'rideshare-like';
  departureHour?: number;
  waypoints?: GeoPoint[];
}

export interface RouteStep {
  distance: number; // km
  duration: number; // minutos
  instruction: string;
  road?: string;
  maneuver?: string;
  location?: [number, number]; // [lng, lat] — where this maneuver occurs
}

export interface RouteOption {
  geometry: any; // GeoJSON LineString
  distance: number; // km
  duration: number; // minutos
  durationWithTraffic?: number;
  steps: RouteStep[];
  polyline?: string; // JSON.stringify([[lng, lat], ...])
}

export interface RouteResponse {
  success: boolean;
  route?: RouteOption;
  routes?: RouteOption[]; // Todas las alternativas
  error?: string;
  fallback?: boolean;
}

export interface SearchRadiusRequest {
  center: GeoPoint;
  radiusKm: number;
  categories?: string[];
  limit?: number;
}

export interface PlaceResult {
  id: string;
  source: 'lugar' | 'negocio';
  nombre?: string;
  latitud?: string | number;
  longitud?: string | number;
  categoria?: string;
  descripcion?: string;
  distance?: number;
  [key: string]: any;
}

export interface SearchRadiusResponse {
  success: boolean;
  count: number;
  total: number;
  center: GeoPoint;
  radiusKm: number;
  places: PlaceResult[];
}

export interface TransportOption {
  mode: 'driving' | 'walking' | 'cycling' | 'transit-like' | 'rideshare-like';
  eta_minutes: number;
  distance: number; // km
  external_link?: string;
}

export interface TransportOptionsResponse {
  success: boolean;
  origin: GeoPoint;
  destination: GeoPoint;
  distance: number;
  options: TransportOption[];
}

export interface GeocodeResponse {
  success: boolean;
  latitud?: number | string;
  longitud?: number | string;
  message?: string;
}

type TransportMode = NonNullable<RouteRequest['mode']>;

const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1';
const OSRM_TIMEOUT_MS = 10_000;
const MAX_WAYPOINTS = 10;
const VALID_TRANSPORT_MODES = new Set<TransportMode>([
  'driving',
  'walking',
  'cycling',
  'transit-like',
  'rideshare-like',
]);

function isValidRoutePoint(point: GeoPoint | undefined): boolean {
  return (
    typeof point?.lat === 'number' &&
    typeof point?.lng === 'number' &&
    Number.isFinite(point.lat) &&
    Number.isFinite(point.lng) &&
    point.lat >= -90 &&
    point.lat <= 90 &&
    point.lng >= -180 &&
    point.lng <= 180
  );
}

function validateRouteRequest(request: RouteRequest): string | null {
  if (!isValidRoutePoint(request.origin)) return 'Origen inválido';
  if (!isValidRoutePoint(request.destination)) return 'Destino inválido';
  if (request.mode && !VALID_TRANSPORT_MODES.has(request.mode)) return 'Modo de transporte inválido';
  if (request.departureHour !== undefined && !isValidHour(request.departureHour)) return 'Hora de salida inválida';
  if (request.waypoints !== undefined) {
    if (!Array.isArray(request.waypoints) || request.waypoints.length > MAX_WAYPOINTS) {
      return `Máximo ${MAX_WAYPOINTS} waypoints permitidos`;
    }
    if (request.waypoints.some(point => !isValidRoutePoint(point))) return 'Waypoint inválido';
  }
  return null;
}

function getOSRMProfile(mode: TransportMode): string {
  if (mode === 'walking') return 'walking';
  if (mode === 'cycling') return 'cycling';
  return 'driving';
}

function isValidHour(hour: number): boolean {
  return Number.isInteger(hour) && hour >= 0 && hour < 24;
}

function getTrafficFactor(hour: number): number {
  if (hour >= 7 && hour < 9) return 1.8;
  if (hour >= 17 && hour < 20) return 2.2;
  if (hour >= 14 && hour < 17) return 1.3;
  return 1.0;
}

function calculateRouteETA(distanceKm: number, mode: TransportMode, hour?: number): number | undefined {
  if (hour === undefined || !isValidHour(hour)) return undefined;
  const baseSpeeds: Record<TransportMode, number> = {
    driving: 30,
    walking: 5,
    cycling: 15,
    'transit-like': 20,
    'rideshare-like': 25,
  };
  let speed = baseSpeeds[mode];
  if (mode === 'driving' || mode === 'rideshare-like') {
    speed = speed / getTrafficFactor(hour);
  }
  return Math.ceil((distanceKm / speed) * 60);
}

function parseOSRMInstruction(step: any): string {
  const maneuver = step.maneuver?.type;
  const modifier = step.maneuver?.modifier;
  const road = step.name || 'vía desconocida';
  const meters = Math.round(step.distance || 0);
  const directionMap: Record<string, string> = {
    straight: 'continúa recto',
    left: 'gira a la izquierda',
    right: 'gira a la derecha',
    'sharp left': 'gira fuertemente a la izquierda',
    'sharp right': 'gira fuertemente a la derecha',
    'slight left': 'tuerce suavemente a la izquierda',
    'slight right': 'tuerce suavemente a la derecha',
    uturn: 'haz un giro de retorno',
  };
  const direction = maneuver && modifier
    ? directionMap[`${maneuver} ${modifier}`] || directionMap[maneuver] || 'continúa'
    : directionMap[maneuver] || 'continúa';
  return `${direction} en ${road} por ${meters}m`;
}

function mapOSRMRoute(osrmRoute: any, mode: TransportMode, departureHour?: number): RouteOption {
  const distanceKm = osrmRoute.distance / 1000;
  const durationMinutes = Math.ceil(osrmRoute.duration / 60);
  const steps: RouteStep[] = [];

  for (const leg of osrmRoute.legs || []) {
    for (const step of leg.steps || []) {
      steps.push({
        distance: step.distance / 1000,
        duration: Math.ceil(step.duration / 60),
        instruction: parseOSRMInstruction(step),
        road: step.name || 'Vía desconocida',
        maneuver: step.maneuver?.type,
        location: step.maneuver?.location,
      });
    }
  }

  return {
    geometry: osrmRoute.geometry,
    distance: distanceKm,
    duration: durationMinutes,
    durationWithTraffic: calculateRouteETA(distanceKm, mode, departureHour) || durationMinutes,
    steps,
    polyline: JSON.stringify(osrmRoute.geometry?.coordinates || []),
  };
}

async function getRouteFromOSRM(request: RouteRequest): Promise<RouteResponse> {
  const validationError = validateRouteRequest(request);
  if (validationError) {
    return { success: false, error: validationError, fallback: true };
  }

  const mode = request.mode || 'driving';
  const points = request.waypoints?.length
    ? [request.origin, ...request.waypoints, request.destination]
    : [request.origin, request.destination];
  const coords = points.map(point => `${point.lng},${point.lat}`).join(';');
  const profile = getOSRMProfile(mode);
  const url = `${OSRM_BASE_URL}/${profile}/${coords}?geometries=geojson&steps=true&alternatives=3`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OSRM_TIMEOUT_MS);
  let response: Response;

  try {
    response = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    });
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      return { success: false, error: 'El servicio de rutas tardó demasiado', fallback: true };
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    return { success: false, error: `OSRM HTTP ${response.status}`, fallback: true };
  }

  const data = await response.json();
  if (data.code !== 'Ok' || !Array.isArray(data.routes) || data.routes.length === 0) {
    return { success: false, error: data.message || 'No se encontró ruta', fallback: true };
  }

  const routes = data.routes.map((route: any) => mapOSRMRoute(route, mode, request.departureHour));
  return { success: true, route: routes[0], routes };
}

/**
 * Obtener ruta entre dos puntos
 */
export async function getRoute(request: RouteRequest): Promise<RouteResponse> {
  try {
    const response = await fetch('/api/lugares/routing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      if (response.status === 404 || response.status >= 500) {
        return await getRouteFromOSRM(request);
      }
      return {
        success: false,
        error: error.msg || 'Error obteniendo ruta',
        fallback: true
      };
    }

    return await response.json();
  } catch (error: any) {
    console.error('[geoClient] Error en getRoute:', error);
    try {
      return await getRouteFromOSRM(request);
    } catch (fallbackError: any) {
      return {
        success: false,
        error: fallbackError.message || error.message || 'Error de red al obtener ruta',
        fallback: true
      };
    }
  }
}

/**
 * Buscar lugares dentro de un radio
 */
export async function searchByRadius(request: SearchRadiusRequest): Promise<SearchRadiusResponse> {
  try {
    const response = await fetch('/api/lugares/search-radius', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        count: 0,
        total: 0,
        center: request.center,
        radiusKm: request.radiusKm,
        places: []
      };
    }

    return await response.json();
  } catch (error: any) {
    console.error('[geoClient] Error en searchByRadius:', error);
    return {
      success: false,
      count: 0,
      total: 0,
      center: request.center,
      radiusKm: request.radiusKm,
      places: []
    };
  }
}

/**
 * Obtener opciones de transporte con ETA
 */
export async function getTransportOptions(
  origin: GeoPoint,
  destination: GeoPoint,
  departureHour?: number
): Promise<TransportOptionsResponse> {
  try {
    const params = new URLSearchParams({
      lat: origin.lat.toString(),
      lng: origin.lng.toString(),
      destLat: destination.lat.toString(),
      destLng: destination.lng.toString()
    });

    if (departureHour !== undefined) {
      params.append('hour', departureHour.toString());
    }

    const response = await fetch(`/api/lugares/transport-options?${params.toString()}`);

    if (!response.ok) {
      return {
        success: false,
        origin,
        destination,
        distance: 0,
        options: []
      };
    }

    return await response.json();
  } catch (error: any) {
    console.error('[geoClient] Error en getTransportOptions:', error);
    return {
      success: false,
      origin,
      destination,
      distance: 0,
      options: []
    };
  }
}

/**
 * Geocodificar una dirección a coordenadas usando el backend
 */
export async function geocodeAddress(direccion: string): Promise<GeocodeResponse> {
  try {
    const response = await fetch('/api/lugares/geocode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ direccion })
    });

    if (!response.ok) {
      console.error('[geoClient] geocodeAddress HTTP error:', response.status, response.statusText);
      return {
        success: false,
        message: `Error del servidor: ${response.status}`
      };
    }

    return await response.json();
  } catch (error: any) {
    console.error('[geoClient] Error en geocodeAddress:', error);
    return {
      success: false,
      message: error.message || 'Error geocodificando dirección'
    };
  }
}

/**
 * Calcular distancia entre dos puntos (Haversine - lado cliente)
 */
export function calculateDistance(p1: GeoPoint, p2: GeoPoint): number {
  const R = 6371; // Radio de Tierra en km
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convertir GeoJSON LineString a array de puntos [lat, lng]
 */
export function parseGeoJSONGeometry(geometry: any): Array<[number, number]> {
  if (!geometry) return [];

  if (typeof geometry === 'string') {
    try {
      geometry = JSON.parse(geometry);
    } catch {
      return [];
    }
  }

  if (geometry.type === 'LineString' && Array.isArray(geometry.coordinates)) {
    // OSRM devuelve [lng, lat], convertir a [lat, lng] para Leaflet
    return geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
  }

  return [];
}
