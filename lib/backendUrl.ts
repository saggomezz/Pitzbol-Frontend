const DEFAULT_BACKEND_ORIGIN = 'http://localhost:3001';

function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

export function getBackendOrigin(): string {
  if (typeof window !== 'undefined') {
    // Allow tests running in jsdom to point to a real backend by setting
    // `window.__TEST_BACKEND_URL__` (used by integration tests).
    // If not set, behave as in-browser and use relative `/api` paths.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const win: any = window;
    if (win && win.__TEST_BACKEND_URL__) {
      return normalizeOrigin(win.__TEST_BACKEND_URL__);
    }
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