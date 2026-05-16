import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'https://api.pitzbol.me:8443';

const VALID_MODES = new Set([
  'driving',
  'walking',
  'cycling',
  'transit-like',
  'rideshare-like',
]);

function isValidCoord(lat: unknown, lng: unknown): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    isFinite(lat) && isFinite(lng) &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180
  );
}

export async function POST(request: NextRequest) {
  // ── 1. Validate Content-Type ────────────────────────────────────────────────
  const ct = request.headers.get('content-type') ?? '';
  if (!ct.includes('application/json')) {
    return NextResponse.json(
      { success: false, error: 'Content-Type must be application/json' },
      { status: 415 },
    );
  }

  // ── 2. Parse & validate body ────────────────────────────────────────────────
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'JSON inválido' },
      { status: 400 },
    );
  }

  const { origin, destination, mode = 'driving', departureHour, waypoints } = body ?? {};

  if (!origin || !isValidCoord(origin.lat, origin.lng)) {
    return NextResponse.json(
      { success: false, error: 'Origen inválido: se requiere {lat, lng}' },
      { status: 400 },
    );
  }
  if (!destination || !isValidCoord(destination.lat, destination.lng)) {
    return NextResponse.json(
      { success: false, error: 'Destino inválido: se requiere {lat, lng}' },
      { status: 400 },
    );
  }
  if (!VALID_MODES.has(mode)) {
    return NextResponse.json(
      { success: false, error: 'Modo de transporte inválido' },
      { status: 400 },
    );
  }
  if (departureHour !== undefined) {
    const h = Number(departureHour);
    if (!Number.isInteger(h) || h < 0 || h > 23) {
      return NextResponse.json(
        { success: false, error: 'departureHour debe ser entero 0-23' },
        { status: 400 },
      );
    }
  }
  if (waypoints !== undefined) {
    if (!Array.isArray(waypoints) || waypoints.length > 10) {
      return NextResponse.json(
        { success: false, error: 'waypoints debe ser array de máximo 10 elementos' },
        { status: 400 },
      );
    }
    for (const wp of waypoints) {
      if (!isValidCoord(wp?.lat, wp?.lng)) {
        return NextResponse.json(
          { success: false, error: 'Waypoint con coordenadas inválidas' },
          { status: 400 },
        );
      }
    }
  }

  // ── 3. Build clean payload (no extra fields forwarded) ─────────────────────
  const safeBody: Record<string, unknown> = {
    origin:      { lat: origin.lat,      lng: origin.lng },
    destination: { lat: destination.lat, lng: destination.lng },
    mode,
  };
  if (departureHour !== undefined) safeBody.departureHour = Number(departureHour);
  if (Array.isArray(waypoints))    safeBody.waypoints = waypoints.map((w: any) => ({ lat: w.lat, lng: w.lng }));

  // ── 4. Forward real client IP so backend rate-limiter works per-user ────────
  const clientIp =
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    '127.0.0.1';

  // ── 5. Proxy to backend with timeout ───────────────────────────────────────
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000); // 15 s max

  try {
    const response = await fetch(`${BACKEND_URL}/api/lugares/routing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': clientIp,
        'X-Real-IP': clientIp,
      },
      body: JSON.stringify(safeBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error?.name === 'AbortError') {
      return NextResponse.json(
        { success: false, error: 'El servicio de rutas tardó demasiado', fallback: true },
        { status: 504 },
      );
    }
    console.error('[routing proxy] Error:', error?.message);
    return NextResponse.json(
      { success: false, error: 'Error al calcular ruta', fallback: true },
      { status: 500 },
    );
  }
}
