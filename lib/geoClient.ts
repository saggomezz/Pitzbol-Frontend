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
  mode?: 'driving' | 'motorcycle' | 'walking' | 'cycling';
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

export type TrafficLevel = 'free' | 'moderate' | 'heavy';

export interface TrafficSegment {
  coordinates: [number, number][]; // [lng, lat]
  level: TrafficLevel;
  speedKmh: number;
  delayMinutes: number;
}

export interface TrafficSummary {
  level: TrafficLevel;
  label: string;
  delayMinutes: number;
  source: 'estimated';
}

export interface RouteOption {
  geometry: any; // GeoJSON LineString
  distance: number; // km
  duration: number; // minutos
  durationWithTraffic?: number;
  steps: RouteStep[];
  polyline?: string; // JSON.stringify([[lng, lat], ...])
  trafficSegments?: TrafficSegment[];
  trafficSummary?: TrafficSummary;
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
  mode: 'driving' | 'motorcycle' | 'walking' | 'cycling';
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
  'motorcycle',
  'walking',
  'cycling',
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

function makeVariantWaypoint(origin: GeoPoint, destination: GeoPoint, variantIndex: number): GeoPoint | null {
  const directKm = calculateDistance(origin, destination);
  if (!Number.isFinite(directKm) || directKm < 0.35) return null;

  const midLat = origin.lat + (destination.lat - origin.lat) * (variantIndex < 2 ? 0.5 : variantIndex === 2 ? 0.35 : 0.65);
  const midLng = origin.lng + (destination.lng - origin.lng) * (variantIndex < 2 ? 0.5 : variantIndex === 2 ? 0.35 : 0.65);
  const latRad = (midLat * Math.PI) / 180;
  const east = (destination.lng - origin.lng) * Math.cos(latRad);
  const north = destination.lat - origin.lat;
  const length = Math.hypot(east, north);
  if (length < 1e-8) return null;

  const sign = variantIndex % 2 === 0 ? 1 : -1;
  const offsetKm = Math.max(0.18, Math.min(3.2, directKm * (variantIndex < 2 ? 0.18 : 0.26)));
  const offsetNorth = (east / length) * sign;
  const offsetEast = (-north / length) * sign;

  const lat = midLat + (offsetNorth * offsetKm) / 111.32;
  const lng = midLng + (offsetEast * offsetKm) / (111.32 * Math.max(0.2, Math.cos(latRad)));
  return isValidRoutePoint({ lat, lng }) ? { lat, lng } : null;
}

function routeSignature(route: RouteOption): string {
  const coords = route.geometry?.coordinates;
  if (!Array.isArray(coords) || coords.length === 0) return route.polyline || `${route.distance}-${route.duration}`;
  const sampleIndexes = [0, Math.floor(coords.length / 2), coords.length - 1];
  return sampleIndexes
    .map(index => {
      const coord = coords[index];
      return Array.isArray(coord) ? `${Number(coord[0]).toFixed(4)},${Number(coord[1]).toFixed(4)}` : '';
    })
    .join('|');
}

function mergeUniqueRoutes(existing: RouteOption[], incoming: RouteOption[]): RouteOption[] {
  const seen = new Set(existing.map(routeSignature));
  const merged = [...existing];
  for (const route of incoming) {
    const signature = routeSignature(route);
    if (seen.has(signature)) continue;
    seen.add(signature);
    merged.push(route);
  }
  return merged;
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

function trafficFactorForMode(mode: TransportMode, hour: number): number {
  if (!isValidHour(hour)) return 1;
  if (mode === 'driving') return getTrafficFactor(hour);
  if (mode === 'motorcycle') return 1 + (getTrafficFactor(hour) - 1) * 0.45;
  return 1;
}

function calculateRouteETA(distanceKm: number, mode: TransportMode, hour?: number): number | undefined {
  if (hour === undefined || !isValidHour(hour)) return undefined;
  const baseSpeeds: Record<TransportMode, number> = {
    driving: 30,
    motorcycle: 34,
    walking: 5,
    cycling: 15,
  };
  const speed = baseSpeeds[mode] / trafficFactorForMode(mode, hour);
  return Math.ceil((distanceKm / speed) * 60);
}

function trafficLevelForSegment(distanceKm: number, durationMinutes: number, mode: TransportMode, hour?: number): TrafficLevel {
  if (mode === 'walking' || mode === 'cycling') return 'free';
  const speedKmh = durationMinutes > 0 ? distanceKm / (durationMinutes / 60) : 0;
  const rushFactor = hour !== undefined && isValidHour(hour) ? trafficFactorForMode(mode, hour) : 1;
  if (rushFactor >= 1.8 || speedKmh < 12) return 'heavy';
  if (rushFactor >= 1.3 || speedKmh < 24) return 'moderate';
  return 'free';
}

function buildTrafficSegments(osrmRoute: any, mode: TransportMode, departureHour?: number): TrafficSegment[] {
  const segments: TrafficSegment[] = [];
  for (const leg of osrmRoute.legs || []) {
    for (const step of leg.steps || []) {
      const coords = step.geometry?.coordinates;
      if (!Array.isArray(coords) || coords.length < 2) continue;
      const distanceKm = (step.distance || 0) / 1000;
      const durationMinutes = Math.max((step.duration || 0) / 60, 1 / 60);
      const speedKmh = distanceKm / (durationMinutes / 60);
      const level = trafficLevelForSegment(distanceKm, durationMinutes, mode, departureHour);
      const rushFactor = departureHour !== undefined && isValidHour(departureHour) ? trafficFactorForMode(mode, departureHour) : 1;
      const delayMinutes = mode === 'driving' || mode === 'motorcycle'
        ? Math.max(0, durationMinutes * (rushFactor - 1))
        : 0;
      segments.push({
        coordinates: coords,
        level,
        speedKmh: Math.round(speedKmh),
        delayMinutes: Math.round(delayMinutes),
      });
    }
  }
  return segments;
}

function summarizeTraffic(segments: TrafficSegment[]): TrafficSummary {
  const delayMinutes = segments.reduce((sum, segment) => sum + segment.delayMinutes, 0);
  const heavyCount = segments.filter(segment => segment.level === 'heavy').length;
  const moderateCount = segments.filter(segment => segment.level === 'moderate').length;
  const level: TrafficLevel = heavyCount > 0 ? 'heavy' : moderateCount > 0 ? 'moderate' : 'free';
  const label = level === 'heavy'
    ? 'Tráfico alto estimado'
    : level === 'moderate'
    ? 'Tráfico moderado estimado'
    : 'Flujo libre estimado';
  return { level, label, delayMinutes: Math.round(delayMinutes), source: 'estimated' };
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
  const trafficSegments = buildTrafficSegments(osrmRoute, mode, departureHour);

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
    trafficSegments,
    trafficSummary: summarizeTraffic(trafficSegments),
  };
}

async function fetchOSRMRouteOptions(points: GeoPoint[], mode: TransportMode, departureHour?: number, alternatives: number | false = 3): Promise<RouteOption[]> {
  const coords = points.map(point => `${point.lng},${point.lat}`).join(';');
  const radiuses = points.map((_, index) => (index === 0 || index === points.length - 1 ? '120' : '700')).join(';');
  const profile = getOSRMProfile(mode);
  const alternativesParam = alternatives === false ? 'false' : String(alternatives);
  const url = `${OSRM_BASE_URL}/${profile}/${coords}?geometries=geojson&overview=full&steps=true&alternatives=${alternativesParam}&continue_straight=false&radiuses=${radiuses}`;

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
      throw new Error('El servicio de rutas tardó demasiado');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) throw new Error(`OSRM HTTP ${response.status}`);

  const data = await response.json();
  if (data.code !== 'Ok' || !Array.isArray(data.routes) || data.routes.length === 0) {
    throw new Error(data.message || 'No se encontró ruta');
  }

  return data.routes.map((route: any) => mapOSRMRoute(route, mode, departureHour));
}

async function ensureThreeRouteOptions(request: RouteRequest, mode: TransportMode): Promise<RouteOption[]> {
  const basePoints = request.waypoints?.length
    ? [request.origin, ...request.waypoints, request.destination]
    : [request.origin, request.destination];

  let routes = await fetchOSRMRouteOptions(basePoints, mode, request.departureHour, 2);
  if (routes.length >= 2 || request.waypoints?.length) return routes;

  for (let variantIndex = 0; variantIndex < 5 && routes.length < 2; variantIndex++) {
    const waypoint = makeVariantWaypoint(request.origin, request.destination, variantIndex);
    if (!waypoint) continue;
    try {
      const variantRoutes = await fetchOSRMRouteOptions([request.origin, waypoint, request.destination], mode, request.departureHour, false);
      routes = mergeUniqueRoutes(routes, variantRoutes);
    } catch {
      // Some generated waypoints may not snap cleanly. Try the next side/offset.
    }
  }

  return routes;
}

async function getRouteFromOSRM(request: RouteRequest): Promise<RouteResponse> {
  const validationError = validateRouteRequest(request);
  if (validationError) {
    return { success: false, error: validationError, fallback: true };
  }

  const mode = request.mode || 'driving';
  try {
    const routes = (await ensureThreeRouteOptions(request, mode))
      .sort((a: RouteOption, b: RouteOption) => (a.durationWithTraffic ?? a.duration) - (b.durationWithTraffic ?? b.duration))
      .slice(0, 2);
    if (!routes.length) return { success: false, error: 'No se encontró ruta', fallback: true };
    return { success: true, route: routes[0], routes };
  } catch (error: any) {
    return { success: false, error: error.message || 'No se encontró ruta', fallback: true };
  }
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
