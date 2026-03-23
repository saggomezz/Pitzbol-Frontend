// Middleware simple - solo permite pasar las peticiones
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  return NextResponse.next();
}

// No aplicar matcher para evitar conflictos
export const config = {
  matcher: [],
};
