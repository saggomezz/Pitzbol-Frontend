import { NextRequest, NextResponse } from 'next/server';

const IA_URL = process.env.BACKEND_INTERNAL_URL_IA
  || process.env.NEXT_PUBLIC_IA_URL
  || 'https://ia.pitzbol.me';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${IA_URL}/api/places`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch {
    return NextResponse.json({ error: 'Error al conectar con la IA' }, { status: 500 });
  }
}
