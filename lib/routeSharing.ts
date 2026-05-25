/**
 * Utilidades para compartir rutas e itinerarios
 * Genera URLs, codifica parámetros, maneja formatos de compartición
 */

import { GeoPoint, calculateDistance } from './geoClient';

export interface ShareableRoute {
  id?: string;
  name: string;
  origin: GeoPoint;
  destination: GeoPoint;
  transportMode: 'driving' | 'motorcycle' | 'walking' | 'cycling';
  distance: number; // km
  duration: number; // minutos
  waypoints?: GeoPoint[];
  color?: string;
}

export interface ShareableItinerary {
  id?: string;
  name: string;
  date: string; // YYYY-MM-DD
  events: Array<{
    name: string;
    location: GeoPoint;
    time?: string; // HH:mm
  }>;
  totalDistance?: number;
  totalDuration?: number;
}

/**
 * Codificar punto geográfico para URL
 */
function encodeGeoPoint(point: GeoPoint): string {
  return `${point.lat.toFixed(6)},${point.lng.toFixed(6)}`;
}

/**
 * Decodificar punto geográfico desde URL
 */
function decodeGeoPoint(encoded: string): GeoPoint | null {
  const parts = encoded.split(',');
  if (parts.length !== 2) return null;

  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);

  if (isNaN(lat) || isNaN(lng)) return null;

  return { lat, lng };
}

/**
 * Generar URL compartible para una ruta
 */
export function generateRouteShareLink(route: ShareableRoute): string {
  try {
    const params = new URLSearchParams();

    params.set('tipo', 'ruta');
    params.set('nombre', encodeURIComponent(route.name));
    params.set('origen', encodeGeoPoint(route.origin));
    params.set('destino', encodeGeoPoint(route.destination));
    params.set('modo', route.transportMode);
    params.set('distancia', route.distance.toFixed(2));
    params.set('duracion', route.duration.toString());

    if (route.waypoints && route.waypoints.length > 0) {
      params.set(
        'waypoints',
        route.waypoints.map(wp => encodeGeoPoint(wp)).join(';')
      );
    }

    if (route.color) {
      params.set('color', route.color.replace('#', ''));
    }

    const baseUrl =
      typeof window !== 'undefined' ? window.location.origin : 'https://pitzbol.me';
    return `${baseUrl}/mapa?${params.toString()}`;
  } catch (err) {
    console.error('[shareRoute] Error generando enlace:', err);
    return '';
  }
}

/**
 * Parsear ruta desde parámetros URL
 */
export function parseRouteFromParams(params: URLSearchParams): ShareableRoute | null {
  try {
    const tipo = params.get('tipo');
    if (tipo !== 'ruta') return null;

    const name = decodeURIComponent(params.get('nombre') || 'Ruta sin nombre');
    const origin = decodeGeoPoint(params.get('origen') || '');
    const destination = decodeGeoPoint(params.get('destino') || '');
    const transportMode = (params.get('modo') || 'driving') as any;

    if (!origin || !destination) return null;

    const distance = parseFloat(params.get('distancia') || '0');
    const duration = parseInt(params.get('duracion') || '0');

    let waypoints: GeoPoint[] | undefined;
    const waypointsStr = params.get('waypoints');
    if (waypointsStr) {
      waypoints = waypointsStr
        .split(';')
        .map(wp => decodeGeoPoint(wp))
        .filter((wp): wp is GeoPoint => wp !== null);
    }

    let color: string | undefined;
    const colorHex = params.get('color');
    if (colorHex) {
      color = `#${colorHex}`;
    }

    return {
      name,
      origin,
      destination,
      transportMode,
      distance,
      duration,
      waypoints,
      color
    };
  } catch (err) {
    console.error('[parseRoute] Error parseando ruta:', err);
    return null;
  }
}

/**
 * Generar URL compartible para un itinerario
 */
export function generateItineraryShareLink(itinerary: ShareableItinerary): string {
  try {
    const params = new URLSearchParams();

    params.set('tipo', 'itinerario');
    params.set('nombre', encodeURIComponent(itinerary.name));
    params.set('fecha', itinerary.date);

    // Codificar eventos
    const eventsEncoded = itinerary.events
      .map(evt => {
        const parts = [
          encodeURIComponent(evt.name),
          encodeGeoPoint(evt.location),
          evt.time || ''
        ];
        return parts.join(':');
      })
      .join(';');

    params.set('eventos', eventsEncoded);

    if (itinerary.totalDistance) {
      params.set('distancia_total', itinerary.totalDistance.toFixed(2));
    }

    if (itinerary.totalDuration) {
      params.set('duracion_total', itinerary.totalDuration.toString());
    }

    const baseUrl =
      typeof window !== 'undefined' ? window.location.origin : 'https://pitzbol.me';
    return `${baseUrl}/mapa?${params.toString()}`;
  } catch (err) {
    console.error('[shareItinerary] Error generando enlace:', err);
    return '';
  }
}

/**
 * Parsear itinerario desde parámetros URL
 */
export function parseItineraryFromParams(
  params: URLSearchParams
): ShareableItinerary | null {
  try {
    const tipo = params.get('tipo');
    if (tipo !== 'itinerario') return null;

    const name = decodeURIComponent(params.get('nombre') || 'Itinerario sin nombre');
    const date = params.get('fecha') || '';
    const eventsStr = params.get('eventos') || '';

    const events = eventsStr
      .split(';')
      .map(evt => {
        const parts = evt.split(':');
        if (parts.length < 2) return null;

        const location = decodeGeoPoint(parts[1]);
        if (!location) return null;

        return {
          name: decodeURIComponent(parts[0]),
          location,
          time: parts[2] || undefined
        };
      })
      .filter((evt): evt is any => evt !== null);

    return {
      name,
      date,
      events,
      totalDistance: parseFloat(params.get('distancia_total') || '0') || undefined,
      totalDuration: parseInt(params.get('duracion_total') || '0') || undefined
    };
  } catch (err) {
    console.error('[parseItinerary] Error parseando itinerario:', err);
    return null;
  }
}

/**
 * Generar enlace de Google Maps para una ubicación (fallback)
 */
export function generateGoogleMapsLink(point: GeoPoint, label?: string): string {
  const params = new URLSearchParams();
  params.set('q', label ? `${label} @${point.lat},${point.lng}` : `${point.lat},${point.lng}`);
  params.set('z', '15');
  return `https://maps.google.com/?${params.toString()}`;
}

/**
 * Generar enlace de OpenStreetMap (fallback)
 */
export function generateOSMLink(point: GeoPoint, label?: string): string {
  const zoom = 15;
  const markers =
    label && label.length < 100
      ? `&markers=0,0,${encodeURIComponent(label)}`
      : '';
  return `https://www.openstreetmap.org/?mlat=${point.lat}&mlon=${point.lng}&zoom=${zoom}${markers}`;
}

/**
 * Copiar texto al portapapeles
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback para HTTP o navegadores antiguos
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    }
  } catch {
    return false;
  }
}

/**
 * Compartir usando Share API o fallback
 */
export async function shareContent(
  title: string,
  text: string,
  url: string
): Promise<boolean> {
  try {
    if (navigator.share) {
      await navigator.share({ title, text, url });
      return true;
    } else {
      // Fallback
      return await copyToClipboard(`${text}\n\n${url}`);
    }
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.error('[shareContent] Error compartiendo:', err);
    }
    return false;
  }
}
