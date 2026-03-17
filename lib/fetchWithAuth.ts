const API_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001').replace(/\/+$/, '');

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function tryRefreshToken(expiredToken: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh-token`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${expiredToken}`,
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
 * fetch wrapper that automatically refreshes expired JWT tokens.
 * On 401, attempts to refresh the token once and retries the original request.
 * If refresh fails, clears auth state and redirects to home.
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem('pitzbol_token') || '';

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  });

  if (response.status !== 401 || !token) {
    return response;
  }

  // Token expired — try refresh (deduplicate concurrent refreshes)
  if (!isRefreshing) {
    isRefreshing = true;
    refreshPromise = tryRefreshToken(token).finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });
  }

  const newToken = await refreshPromise;

  if (!newToken) {
    // Refresh failed — clear auth and redirect
    localStorage.removeItem('pitzbol_token');
    localStorage.removeItem('pitzbol_user');
    window.location.href = '/';
    return response;
  }

  // Retry original request with new token
  headers['Authorization'] = `Bearer ${newToken}`;
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  });
}
