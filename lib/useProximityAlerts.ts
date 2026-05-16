/**
 * Hook React para alertas de proximidad
 * Dispara notificaciones del navegador cuando el usuario se acerca a lugares/destinos
 * Solo funciona si el usuario otorgó permisos de notificación (PWA-compatible)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useCurrentLocation, UserLocation, distanceBetween } from './useGeolocation';
import { GeoPoint } from './geoClient';

export interface ProximityAlert {
  id: string;
  name: string;
  location: GeoPoint;
  radiusKm: number;
  triggered: boolean;
  triggeredAt?: number;
}

export interface ProximityAlertConfig {
  enabled?: boolean;
  checkIntervalMs?: number;
  notificationTitle?: string;
  geolocationOptions?: any;
  autoRequestPermission?: boolean;
}

const DEFAULT_CONFIG: ProximityAlertConfig = {
  enabled: true,
  checkIntervalMs: 1000, // Revisar cada segundo
  notificationTitle: 'Pitzbol',
  autoRequestPermission: true
};

/**
 * Hook para monitorear alertas de proximidad
 */
export function useProximityAlerts(
  alerts: ProximityAlert[] = [],
  config: ProximityAlertConfig = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    'default'
  );
  const [activeAlerts, setActiveAlerts] = useState<ProximityAlert[]>(alerts);
  const [triggeredAlerts, setTriggeredAlerts] = useState<string[]>([]);

  const geo = useCurrentLocation(false, finalConfig.geolocationOptions);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const requestedAlertIdsRef = useRef<Set<string>>(new Set());

  // Solicitar permiso de notificaciones
  useEffect(() => {
    if (finalConfig.autoRequestPermission && 'Notification' in window) {
      const permission = Notification.permission;
      setNotificationPermission(permission);

      if (permission === 'default') {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission);
        });
      }
    }
  }, [finalConfig.autoRequestPermission]);

  // Actualizar alertas activas
  useEffect(() => {
    setActiveAlerts(alerts);
  }, [alerts]);

  // Disparar notificación
  const sendNotification = useCallback((alert: ProximityAlert, distance: number) => {
    if (notificationPermission !== 'granted') return;

    try {
      new Notification(`${finalConfig.notificationTitle} - Cerca`, {
        body: `Estás a ${distance.toFixed(2)}km de ${alert.name}`,
        icon: '/icon-192x192.png', // PWA icon
        badge: '/icon-192x192.png',
        tag: `proximity-${alert.id}`, // Deduplica notificaciones del mismo lugar
        requireInteraction: false,
        data: {
          alertId: alert.id,
          url: `/informacion/${encodeURIComponent(alert.name)}`
        }
      });
    } catch (error: any) {
      console.error('[useProximityAlerts] Error enviando notificación:', error);
    }
  }, [notificationPermission, finalConfig.notificationTitle]);

  // Verificar proximidad
  const checkProximity = useCallback(() => {
    if (!geo.location || !finalConfig.enabled) return;

    const userLoc: UserLocation = geo.location;

    activeAlerts.forEach(alert => {
      const distance = distanceBetween(userLoc, {
        lat: alert.location.lat,
        lng: alert.location.lng,
        timestamp: Date.now()
      });

      if (distance === null) return;

      const isNear = distance <= alert.radiusKm;

      if (isNear && !requestedAlertIdsRef.current.has(alert.id)) {
        // Primera vez que está cerca
        requestedAlertIdsRef.current.add(alert.id);
        setTriggeredAlerts(prev => [...prev, alert.id]);

        sendNotification(alert, distance);
      } else if (!isNear && requestedAlertIdsRef.current.has(alert.id)) {
        // Se alejó
        requestedAlertIdsRef.current.delete(alert.id);
        setTriggeredAlerts(prev => prev.filter(id => id !== alert.id));
      }
    });
  }, [geo.location, activeAlerts, finalConfig.enabled, sendNotification]);

  // Iniciar monitoreo
  const startMonitoring = useCallback(() => {
    if (notificationPermission !== 'granted') {
      console.warn('[useProximityAlerts] Notificaciones no permitidas');
      return;
    }

    geo.startTracking();

    checkIntervalRef.current = setInterval(() => {
      checkProximity();
    }, finalConfig.checkIntervalMs);
  }, [geo, notificationPermission, checkProximity, finalConfig.checkIntervalMs]);

  // Detener monitoreo
  const stopMonitoring = useCallback(() => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
    geo.stopTracking();
    requestedAlertIdsRef.current.clear();
    setTriggeredAlerts([]);
  }, [geo]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return {
    notificationPermission,
    triggeredAlerts,
    currentLocation: geo.location,
    locationLoading: geo.loading,
    locationError: geo.error,
    startMonitoring,
    stopMonitoring,
    requestNotificationPermission: () => {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(setNotificationPermission);
      }
    }
  };
}

/**
 * Hook simplificado para un solo destino
 */
export function useProximityAlert(
  destination: { name: string; location: GeoPoint },
  radiusKm: number = 0.5,
  config: ProximityAlertConfig = {}
) {
  const alert = useProximityAlerts(
    [
      {
        id: `${destination.location.lat},${destination.location.lng}`,
        name: destination.name,
        location: destination.location,
        radiusKm,
        triggered: false
      }
    ],
    config
  );

  return {
    ...alert,
    isTriggered: alert.triggeredAlerts.length > 0,
    distance: alert.currentLocation
      ? Math.sqrt(
          Math.pow(alert.currentLocation.lat - destination.location.lat, 2) +
            Math.pow(alert.currentLocation.lng - destination.location.lng, 2)
        ) * 111 // Aproximado: 111 km por grado
      : null
  };
}
