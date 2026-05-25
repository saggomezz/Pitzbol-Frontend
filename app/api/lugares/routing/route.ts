import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ── Types ─────────────────────────────────────────────────────────────────────
type TransportMode = 'driving' | 'motorcycle' | 'walking' | 'cycling';
interface GeoPoint { lat: number; lng: number; }
interface RoutingStep {
  distance: number; duration: number; instruction: string;
  road?: string; maneuver?: string; location?: [number, number];
}
type TrafficLevel = 'free' | 'moderate' | 'heavy';
interface TrafficSegment {
  coordinates: [number, number][];
  level: TrafficLevel;
  speedKmh: number;
  delayMinutes: number;
}
interface TrafficSummary {
  level: TrafficLevel;
  label: string;
  delayMinutes: number;
  source: 'estimated';
}
interface RouteOption {
  geometry: unknown; distance: number; duration: number;
  durationWithTraffic?: number; steps: RoutingStep[]; polyline?: string;
  trafficSegments?: TrafficSegment[]; trafficSummary?: TrafficSummary;
}
interface RoutingResponse {
  success: boolean; route?: RouteOption; routes?: RouteOption[];
  error?: string; fallback?: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const OSRM_BASE = 'https://router.project-osrm.org/route/v1';
const OSRM_TIMEOUT_MS = 10_000;
const VALID_MODES = new Set<string>(['driving', 'motorcycle', 'walking', 'cycling']);

// ── Helpers ───────────────────────────────────────────────────────────────────
function isValidCoord(lat: unknown, lng: unknown): boolean {
  return (
    typeof lat === 'number' && typeof lng === 'number' &&
    isFinite(lat) && isFinite(lng) &&
    lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
  );
}

function isValidHour(h: number): boolean {
  return Number.isInteger(h) && h >= 0 && h < 24;
}

function getTrafficFactor(hour: number): number {
  if (hour >= 7  && hour < 9)  return 1.8; // Rush morning
  if (hour >= 17 && hour < 20) return 2.2; // Rush evening
  if (hour >= 14 && hour < 17) return 1.3; // Afternoon
  return 1.0;
}

function trafficFactorForMode(mode: TransportMode, hour: number): number {
  if (!isValidHour(hour)) return 1;
  if (mode === 'driving') return getTrafficFactor(hour);
  if (mode === 'motorcycle') return 1 + (getTrafficFactor(hour) - 1) * 0.45;
  return 1;
}

function calculateETA(distanceKm: number, mode: TransportMode, hour: number): number {
  if (distanceKm <= 0) return 0;
  const speeds: Record<TransportMode, number> = {
    driving: 30, motorcycle: 34, walking: 5, cycling: 15,
  };
  const speed = speeds[mode] / trafficFactorForMode(mode, hour);
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

function buildTrafficSegments(osrmRoute: Record<string, any>, mode: TransportMode, departureHour?: number): TrafficSegment[] {
  const segments: TrafficSegment[] = [];
  for (const leg of ((osrmRoute.legs as any[]) ?? [])) {
    for (const step of ((leg.steps as any[]) ?? [])) {
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

function toOSRMProfile(mode: TransportMode): string {
  if (mode === 'walking')  return 'walking';
  if (mode === 'cycling')  return 'cycling';
  return 'driving';
}

function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function makeVariantWaypoint(origin: GeoPoint, destination: GeoPoint, variantIndex: number): GeoPoint | null {
  const directKm = haversineKm(origin, destination);
  if (!Number.isFinite(directKm) || directKm < 0.35) return null;

  const progress = variantIndex < 2 ? 0.5 : variantIndex === 2 ? 0.35 : 0.65;
  const midLat = origin.lat + (destination.lat - origin.lat) * progress;
  const midLng = origin.lng + (destination.lng - origin.lng) * progress;
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
  return isValidCoord(lat, lng) ? { lat, lng } : null;
}

function routeSignature(route: RouteOption): string {
  const coords = (route.geometry as any)?.coordinates;
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

function parseInstruction(step: Record<string, any>): string {
  const maneuver = step.maneuver?.type as string | undefined;
  const modifier = step.maneuver?.modifier as string | undefined;
  const name = (step.name as string) || 'vía desconocida';
  const distance = Math.round(step.distance as number);
  const dirMap: Record<string, string> = {
    straight: 'continúa recto', left: 'gira a la izquierda', right: 'gira a la derecha',
    'sharp left': 'gira fuertemente a la izquierda', 'sharp right': 'gira fuertemente a la derecha',
    'slight left': 'tuerce suavemente a la izquierda', 'slight right': 'tuerce suavemente a la derecha',
    uturn: 'haz un giro de retorno',
  };
  let dir = 'continúa';
  if (maneuver && modifier) dir = dirMap[`${maneuver} ${modifier}`] ?? dirMap[maneuver] ?? dir;
  else if (maneuver)        dir = dirMap[maneuver] ?? dir;
  return `${dir} en ${name} por ${distance}m`;
}

function encodeGeoJSONToPolyline(geometry: unknown): string {
  let geo = geometry;
  if (typeof geo === 'string') { try { geo = JSON.parse(geo); } catch { return ''; } }
  if (!geo || (geo as any).type !== 'LineString' || !Array.isArray((geo as any).coordinates)) return '';
  return JSON.stringify((geo as any).coordinates);
}

function processOSRMRoute(osrmRoute: Record<string, any>, mode: TransportMode, departureHour?: number): RouteOption {
  const distanceKm = (osrmRoute.distance as number) / 1000;
  const durationMinutes = Math.ceil((osrmRoute.duration as number) / 60);
  const durationWithTraffic = departureHour !== undefined
    ? calculateETA(distanceKm, mode, departureHour)
    : durationMinutes;
  const steps: RoutingStep[] = [];
  const trafficSegments = buildTrafficSegments(osrmRoute, mode, departureHour);
  for (const leg of ((osrmRoute.legs as any[]) ?? [])) {
    for (const step of ((leg.steps as any[]) ?? [])) {
      steps.push({
        distance: (step.distance as number) / 1000,
        duration: Math.ceil((step.duration as number) / 60),
        instruction: parseInstruction(step),
        road: (step.name as string) || 'Vía desconocida',
        maneuver: step.maneuver?.type as string | undefined,
        location: step.maneuver?.location as [number, number] | undefined,
      });
    }
  }
  return {
    geometry: osrmRoute.geometry,
    distance: distanceKm,
    duration: durationMinutes,
    durationWithTraffic,
    steps,
    polyline: encodeGeoJSONToPolyline(osrmRoute.geometry),
    trafficSegments,
    trafficSummary: summarizeTraffic(trafficSegments),
  };
}

async function callOSRM(url: string, retries = 2): Promise<Record<string, any>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OSRM_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Pitzbol-Navigation/1.0' },
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`OSRM HTTP ${response.status}`);
    return await response.json() as Record<string, any>;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 500));
      return callOSRM(url, retries - 1);
    }
    throw err;
  }
}

async function fetchOSRMRouteOptions(
  points: GeoPoint[],
  mode: TransportMode,
  departureHour?: number,
  alternatives: number | false = 3,
): Promise<RouteOption[]> {
  const profile = toOSRMProfile(mode);
  const coords = points.map(p => `${p.lng},${p.lat}`).join(';');
  const radiuses = points.map((_, index) => (index === 0 || index === points.length - 1 ? '120' : '700')).join(';');
  const alternativesParam = alternatives === false ? 'false' : String(alternatives);
  const url = `${OSRM_BASE}/${profile}/${coords}?geometries=geojson&overview=full&steps=true&alternatives=${alternativesParam}&continue_straight=false&radiuses=${radiuses}`;
  const data = await callOSRM(url);
  if (data['code'] !== 'Ok') throw new Error((data['message'] as string) || 'Error en OSRM');
  const osrmRoutes = data['routes'] as any[];
  if (!osrmRoutes?.length) throw new Error('No se encontró ruta');
  return osrmRoutes.map(r => processOSRMRoute(r, mode, departureHour));
}

async function ensureThreeRouteOptions(
  origin: GeoPoint,
  destination: GeoPoint,
  mode: TransportMode,
  departureHour?: number,
  waypoints?: GeoPoint[],
): Promise<RouteOption[]> {
  const basePoints = waypoints?.length ? [origin, ...waypoints, destination] : [origin, destination];
  let routes = await fetchOSRMRouteOptions(basePoints, mode, departureHour, 2);
  if (routes.length >= 2 || waypoints?.length) return routes;

  for (let variantIndex = 0; variantIndex < 5 && routes.length < 2; variantIndex++) {
    const waypoint = makeVariantWaypoint(origin, destination, variantIndex);
    if (!waypoint) continue;
    try {
      const variantRoutes = await fetchOSRMRouteOptions([origin, waypoint, destination], mode, departureHour, false);
      routes = mergeUniqueRoutes(routes, variantRoutes);
    } catch {
      // The generated waypoint may not snap to a useful street. Try the next offset.
    }
  }

  return routes;
}

async function computeRoute(
  origin: GeoPoint, destination: GeoPoint,
  mode: TransportMode, departureHour?: number,
  waypoints?: GeoPoint[],
): Promise<RoutingResponse> {
  try {
    const routes: RouteOption[] = (await ensureThreeRouteOptions(origin, destination, mode, departureHour, waypoints))
      .sort((a, b) => (a.durationWithTraffic ?? a.duration) - (b.durationWithTraffic ?? b.duration))
      .slice(0, 2);
    if (!routes.length) return { success: false, error: 'No se encontró ruta', fallback: true };
    return { success: true, route: routes[0], routes };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al consultar OSRM';
    return { success: false, error: msg, fallback: true };
  }
}

// ── Route Handler ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  // 1. Validate Content-Type
  const ct = request.headers.get('content-type') ?? '';
  if (!ct.includes('application/json')) {
    return NextResponse.json({ success: false, error: 'Content-Type must be application/json' }, { status: 415 });
  }

  // 2. Parse body
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: 'JSON inválido' }, { status: 400 });
  }

  const { origin, destination, mode = 'driving', departureHour, waypoints } = body;

  // 3. Validate inputs
  if (!origin || !isValidCoord((origin as any).lat, (origin as any).lng)) {
    return NextResponse.json({ success: false, error: 'Origen inválido: se requiere {lat, lng}' }, { status: 400 });
  }
  if (!destination || !isValidCoord((destination as any).lat, (destination as any).lng)) {
    return NextResponse.json({ success: false, error: 'Destino inválido: se requiere {lat, lng}' }, { status: 400 });
  }
  if (typeof mode !== 'string' || !VALID_MODES.has(mode)) {
    return NextResponse.json({ success: false, error: 'Modo de transporte inválido' }, { status: 400 });
  }
  if (departureHour !== undefined) {
    const h = Number(departureHour);
    if (!Number.isInteger(h) || h < 0 || h > 23) {
      return NextResponse.json({ success: false, error: 'departureHour debe ser entero 0-23' }, { status: 400 });
    }
  }
  if (waypoints !== undefined) {
    if (!Array.isArray(waypoints) || waypoints.length > 10) {
      return NextResponse.json({ success: false, error: 'waypoints debe ser array de máximo 10 elementos' }, { status: 400 });
    }
    for (const wp of waypoints) {
      if (!isValidCoord((wp as any)?.lat, (wp as any)?.lng)) {
        return NextResponse.json({ success: false, error: 'Waypoint con coordenadas inválidas' }, { status: 400 });
      }
    }
  }

  // 4. Compute route directly via OSRM (no backend dependency)
  const orig = origin as GeoPoint;
  const dest = destination as GeoPoint;
  const safeMode = mode as TransportMode;
  const safeHour = departureHour !== undefined ? Number(departureHour) : undefined;
  const safeWaypoints = Array.isArray(waypoints)
    ? (waypoints as any[]).map(w => ({ lat: Number(w.lat), lng: Number(w.lng) }))
    : undefined;

  const result = await computeRoute(
    { lat: orig.lat, lng: orig.lng },
    { lat: dest.lat, lng: dest.lng },
    safeMode,
    safeHour,
    safeWaypoints,
  );

  // OSRM failures are non-fatal from the client's perspective (fallback handled in UI)
  return NextResponse.json(result, { status: 200 });
}
