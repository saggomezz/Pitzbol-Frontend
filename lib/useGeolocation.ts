/**
 * Hook React para geolocalización en tiempo real del usuario
 * Usa Geolocation API del navegador con throttling para evitar overload
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { requestLocationPermission } from '@/lib/locationPermission';

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number; // metros
  heading?: number; // grados (0-360)
  speed?: number; // m/s
  timestamp: number; // milliseconds
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number; // milliseconds
  maximumAge?: number; // milliseconds
  throttleMs?: number; // Mínimo tiempo entre actualizaciones
  onError?: (error: GeolocationPositionError) => void;
  // Si true, se pedirá confirmación al usuario antes de usar la API de geolocalización.
  // Si se proporciona `requestPermission`, se usará esa función (puede devolver boolean o Promise<boolean>).
  confirmBeforeUse?: boolean;
  requestPermission?: () => boolean | Promise<boolean>;
}

const DEFAULT_OPTIONS: GeolocationOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
  throttleMs: 1000 // Actualizar máximo cada 1 segundo
};

/**
 * Hook para rastrear ubicación del usuario
 * Retorna ubicación actual y estado de carga/error
 */
export function useGeolocation(options: GeolocationOptions = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };

  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const convertPosition = useCallback((position: GeolocationPosition): UserLocation => {
    const { latitude, longitude, accuracy, heading, speed } = position.coords;

    return {
      lat: latitude,
      lng: longitude,
      accuracy,
      heading: heading ?? undefined,
      speed: speed ?? undefined,
      timestamp: position.timestamp
    };
  }, []);

  const askPermission = useCallback(async () => {
    if (!config.confirmBeforeUse) {
      return true;
    }

    if (config.requestPermission) {
      try {
        return await Promise.resolve(config.requestPermission());
      } catch {
        return false;
      }
    }

    try {
      return await requestLocationPermission();
    } catch {
      try {
        return window.confirm('¿Deseas compartir tu ubicación con Pitzbol para esta acción?');
      } catch {
        return false;
      }
    }
  }, [config]);

  const getCurrentPosition = useCallback((positionOptions?: PositionOptions) => {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, positionOptions);
    });
  }, []);

  const requestCurrentLocation = useCallback(async (): Promise<UserLocation | null> => {
    if (!navigator.geolocation) {
      setError('Geolocalización no soportada en este navegador');
      return null;
    }

    const allowed = await askPermission();
    if (!allowed) {
      setError('Permiso de ubicación no concedido por el usuario');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const position = await getCurrentPosition({
        enableHighAccuracy: config.enableHighAccuracy,
        timeout: config.timeout,
        maximumAge: config.maximumAge
      });

      const nextLocation = convertPosition(position);
      setLocation(nextLocation);
      return nextLocation;
    } catch (err: any) {
      setError(err.message || 'Error al obtener la ubicación');
      config.onError?.(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [askPermission, convertPosition, config, getCurrentPosition]);

  const startTracking = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocalización no soportada en este navegador');
      return;
    }

    const firstLocation = await requestCurrentLocation();
    if (!firstLocation) {
      return;
    }

    setLoading(true);
    setError(null);

    const throttledCallback = (position: GeolocationPosition) => {
      const now = Date.now();

      // Throttle: solo actualizar si pasó suficiente tiempo
      if (now - lastUpdateRef.current < config.throttleMs!) {
        return;
      }

      lastUpdateRef.current = now;

      setLocation(convertPosition(position));

      setLoading(false);
    };

    const errorCallback = (err: GeolocationPositionError) => {
      console.error('[useGeolocation] Error:', err.message);

      const errorMsg = {
        1: 'Permiso de ubicación denegado',
        2: 'No se pudo obtener la ubicación',
        3: 'Timeout al obtener ubicación'
      }[err.code] || 'Error desconocido de geolocalización';

      setError(errorMsg);
      setLoading(false);

      config.onError?.(err);
    };

    try {
      // Obtener ubicación inicial
      navigator.geolocation.getCurrentPosition(throttledCallback, errorCallback, {
        enableHighAccuracy: config.enableHighAccuracy,
        timeout: config.timeout,
        maximumAge: config.maximumAge
      });

      // Rastrear cambios
      watchIdRef.current = navigator.geolocation.watchPosition(
        throttledCallback,
        errorCallback,
        {
          enableHighAccuracy: config.enableHighAccuracy,
          timeout: config.timeout,
          maximumAge: config.maximumAge
        }
      );
    } catch (err: any) {
      setError(err.message || 'Error al iniciar geolocalización');
      setLoading(false);
    }
  }, [config, convertPosition, requestCurrentLocation]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    location,
    loading,
    error,
    startTracking,
    requestCurrentLocation,
    stopTracking,
    isAvailable: !!navigator.geolocation
  };
}

/**
 * Hook simplificado que comienza a rastrear automáticamente si está disponible
 */
export function useCurrentLocation(autoStart = true, options: GeolocationOptions = {}) {
  const geo = useGeolocation(options);

  useEffect(() => {
    if (autoStart && geo.isAvailable) {
      geo.startTracking();
    }
  }, [autoStart, geo.isAvailable, geo]);

  return geo;
}

/**
 * Calcular distancia entre dos ubicaciones (Haversine)
 */
export function distanceBetween(loc1: UserLocation | null, loc2: UserLocation | null): number | null {
  if (!loc1 || !loc2) return null;

  const R = 6371; // km
  const dLat = ((loc2.lat - loc1.lat) * Math.PI) / 180;
  const dLng = ((loc2.lng - loc1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((loc1.lat * Math.PI) / 180) *
      Math.cos((loc2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Obtener bearing (dirección) entre dos ubicaciones
 */
export function bearing(loc1: UserLocation, loc2: UserLocation): number {
  const dLng = ((loc2.lng - loc1.lng) * Math.PI) / 180;
  const lat1 = (loc1.lat * Math.PI) / 180;
  const lat2 = (loc2.lat * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const bearing = Math.atan2(y, x);

  return ((bearing * 180) / Math.PI + 360) % 360;
}
