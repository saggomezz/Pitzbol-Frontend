import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.pitzbol.me:8443";

// Proxy catch-all: reenvía CUALQUIER /api/* al backend server-side
// Esto elimina la necesidad de llamar a api.pitzbol.me directamente desde el browser:
// - Sin DNS resolution en el cliente
// - Sin CORS
// - Sin redirect loops del rewrite de Vercel
async function handler(req: NextRequest, { params }: { params: { proxy: string[] } }) {
  const path = params.proxy.join("/");
  const url = new URL(req.url);
  const query = url.search;
  const backendUrl = `${BACKEND}/api/${path}${query}`;

  try {
    const headers: Record<string, string> = {
      "Content-Type": req.headers.get("content-type") || "application/json",
    };

    const auth = req.headers.get("authorization");
    if (auth) headers["Authorization"] = auth;

    const cookie = req.headers.get("cookie");
    if (cookie) headers["Cookie"] = cookie;

    const hasBody = ["POST", "PUT", "PATCH"].includes(req.method);

    const res = await fetch(backendUrl, {
      method: req.method,
      headers,
      body: hasBody ? req.body : undefined,
      signal: AbortSignal.timeout(15000),
      // @ts-ignore
      duplex: hasBody ? "half" : undefined,
    });

    const responseHeaders = new Headers();
    const ct = res.headers.get("content-type");
    if (ct) responseHeaders.set("content-type", ct);
    responseHeaders.set("cache-control", "no-cache, no-store, must-revalidate");

    const body = await res.arrayBuffer();
    return new NextResponse(body, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error(`[proxy] Error forwarding to ${backendUrl}:`, err?.message);
    return NextResponse.json(
      { error: "Backend no disponible", message: err?.message },
      { status: 503 }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
