const DEFAULT_BACKEND_ORIGIN = 'http://localhost:3001';

function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

export function getBackendOrigin(): string {
  if (typeof window !== 'undefined') {
    return '';
  }

  const configured = normalizeOrigin(
    process.env.BACKEND_INTERNAL_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      DEFAULT_BACKEND_ORIGIN
  );

  return configured;
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