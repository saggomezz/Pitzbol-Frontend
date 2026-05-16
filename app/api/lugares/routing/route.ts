import { NextRequest, NextResponse } from 'next/server';

// ── Types ─────────────────────────────────────────────────────────────────────
type TransportMode = 'driving' | 'walking' | 'cycling' | 'transit-like' | 'rideshare-like';
interface GeoPoint { lat: number; lng: number; }
interface RoutingStep {
  distance: number; duration: number; instruction: string;
  road?: string; maneuver?: string; location?: [number, number];
}
interface RouteOption {
  geometry: unknown; distance: number; duration: number;
  durationWithTraffic?: number; steps: RoutingStep[]; polyline?: string;
}
interface RoutingResponse {
  success: boolean; route?: RouteOption; routes?: RouteOption[];
  error?: string; fallback?: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const OSRM_BASE = 'https://router.project-osrm.org/route/v1';
const OSRM_TIMEOUT_MS = 10_000;
const VALID_MODES = new Set<string>(['driving', 'walking', 'cycling', 'transit-like', 'rideshare-like']);

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

function calculateETA(distanceKm: number, mode: TransportMode, hour: number): number {
  if (distanceKm <= 0) return 0;
  const speeds: Record<TransportMode, number> = {
    driving: 30, walking: 5, cycling: 15, 'transit-like': 20, 'rideshare-like': 25,
  };
  let speed = speeds[mode];
  if ((mode === 'driving' || mode === 'rideshare-like') && isValidHour(hour)) {
    speed = speed / getTrafficFactor(hour);
  }
  return Math.ceil((distanceKm / speed) * 60);
}

function toOSRMProfile(mode: TransportMode): string {
  if (mode === 'walking')  return 'walking';
  if (mode === 'cycling')  return 'cycling';
  return 'driving';
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

async function computeRoute(
  origin: GeoPoint, destination: GeoPoint,
  mode: TransportMode, departureHour?: number,
  waypoints?: GeoPoint[],
): Promise<RoutingResponse> {
  const profile = toOSRMProfile(mode);
  const allPoints = waypoints?.length ? [origin, ...waypoints, destination] : [origin, destination];
  const coords = allPoints.map(p => `${p.lng},${p.lat}`).join(';');
  const url = `${OSRM_BASE}/${profile}/${coords}?geometries=geojson&steps=true&alternatives=3`;
  try {
    const data = await callOSRM(url);
    if (data['code'] !== 'Ok') {
      return { success: false, error: (data['message'] as string) || 'Error en OSRM', fallback: true };
    }
    const osrmRoutes = data['routes'] as any[];
    if (!osrmRoutes?.length) {
      return { success: false, error: 'No se encontró ruta', fallback: true };
    }
    const routes: RouteOption[] = osrmRoutes.map(r => processOSRMRoute(r, mode, departureHour));
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
