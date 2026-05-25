import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "https://pitzbol-backend.onrender.com";

// Proxy server-side para /api/lugares — evita CORS y redirect loops del proxy de Vercel
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const query = url.searchParams.toString();
    const backendUrl = `${BACKEND}/api/lugares${query ? `?${query}` : ""}`;

    const res = await fetch(backendUrl, {
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json({ lugares: [] }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
    });
  } catch {
    return NextResponse.json({ lugares: [] }, { status: 500 });
  }
}
