import { NextRequest, NextResponse } from 'next/server';

// Aumentar el límite de tamaño para uploads de imágenes (logo + galería)
export const maxDuration = 30;

const BACKEND = process.env.BACKEND_INTERNAL_URL || 'https://api.pitzbol.me:8443';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const res = await fetch(`${BACKEND}/api/business/register-with-images`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[proxy /api/business/register-with-images]', error);
    return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
  }
}
