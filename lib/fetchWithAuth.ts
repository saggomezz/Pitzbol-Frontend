const API_BASE = '/api';

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

// Umbral: renovar el token cuando le quede menos de 1 día de vida
const REFRESH_THRESHOLD_MS = 24 * 60 * 60 * 1000;

function isTokenExpiringSoon(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return false;
    const expiresAt = payload.exp * 1000;
    return expiresAt - Date.now() < REFRESH_THRESHOLD_MS;
  } catch {
    return false;
  }
}

async function tryRefreshToken(currentToken?: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh-token`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {}),
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data.token) {
      localStorage.setItem('pitzbol_token', data.token);
      return data.token;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Returns a usable JWT token for authenticated realtime connections.
 * - If `forceRefresh` is true, it always attempts refresh first.
 * - Otherwise, it tries to recover missing tokens from refresh-token cookie
 *   and proactively refreshes near-expiration tokens.
 */
export async function ensureValidAuthToken(forceRefresh = false): Promise<string | null> {
  let token = localStorage.getItem('pitzbol_token') || '';

  if (forceRefresh) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = tryRefreshToken(token || undefined).finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
    }

    const refreshed = await refreshPromise;
    return refreshed || null;
  }

  if (!token) {
    const recovered = await tryRefreshToken();
    if (recovered) token = recovered;
  }

  if (token && isTokenExpiringSoon(token)) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = tryRefreshToken(token).finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
    }

    const refreshed = await refreshPromise;
    if (refreshed) token = refreshed;
  }

  return token || null;
}

/**
 * fetch wrapper that automatically refreshes JWT tokens.
 * - Proactively refreshes the token when it's close to expiring (< 1 day left).
 * - On 401, attempts to refresh once and retries the original request.
 * - If refresh fails, clears auth state and redirects to home.
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const resolvedUrl = url;
  let token = (await ensureValidAuthToken()) || '';

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(resolvedUrl, {
    ...options,
    credentials: 'include',
    headers,
  });

  if (response.status !== 401) {
    return response;
  }

  // Token ausente/expirado — intentar refresh (deduplicado entre requests concurrentes)
  if (!isRefreshing) {
    isRefreshing = true;
    refreshPromise = tryRefreshToken(token).finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });
  }

  const newToken = await refreshPromise;

  if (!newToken) {
    // Refresh failed — solo limpiar el token expirado, NO los datos del usuario.
    // Borrar pitzbol_user causaría que el perfil (rol, especialidades, etc.) desaparezca.
    localStorage.removeItem('pitzbol_token');
    // Notificar a la UI que la sesión expiró para que pueda mostrar el modal de login
    // o redirigir. Las páginas pueden escuchar `pitzbol:auth-expired`.
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('pitzbol:auth-expired'));
      } catch { /* ignore */ }
    }
    return response;
  }

  // Retry original request with new token
  headers['Authorization'] = `Bearer ${newToken}`;
  return fetch(resolvedUrl, {
    ...options,
    credentials: 'include',
    headers,
  });
}
