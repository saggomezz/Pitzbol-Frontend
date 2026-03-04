// API para gestionar favoritos sincronizados en el backend
import { useCallback, useMemo } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Obtener token de autenticación
 */
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('pitzbol_user');
  if (!user) return null;
  const userData = JSON.parse(user);
  return userData.idToken || null;
};

/**
 * Obtener todos los favoritos del usuario desde el backend
 */
export const obtenerFavoritosBackend = async (): Promise<string[]> => {
  try {
    const token = getAuthToken();
    if (!token) {
      // Si no hay token, retornar array vacío en lugar de lanzar error
      console.warn('No hay token de autenticación, retornando favoritos vacíos');
      return [];
    }

    const response = await fetch(`${API_URL}/favorites`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error al obtener favoritos: ${response.status}`);
    }

    const data = await response.json();
    return data.favorites || [];
  } catch (error) {
    console.error('Error en obtenerFavoritosBackend:', error);
    throw error;
  }
};

/**
 * Agregar un lugar a favoritos en el backend
 */
export const agregarFavoritoBackend = async (nombreLugar: string): Promise<string[]> => {
  try {
    const token = getAuthToken();
    if (!token) {
      // Retornar error que será capturado por addFavorite
      console.warn('No hay token de autenticación para agregar favorito');
      throw new Error('AUTH_TOKEN_MISSING');
    }

    const response = await fetch(`${API_URL}/favorites`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nombreLugar }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al agregar favorito');
    }

    const data = await response.json();
    return data.favorites || [];
  } catch (error) {
    console.error('Error en agregarFavoritoBackend:', error);
    throw error;
  }
};

/**
 * Eliminar un lugar de favoritos en el backend
 */
export const eliminarFavoritoBackend = async (nombreLugar: string): Promise<string[]> => {
  try {
    const token = getAuthToken();
    if (!token) {
      // Retornar error que será capturado por removeFavorite
      console.warn('No hay token de autenticación para eliminar favorito');
      throw new Error('AUTH_TOKEN_MISSING');
    }

    const response = await fetch(`${API_URL}/favorites`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nombreLugar }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al eliminar favorito');
    }

    const data = await response.json();
    return data.favorites || [];
  } catch (error) {
    console.error('Error en eliminarFavoritoBackend:', error);
    throw error;
  }
};

/**
 * Sincronizar favoritos locales con el backend
 * (Útil cuando el usuario se loguea y tiene favoritos guardados localmente)
 */
export const sincronizarFavoritosBackend = async (favoritosLocales: string[]): Promise<string[]> => {
  try {
    const token = getAuthToken();
    if (!token) {
      // Si no hay token, retornar los favoritos locales sin sincronizar
      console.warn('No hay token de autenticación, retornando favoritos locales sin sincronizar');
      return favoritosLocales;
    }

    const response = await fetch(`${API_URL}/favorites/sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ favoritosLocales }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al sincronizar favoritos');
    }

    const data = await response.json();
    return data.favorites || [];
  } catch (error) {
    console.error('Error en sincronizarFavoritosBackend:', error);
    throw error;
  }
};

/**
 * Hook para manejar favoritos con sincronización automática
 * Usa backend si el usuario está autenticado, localStorage como fallback
 */
export const useFavoritesSync = () => {
  const isAuthenticated = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    const user = localStorage.getItem('pitzbol_user');
    if (!user) return false;
    // Verificar que también tenga un token válido
    try {
      const userData = JSON.parse(user);
      return !!userData.idToken;
    } catch {
      return false;
    }
  }, []);

  const getFavorites = useCallback(async (): Promise<string[]> => {
    if (isAuthenticated()) {
      try {
        return await obtenerFavoritosBackend();
      } catch (error) {
        console.warn('Error al obtener favoritos del backend, usando localStorage:', error);
        // Fallback a localStorage
        const stored = localStorage.getItem('pitzbol_favorites');
        return stored ? JSON.parse(stored) : [];
      }
    } else {
      // Usuario no autenticado, usar localStorage
      const stored = localStorage.getItem('pitzbol_favorites');
      return stored ? JSON.parse(stored) : [];
    }
  }, [isAuthenticated]);

  const addFavorite = useCallback(async (nombreLugar: string): Promise<string[]> => {
    if (isAuthenticated()) {
      try {
        const updated = await agregarFavoritoBackend(nombreLugar);
        // Sincronizar con localStorage
        localStorage.setItem('pitzbol_favorites', JSON.stringify(updated));
        window.dispatchEvent(new Event('favoritesChanged'));
        return updated;
      } catch (error) {
        console.error('Error al agregar favorito al backend, usando localStorage:', error);
        // Fallback a localStorage si falla el backend
        const stored = localStorage.getItem('pitzbol_favorites');
        const current = stored ? JSON.parse(stored) : [];
        if (!current.includes(nombreLugar)) {
          const updated = [...current, nombreLugar];
          localStorage.setItem('pitzbol_favorites', JSON.stringify(updated));
          window.dispatchEvent(new Event('favoritesChanged'));
          return updated;
        }
        return current;
      }
    } else {
      // Usuario no autenticado, usar localStorage
      const stored = localStorage.getItem('pitzbol_favorites');
      const current = stored ? JSON.parse(stored) : [];
      if (!current.includes(nombreLugar)) {
        const updated = [...current, nombreLugar];
        localStorage.setItem('pitzbol_favorites', JSON.stringify(updated));
        window.dispatchEvent(new Event('favoritesChanged'));
        return updated;
      }
      return current;
    }
  }, [isAuthenticated]);

  const removeFavorite = useCallback(async (nombreLugar: string): Promise<string[]> => {
    if (isAuthenticated()) {
      try {
        const updated = await eliminarFavoritoBackend(nombreLugar);
        // Sincronizar con localStorage
        localStorage.setItem('pitzbol_favorites', JSON.stringify(updated));
        window.dispatchEvent(new Event('favoritesChanged'));
        return updated;
      } catch (error) {
        console.error('Error al eliminar favorito del backend, usando localStorage:', error);
        // Fallback a localStorage si falla el backend
        const stored = localStorage.getItem('pitzbol_favorites');
        const current = stored ? JSON.parse(stored) : [];
        const updated = current.filter((fav: string) => fav !== nombreLugar);
        localStorage.setItem('pitzbol_favorites', JSON.stringify(updated));
        window.dispatchEvent(new Event('favoritesChanged'));
        return updated;
      }
    } else {
      // Usuario no autenticado, usar localStorage
      const stored = localStorage.getItem('pitzbol_favorites');
      const current = stored ? JSON.parse(stored) : [];
      const updated = current.filter((fav: string) => fav !== nombreLugar);
      localStorage.setItem('pitzbol_favorites', JSON.stringify(updated));
      window.dispatchEvent(new Event('favoritesChanged'));
      return updated;
    }
  }, [isAuthenticated]);

  const syncLocalFavorites = useCallback(async (): Promise<string[]> => {
    if (!isAuthenticated()) {
      // Si no está autenticado, retornar favoritos locales sin sincronizar
      const stored = localStorage.getItem('pitzbol_favorites');
      return stored ? JSON.parse(stored) : [];
    }
    
    try {
      const stored = localStorage.getItem('pitzbol_favorites');
      const localFavorites = stored ? JSON.parse(stored) : [];
      
      if (localFavorites.length > 0) {
        const synced = await sincronizarFavoritosBackend(localFavorites);
        localStorage.setItem('pitzbol_favorites', JSON.stringify(synced));
        window.dispatchEvent(new Event('favoritesChanged'));
        return synced;
      }
      
      // Si no hay favoritos locales, obtener del backend
      const backendFavorites = await obtenerFavoritosBackend();
      localStorage.setItem('pitzbol_favorites', JSON.stringify(backendFavorites));
      return backendFavorites;
    } catch (error) {
      console.error('Error al sincronizar favoritos:', error);
      // En caso de error, retornar favoritos locales como fallback
      const stored = localStorage.getItem('pitzbol_favorites');
      return stored ? JSON.parse(stored) : [];
    }
  }, [isAuthenticated]);

  return useMemo(() => ({
    getFavorites,
    addFavorite,
    removeFavorite,
    syncLocalFavorites,
    isAuthenticated,
  }), [getFavorites, addFavorite, removeFavorite, syncLocalFavorites, isAuthenticated]);
};
