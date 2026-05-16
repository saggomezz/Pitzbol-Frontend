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
      const error = await response.json();
      return {
        success: false,
        error: error.msg || 'Error obteniendo ruta',
        fallback: true
      };
    }

    return await response.json();
  } catch (error: any) {
    console.error('[geoClient] Error en getRoute:', error);
    return {
      success: false,
      error: error.message || 'Error de red al obtener ruta',
      fallback: true
    };
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
