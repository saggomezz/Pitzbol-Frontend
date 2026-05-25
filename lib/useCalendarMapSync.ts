/**
 * Hook para integración bidireccional entre Calendario y Mapa
 * Permite navegar desde calendario a mapa y viceversa
 * Sincroniza eventos y rutas entre ambas vistas
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GeoPoint } from '@/lib/geoClient';

export interface CalendarEvent {
  id: string;
  nombre: string;
  fecha: string; // ISO date
  hora?: string; // HH:mm
  lugar: string;
  ubicacion?: GeoPoint;
  duracionMinutos?: number;
  notas?: string;
}

export interface MapRouteSnapshot {
  eventId: string;
  origin: GeoPoint;
  destination: GeoPoint;
  transportMode: string;
  distance: number;
  duration: number;
  waypoints?: GeoPoint[];
}

/**
 * Hook para sincronizar calendario y mapa
 */
export function useCalendarMapSync() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [routes, setRoutes] = useState<Map<string, MapRouteSnapshot>>(new Map());
  const [mapCenter, setMapCenter] = useState<GeoPoint | null>(null);

  // Leer parámetros de URL al montar
  useEffect(() => {
    const eventId = searchParams.get('evento');
    const date = searchParams.get('fecha');

    if (eventId) setActiveEventId(eventId);
    if (date) setActiveDate(date);
  }, [searchParams]);

  // Navegar a evento desde mapa
  const navigateToEvent = useCallback(
    (eventId: string, date: string) => {
      setActiveEventId(eventId);
      setActiveDate(date);

      // Actualizar URL
      const params = new URLSearchParams();
      params.set('evento', eventId);
      params.set('fecha', date);

      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router]
  );

  // Navegar a evento en calendario desde mapa
  const navigateToCalendar = useCallback(
    (date: string) => {
      router.push(`/calendario?fecha=${date}`, { scroll: false });
    },
    [router]
  );

  // Navegar a mapa desde calendario
  const navigateToMap = useCallback(
    (location: GeoPoint, eventId?: string, date?: string) => {
      setMapCenter(location);

      const params = new URLSearchParams();
      if (eventId) params.set('evento', eventId);
      if (date) params.set('fecha', date);

      router.push(`/mapa?${params.toString()}`, { scroll: false });
    },
    [router]
  );

  // Guardar ruta para evento
  const saveRouteForEvent = useCallback(
    (eventId: string, route: MapRouteSnapshot) => {
      const newRoutes = new Map(routes);
      newRoutes.set(eventId, route);
      setRoutes(newRoutes);

      // Guardar en localStorage para persistencia entre sesiones
      try {
        const routesObj = Object.fromEntries(newRoutes);
        localStorage.setItem('pitzbol_event_routes', JSON.stringify(routesObj));
      } catch (err) {
        console.warn('[useCalendarMapSync] Error guardando rutas:', err);
      }
    },
    [routes]
  );

  // Cargar rutas desde localStorage al montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pitzbol_event_routes');
      if (saved) {
        const routesObj = JSON.parse(saved) as Record<string, MapRouteSnapshot>;
        const routesMap = new Map<string, MapRouteSnapshot>(Object.entries(routesObj));
        setRoutes(routesMap);
      }
    } catch (err) {
      console.warn('[useCalendarMapSync] Error cargando rutas:', err);
    }
  }, []);

  // Obtener ruta para evento
  const getRouteForEvent = useCallback(
    (eventId: string) => {
      return routes.get(eventId) || null;
    },
    [routes]
  );

  // Compartir ruta (generar URL)
  const generateShareLink = useCallback(
    (eventId: string) => {
      const params = new URLSearchParams();
      params.set('evento', eventId);
      params.set('compartida', 'true');

      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      return `${baseUrl}/mapa?${params.toString()}`;
    },
    []
  );

  return {
    activeEventId,
    activeDate,
    mapCenter,
    routes: Array.from(routes.entries()),
    navigateToEvent,
    navigateToCalendar,
    navigateToMap,
    saveRouteForEvent,
    getRouteForEvent,
    generateShareLink,
    setMapCenter
  };
}

/**
 * Hook para sincronizar ubicación entre dos eventos consecutivos
 */
export function useEventChaining(events: CalendarEvent[]) {
  return useCallback(
    (currentEventIndex: number) => {
      if (
        currentEventIndex < 0 ||
        currentEventIndex >= events.length - 1
      ) {
        return null;
      }

      const current = events[currentEventIndex];
      const next = events[currentEventIndex + 1];

      if (!current.ubicacion || !next.ubicacion) {
        return null;
      }

      return {
        from: current,
        to: next,
        route: {
          origin: current.ubicacion,
          destination: next.ubicacion
        }
      };
    },
    [events]
  );
}

/**
 * Función para generar sugerencias de ruta entre eventos
 */
export function suggestRoutesForDay(events: CalendarEvent[]): Array<{
  fromIndex: number;
  toIndex: number;
  from: CalendarEvent;
  to: CalendarEvent;
}> {
  const suggestions = [];

  for (let i = 0; i < events.length - 1; i++) {
    const current = events[i];
    const next = events[i + 1];

    if (current.ubicacion && next.ubicacion) {
      // No sugerir ruta si los eventos están en el mismo lugar
      const isSameLocation =
        current.ubicacion.lat === next.ubicacion.lat &&
        current.ubicacion.lng === next.ubicacion.lng;

      if (!isSameLocation) {
        suggestions.push({
          fromIndex: i,
          toIndex: i + 1,
          from: current,
          to: next
        });
      }
    }
  }

  return suggestions;
}

/**
 * Hook para mostrar indicador visual del progreso del día
 */
export function useDayProgress(events: CalendarEvent[], currentEventId?: string) {
  const [progress, setProgress] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const updateProgress = () => {
      const now = new Date();

      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        const eventDate = new Date(`${event.fecha}T${event.hora || '00:00'}`);
        const eventEnd = new Date(
          eventDate.getTime() + (event.duracionMinutos || 60) * 60000
        );

        if (now >= eventDate && now <= eventEnd) {
          setCurrentIndex(i);
          const total = eventEnd.getTime() - eventDate.getTime();
          const elapsed = now.getTime() - eventDate.getTime();
          setProgress((elapsed / total) * 100);
          return;
        }
      }

      setCurrentIndex(-1);
      setProgress(0);
    };

    updateProgress();
    intervalRef.current = setInterval(updateProgress, 60000); // Actualizar cada minuto

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [events]);

  return { progress, currentIndex, currentEvent: currentIndex >= 0 ? events[currentIndex] : null };
}

/**
 * Crear URL para compartir itinerario del día
 */
export function createItineraryShareLink(
  events: CalendarEvent[],
  date: string
): string {
  try {
    const eventIds = events.map(e => e.id).join(',');
    const params = new URLSearchParams({
      itinerario: eventIds,
      fecha: date
    });

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/mapa?${params.toString()}`;
  } catch {
    return '';
  }
}
