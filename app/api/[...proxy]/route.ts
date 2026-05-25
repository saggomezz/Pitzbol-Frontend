import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.pitzbol.me:8443";

// Forzar Node.js runtime (no edge) para soportar fetch streaming + maxDuration largo
export const runtime = "nodejs";
// Permitir hasta 60 s en Vercel — las operaciones del admin (archivar/desarchivar/
// gestionar negocio) escriben en Firestore + notifican + emiten sockets y pueden
// superar el límite por defecto de la función serverless.
export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Timeout aplicado al fetch hacia el backend. Más alto que antes (eran 15 s)
// porque en producción con cold start de Firestore y Cloudinary se excedía y
// el proxy respondía 503 "Backend no disponible" enmascarando el error real.
const PROXY_FETCH_TIMEOUT_MS = 55_000;

// Endpoints conocidos por ser pesados (operaciones admin batch / subida de imágenes)
// donde queremos usar el timeout máximo y nunca abortar antes de tiempo.
const HEAVY_PATH_PATTERNS: RegExp[] = [
  /^admin\/negocios\//,
  /^admin\/guias\//,
  /^business\/register/,
];

// Endpoints donde es seguro reintentar automáticamente cuando el upstream responde
// 502/503/504 (típico de un servidor en cold start). Solo idempotentes o acciones
// admin que ya validan el estado del recurso antes de mutarlo.
const RETRY_SAFE_PATH_PATTERNS: RegExp[] = [
  /^admin\/negocios\/[^/]+\/archivar$/,
  /^admin\/negocios\/[^/]+\/desarchivar$/,
  /^admin\/negocios\/[^/]+\/regresar-pendientes$/,
  /^admin\/negocios\/[^/]+\/eliminar-permanente$/,
  /^admin\/negocios\/[^/]+\/mover-imagenes$/,
  /^admin\/negocios\/[^/]+\/actualizar-notificaciones$/,
  /^admin\/negocios\/gestionar$/,
];

const RETRYABLE_STATUS = new Set([502, 503, 504]);
const MAX_UPSTREAM_RETRIES = 2; // 1 intento + 2 reintentos = 3 totales
const RETRY_DELAY_MS = 1500;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// Proxy catch-all: reenvía CUALQUIER /api/* al backend server-side
// Esto elimina la necesidad de llamar a api.pitzbol.me directamente desde el browser:
// - Sin DNS resolution en el cliente
// - Sin CORS
// - Sin redirect loops del rewrite de Vercel
async function handler(req: NextRequest, { params }: { params: Promise<{ proxy: string[] }> }) {
  const { proxy } = await params;
  // Re-encodear cada segmento para que caracteres especiales (¿, ?, etc.)
  // no sean interpretados como separadores de query string por Express
  const path = proxy.map(encodeURIComponent).join("/");
  const url = new URL(req.url);
  const query = url.search;
  const backendUrl = `${BACKEND}/api/${path}${query}`;

  const joinedPath = proxy.join("/");
  const isHeavy = HEAVY_PATH_PATTERNS.some((rx) => rx.test(joinedPath));
  const isRetrySafe = RETRY_SAFE_PATH_PATTERNS.some((rx) => rx.test(joinedPath));
  const timeoutMs = isHeavy ? PROXY_FETCH_TIMEOUT_MS : 30_000;

  const headers: Record<string, string> = {
    "Content-Type": req.headers.get("content-type") || "application/json",
  };

  const auth = req.headers.get("authorization");
  if (auth) headers["Authorization"] = auth;

  const cookie = req.headers.get("cookie");
  if (cookie) headers["Cookie"] = cookie;

  const accept = req.headers.get("accept");
  if (accept) headers["Accept"] = accept;

  const acceptLang = req.headers.get("accept-language");
  if (acceptLang) headers["Accept-Language"] = acceptLang;

  const hasBody = ["POST", "PUT", "PATCH"].includes(req.method);

  // Si vamos a poder reintentar y hay body, necesitamos bufferizar para poder
  // reenviarlo en cada intento (los ReadableStream solo se consumen una vez).
  let bufferedBody: ArrayBuffer | undefined;
  if (hasBody && isRetrySafe && req.body) {
    try {
      bufferedBody = await req.arrayBuffer();
    } catch {
      bufferedBody = undefined;
    }
  }

  const maxAttempts = isRetrySafe ? MAX_UPSTREAM_RETRIES + 1 : 1;
  let lastError: any = null;
  let lastResponse: Response | null = null;
  let lastBody: ArrayBuffer | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(backendUrl, {
        method: req.method,
        headers,
        body: hasBody ? (bufferedBody ?? req.body) : undefined,
        signal: AbortSignal.timeout(timeoutMs),
        // @ts-ignore - duplex es válido en undici/Node 18+
        duplex: hasBody && !bufferedBody ? "half" : undefined,
      });

      // Si el upstream devuelve un código retryable y todavía nos quedan intentos,
      // esperamos y volvemos a intentar (cold start típico de Render/Railway).
      if (RETRYABLE_STATUS.has(res.status) && attempt < maxAttempts) {
        console.warn(
          `[proxy] Upstream ${res.status} en ${joinedPath} (intento ${attempt}/${maxAttempts}). Reintentando en ${RETRY_DELAY_MS * attempt}ms...`
        );
        // Consumimos el body para liberar la conexión.
        try { await res.arrayBuffer(); } catch { /* ignore */ }
        await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }

      const responseHeaders = new Headers();
      const ct = res.headers.get("content-type");
      if (ct) responseHeaders.set("content-type", ct);
      responseHeaders.set("cache-control", "no-cache, no-store, must-revalidate");

      const body = await res.arrayBuffer();
      lastResponse = res;
      lastBody = body;

      return new NextResponse(body, {
        status: res.status,
        headers: responseHeaders,
      });
    } catch (err: any) {
      lastError = err;
      const isAbort =
        err?.name === "TimeoutError" ||
        err?.name === "AbortError" ||
        /aborted|timeout/i.test(String(err?.message || ""));

      // Si es un error de red/timeout y todavía nos quedan intentos, reintentamos.
      if (isRetrySafe && attempt < maxAttempts) {
        console.warn(
          `[proxy] ${isAbort ? "Timeout" : "Error de red"} en ${joinedPath} (intento ${attempt}/${maxAttempts}): ${err?.message}. Reintentando...`
        );
        await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }

      console.error(
        `[proxy] ${isAbort ? "Timeout" : "Error"} forwarding to ${backendUrl} (${timeoutMs}ms):`,
        err?.message
      );

      if (isAbort) {
        return NextResponse.json(
          {
            error: "Tiempo de espera agotado",
            message:
              "La operación tardó demasiado en el servidor. Inténtalo de nuevo en unos segundos.",
          },
          { status: 504 }
        );
      }

      return NextResponse.json(
        { error: "Backend no disponible" },
        { status: 502 }
      );
    }
  }

  // Si salimos del loop por agotar reintentos sin éxito, devolvemos lo último que tuvimos.
  if (lastResponse && lastBody) {
    const responseHeaders = new Headers();
    const ct = lastResponse.headers.get("content-type");
    if (ct) responseHeaders.set("content-type", ct);
    responseHeaders.set("cache-control", "no-cache, no-store, must-revalidate");
    console.error(
      `[proxy] Upstream sigue devolviendo ${lastResponse.status} en ${joinedPath} tras ${maxAttempts} intentos.`
    );
    return new NextResponse(lastBody, {
      status: lastResponse.status,
      headers: responseHeaders,
    });
  }

  console.error(`[proxy] Fall\u00f3 ${joinedPath} tras ${maxAttempts} intentos:`, lastError?.message);
  return NextResponse.json(
    { error: "Backend no disponible" },
    { status: 502 }
  );
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
