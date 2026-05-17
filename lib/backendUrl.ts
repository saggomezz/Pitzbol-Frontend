const DEFAULT_BACKEND_ORIGIN = 'http://localhost:3001';

function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

export function getBackendOrigin(): string {
  // Allow tests running in jsdom to point to a real backend
  if (typeof window !== 'undefined') {
    const win: any = window;
    if (win && win.__TEST_BACKEND_URL__) {
      return normalizeOrigin(win.__TEST_BACKEND_URL__);
    }
  }

  return normalizeOrigin(
    process.env.BACKEND_INTERNAL_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      DEFAULT_BACKEND_ORIGIN
  );
}

export function getApiBaseUrl(): string {
  const origin = getBackendOrigin();
  return origin ? `${origin}/api` : '/api';
}

export function getSocketBackendOrigin(): string {
  return normalizeOrigin(
    process.env.BACKEND_INTERNAL_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      DEFAULT_BACKEND_ORIGIN
  );
}