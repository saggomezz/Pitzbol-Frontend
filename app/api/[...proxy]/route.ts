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
  const timeoutMs = isHeavy ? PROXY_FETCH_TIMEOUT_MS : 30_000;

  try {
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

    const res = await fetch(backendUrl, {
      method: req.method,
      headers,
      body: hasBody ? req.body : undefined,
      signal: AbortSignal.timeout(timeoutMs),
      // @ts-ignore - duplex es válido en undici/Node 18+
      duplex: hasBody ? "half" : undefined,
    });

    const responseHeaders = new Headers();
    const ct = res.headers.get("content-type");
    if (ct) responseHeaders.set("content-type", ct);
    responseHeaders.set("cache-control", "no-cache, no-store, must-revalidate");

    // Reenviar el body y el status real del backend para que el frontend
    // pueda mostrar el error específico (401/403/404/409/500…) en lugar de
    // un 503 genérico.
    const body = await res.arrayBuffer();
    return new NextResponse(body, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    const isAbort =
      err?.name === "TimeoutError" ||
      err?.name === "AbortError" ||
      /aborted|timeout/i.test(String(err?.message || ""));

    console.error(
      `[proxy] ${isAbort ? "Timeout" : "Error"} forwarding to ${backendUrl} (${timeoutMs}ms):`,
      err?.message
    );

    if (isAbort) {
      // 504 Gateway Timeout es el código correcto cuando el upstream no respondió a tiempo.
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

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
