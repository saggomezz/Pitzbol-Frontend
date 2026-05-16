'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FiChevronDown, FiMapPin, FiAlertCircle, FiLoader, FiNavigation, FiShare2, FiSearch, FiClock, FiUser, FiTarget, FiX } from 'react-icons/fi';
import { FaCarSide, FaPersonWalking, FaBicycle, FaBusSimple, FaTaxi } from 'react-icons/fa6';
import { geocodeAddress, getRoute, RouteResponse, RouteOption, GeoPoint } from '@/lib/geoClient';
import { useGeolocation } from '@/lib/useGeolocation';
import { usePitzbolUser } from '@/lib/usePitzbolUser';

export type TransportMode = 'driving' | 'walking' | 'cycling' | 'transit-like' | 'rideshare-like';

/** Haversine distance between two lat/lng points, in metres */
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Format metres into a readable distance string */
function fmtDist(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

/** Minimum distance in metres from a lat/lng point to a polyline ([lng,lat] pairs) */
function distToPolyline(lat: number, lng: number, poly: [number, number][]): number {
  if (poly.length === 0) return Infinity;
  let min = Infinity;
  for (let i = 0; i < poly.length - 1; i++) {
    const [lng1, lat1] = poly[i];
    const [lng2, lat2] = poly[i + 1];
    const segLen2 = (lat2 - lat1) ** 2 + (lng2 - lng1) ** 2;
    const t = segLen2 < 1e-14 ? 0
      : Math.max(0, Math.min(1,
          ((lat - lat1) * (lat2 - lat1) + (lng - lng1) * (lng2 - lng1)) / segLen2));
    const d = haversineMeters(lat, lng, lat1 + t * (lat2 - lat1), lng1 + t * (lng2 - lng1));
    if (d < min) min = d;
  }
  return min;
}

/** Bearing in degrees (0=North, 90=East) from point A to point B */
function calcBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Unicode arrow for a maneuver type */
function maneuverIcon(type?: string, modifier?: string): string {
  if (type === 'arrive') return '📍';
  if (type === 'depart') return '▶';
  if (type === 'roundabout' || type === 'rotary') return '↻';
  if (type === 'uturn') return '↩';
  if (modifier === 'right' || modifier === 'slight right') return '↱';
  if (modifier === 'left' || modifier === 'slight left') return '↰';
  if (modifier === 'sharp right') return '↗';
  if (modifier === 'sharp left') return '↖';
  return '↑';
}

export type OriginMarkerSource = 'default' | 'search' | 'current-location' | 'manual-map' | 'clear';

export interface OriginMarkerMeta {
  source: OriginMarkerSource;
  manual: boolean;
}

export interface MapOriginEvent {
  point: GeoPoint;
  eventId: number;
  manual: boolean;
}

export interface NavigationPanelProps {
  placeName: string;
  destination: GeoPoint;
  placeAddress?: string;
  placeCost?: string;
  placeCategory?: string;
  onNavigationStart?: () => void;
  onExpandedChange?: (expanded: boolean) => void;
  onOriginMarkerChange?: (point: GeoPoint | null, meta: OriginMarkerMeta) => void;
  mapOriginEvent?: MapOriginEvent | null;
  onRouteChange?: (routes: RouteOption[], selectedIndex: number) => void;
  /** Called on every GPS update during live navigation. null = navigation stopped. */
  onLivePosition?: (pos: { lat: number; lng: number; bearing: number | null } | null) => void;
}

const TRANSPORT_MODE_LABELS: Record<TransportMode, string> = {
  driving: 'Auto',
  walking: 'A pie',
  cycling: 'Bici',
  'transit-like': 'Transporte',
  'rideshare-like': 'Viaje'
};

const TRANSPORT_MODE_ICONS: Record<TransportMode, React.ComponentType<{ className?: string }>> = {
  driving: FaCarSide,
  walking: FaPersonWalking,
  cycling: FaBicycle,
  'transit-like': FaBusSimple,
  'rideshare-like': FaTaxi
};

const TRANSPORT_MODE_STYLES: Record<TransportMode, string> = {
  driving: 'bg-[#0E5F27] text-white border-[#0E5F27] shadow-sm',
  walking: 'bg-[#0E5F27] text-white border-[#0E5F27] shadow-sm',
  cycling: 'bg-[#0E5F27] text-white border-[#0E5F27] shadow-sm',
  'transit-like': 'bg-[#0E5F27] text-white border-[#0E5F27] shadow-sm',
  'rideshare-like': 'bg-[#0E5F27] text-white border-[#0E5F27] shadow-sm'
};

const TRANSPORT_MODE_OUTLINE: Record<TransportMode, string> = {
  driving: 'bg-[#F5F8F3] text-[#0E5F27] border-emerald-200 hover:border-emerald-400',
  walking: 'bg-[#F5F8F3] text-[#0E5F27] border-emerald-200 hover:border-emerald-400',
  cycling: 'bg-[#F5F8F3] text-[#0E5F27] border-emerald-200 hover:border-emerald-400',
  'transit-like': 'bg-[#F5F8F3] text-[#0E5F27] border-emerald-200 hover:border-emerald-400',
  'rideshare-like': 'bg-[#F5F8F3] text-[#0E5F27] border-emerald-200 hover:border-emerald-400'
};

function normalizePoint(value: number | string | undefined): number {
  if (typeof value === 'number') return value;
  const parsed = Number.parseFloat(String(value ?? ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function NavigationPanel({
  placeName,
  destination,
  placeAddress,
  placeCost: _placeCost,
  placeCategory,
  onNavigationStart,
  onExpandedChange,
  onOriginMarkerChange,
  mapOriginEvent,
  onRouteChange,
  onLivePosition
}: NavigationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [transportMode, setTransportMode] = useState<TransportMode>('driving');
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [availableRoutes, setAvailableRoutes] = useState<RouteOption[]>([]);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [navigationStarted, setNavigationStarted] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [loadingOrigin, setLoadingOrigin] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [originInput, setOriginInput] = useState('');
  const [originPoint, setOriginPoint] = useState<GeoPoint | null>(null);
  const [originLabel, setOriginLabel] = useState<string>('Elige un punto de partida');
  const [originHint, setOriginHint] = useState<string>('');
  const [originSearchError, setOriginSearchError] = useState<string | null>(null);

  const geo = useGeolocation({ enableHighAccuracy: true, throttleMs: 2000, confirmBeforeUse: true });
  const user = usePitzbolUser();

  const destinationAddress = placeAddress?.trim() || 'Direccion no disponible';
  const selectedTransportModeLabel = TRANSPORT_MODE_LABELS[transportMode];
  const lastHandledMapEventRef = useRef<number | null>(null);
  // Tracks whether routes have been calculated at least once (for auto-recalc on mode change)
  const hasCalculatedRoutesRef = useRef(false);
  // Tracks previous origin to detect real changes vs initial set
  const prevOriginRef = useRef<GeoPoint | null | undefined>(undefined);

  // ── Real-time navigation ──────────────────────────────────────────────────
  const [liveNavView, setLiveNavView] = useState<'live' | 'steps'>('live');
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [distanceToNext, setDistanceToNext] = useState<number | null>(null);
  const [hasArrived, setHasArrived] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  /** Always-fresh pointer to the active steps array (avoids stale closures in watchPosition) */
  const activeStepsRef = useRef<import('@/lib/geoClient').RouteStep[]>([]);
  /** Always-fresh pointer to the current step index */
  const currentStepIdxRef = useRef(0);
  /** Previous GPS position for fallback bearing calculation */
  const prevGpsRef = useRef<{ lat: number; lng: number } | null>(null);
  /** Parsed polyline of the active route ([lng,lat] pairs) for off-route detection */
  const activeRoutePolylineRef = useRef<[number, number][]>([]);
  /** Counts consecutive off-route GPS readings */
  const offRouteCountRef = useRef(0);
  /** True while an auto-recalculation is in-flight (prevents concurrent calls) */
  const isAutoRecalcRef = useRef(false);

  // UI state for off-route recalculation
  const [isRecalculating, setIsRecalculating] = useState(false);
  /** Set by watchPosition when off-route; triggers recalc effect */
  const [offRoutePosition, setOffRoutePosition] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (route?.success) {
      setIsExpanded(true);
    }
  }, [route]);

  useEffect(() => {
    onExpandedChange?.(isExpanded);
  }, [isExpanded, onExpandedChange]);

  // Auto-recalculate when transport mode changes IF routes were already calculated
  useEffect(() => {
    if (!hasCalculatedRoutesRef.current) {
      // No routes yet — just clear any stale error
      setRouteError(null);
      return;
    }
    void handleCalculateRoutes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transportMode]);

  // Clear routes when origin changes so user knows a new calculation is needed
  useEffect(() => {
    if (prevOriginRef.current === undefined) {
      // First assignment (initial mount) — don't clear anything
      prevOriginRef.current = originPoint;
      return;
    }
    const prev = prevOriginRef.current;
    prevOriginRef.current = originPoint;

    if (!originPoint) return; // Cleared to null — no routes yet anyway
    if (prev && prev.lat === originPoint.lat && prev.lng === originPoint.lng) return; // Same coords

    // Origin genuinely changed — require button press again
    setRoute(null);
    setRouteError(null);
    setAvailableRoutes([]);
    setSelectedRouteIdx(0);
    setNavigationStarted(false);
    hasCalculatedRoutesRef.current = false;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originPoint]);

  useEffect(() => {
    if (availableRoutes.length > 0) {
      onRouteChange?.(availableRoutes, selectedRouteIdx);
    } else {
      onRouteChange?.([], 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableRoutes, selectedRouteIdx]);

  // Keep activeStepsRef always current so the geolocation callback never has stale data
  useEffect(() => {
    activeStepsRef.current = availableRoutes[selectedRouteIdx]?.steps ?? [];
  }, [availableRoutes, selectedRouteIdx]);

  // Sync active route polyline for off-route detection
  useEffect(() => {
    const poly = availableRoutes[selectedRouteIdx]?.polyline;
    if (poly) {
      try { activeRoutePolylineRef.current = JSON.parse(poly); }
      catch { activeRoutePolylineRef.current = []; }
    } else {
      activeRoutePolylineRef.current = [];
    }
  }, [availableRoutes, selectedRouteIdx]);

  // Off-route recalculation: runs when watchPosition signals the user has deviated
  useEffect(() => {
    if (!offRoutePosition || !navigationStarted || isAutoRecalcRef.current) return;
    isAutoRecalcRef.current = true;
    setIsRecalculating(true);
    const origin = { lat: offRoutePosition.lat, lng: offRoutePosition.lng };
    getRoute({ origin, destination, mode: transportMode, departureHour: new Date().getHours() })
      .then((result) => {
        if (result.success) {
          const routes = result.routes?.length
            ? result.routes
            : result.route ? [result.route] : [];
          if (routes.length) {
            setAvailableRoutes(routes);
            setSelectedRouteIdx(0);
            setCurrentStepIdx(0);
            currentStepIdxRef.current = 0;
            setDistanceToNext(null);
            onRouteChange?.(routes, 0);
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        isAutoRecalcRef.current = false;
        setIsRecalculating(false);
        setOffRoutePosition(null);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offRoutePosition]);

  // Start / stop real-time position watcher when navigation begins or ends
  useEffect(() => {
    if (!navigationStarted) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      prevGpsRef.current = null;
      onLivePosition?.(null);
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    setCurrentStepIdx(0);
    currentStepIdxRef.current = 0;
    setDistanceToNext(null);
    setHasArrived(false);
    setLiveNavView('live');

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, heading, speed } = pos.coords;

        // ── Bearing calculation ───────────────────────────────────────────
        // Rules:
        //  - Device compass (heading) is only reliable when actually moving
        //    (speed >= 0.5 m/s). At rest the heading is random noise.
        //  - Fallback calcBearing requires >= 15 m movement so GPS scatter
        //    (typical ±5-10 m accuracy) doesn't generate nonsense angles.
        //  - Returning null keeps the map at its previous bearing.
        let bearing: number | null = null;
        const isMoving = speed !== null && speed !== undefined && Number.isFinite(speed) && speed >= 0.5;
        if (isMoving && heading !== null && heading !== undefined && Number.isFinite(heading)) {
          bearing = heading;
        } else if (prevGpsRef.current) {
          const { lat: pLat, lng: pLng } = prevGpsRef.current;
          const moved = haversineMeters(pLat, pLng, latitude, longitude);
          if (moved >= 15) {
            // Only recalculate if moved enough to avoid noise
            bearing = calcBearing(pLat, pLng, latitude, longitude);
          } else {
            bearing = null; // Not enough movement, keep previous
          }
        }
        prevGpsRef.current = { lat: latitude, lng: longitude };

        onLivePosition?.({ lat: latitude, lng: longitude, bearing });

        // Off-route detection: if user is >80m from polyline for 3 consecutive readings
        const poly = activeRoutePolylineRef.current;
        if (poly.length > 1) {
          const offDist = distToPolyline(latitude, longitude, poly);
          if (offDist > 80) {
            offRouteCountRef.current += 1;
            if (offRouteCountRef.current >= 3 && !isAutoRecalcRef.current) {
              offRouteCountRef.current = 0;
              setOffRoutePosition({ lat: latitude, lng: longitude });
            }
          } else {
            offRouteCountRef.current = 0;
          }
        }

        // Step proximity detection ──────────────────────────────────────
        const steps = activeStepsRef.current;
        const idx = currentStepIdxRef.current;
        if (!steps.length) return;

        // Find nearest upcoming step that has a location
        const step = steps[idx];
        if (!step?.location) return;

        const [lng, lat] = step.location;
        const dist = haversineMeters(latitude, longitude, lat, lng);
        setDistanceToNext(dist);

        const isLastStep = idx >= steps.length - 1;

        if (dist < 30) {
          if (isLastStep) {
            setHasArrived(true);
          } else {
            const next = idx + 1;
            currentStepIdxRef.current = next;
            setCurrentStepIdx(next);
            setDistanceToNext(null);
          }
        }
      },
      () => { /* ignore geolocation errors silently */ },
      { enableHighAccuracy: true, maximumAge: 4000, timeout: 12000 }
    );

    watchIdRef.current = id;

    return () => {
      navigator.geolocation.clearWatch(id);
      watchIdRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigationStarted]);

  const reverseGeocodeOrigin = async (point: GeoPoint): Promise<string | null> => {
    try {
      const response = await fetch('/api/lugares/reverse-geocode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          latitud: point.lat.toFixed(6),
          longitud: point.lng.toFixed(6)
        })
      });

      if (!response.ok) {
        console.warn('[NavigationPanel] reverse-geocode HTTP error:', response.status);
        return null;
      }

      const data = await response.json().catch(() => null);
      if (data?.success && typeof data.displayName === 'string' && data.displayName.trim()) {
        return data.displayName.trim();
      }
    } catch {
      // Ignorar y usar fallback
    }

    try {
      const query = new URLSearchParams({
        format: 'json',
        lat: point.lat.toFixed(6),
        lon: point.lng.toFixed(6),
        zoom: '18',
        addressdetails: '1'
      });
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${query.toString()}`);
      const data = await response.json().catch(() => null);
      if (typeof data?.display_name === 'string' && data.display_name.trim()) {
        return data.display_name.trim();
      }
    } catch {
      return null;
    }

    return null;
  };

  const applyManualMapOrigin = async (point: GeoPoint) => {
    setOriginPoint(point);
    setOriginHint('Actualizando direccion desde el mapa...');
    setOriginSearchError(null);

    const reverseAddress = await reverseGeocodeOrigin(point);
    if (reverseAddress) {
      setOriginInput(reverseAddress);
      setOriginLabel(reverseAddress);
      setOriginHint(`Origen ajustado: ${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`);
      return;
    }

    setOriginInput('');
    setOriginLabel('Punto de partida ajustado en mapa');
    setOriginHint(`Coordenadas ajustadas: ${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`);
  };

  const ensureDefaultOriginPoint = (): GeoPoint => {
    const fallbackOrigin = geo.location
      ? { lat: geo.location.lat, lng: geo.location.lng }
      : { lat: destination.lat + 0.0012, lng: destination.lng - 0.0012 };

    setOriginPoint(fallbackOrigin);
    setOriginInput('');
    setOriginLabel('Punto de partida en mapa');
    setOriginHint('Marcador inicial creado. Arrastralo para afinar el origen.');
    onOriginMarkerChange?.(fallbackOrigin, { source: 'default', manual: false });

    return fallbackOrigin;
  };

  useEffect(() => {
    if (!mapOriginEvent) return;
    if (lastHandledMapEventRef.current === mapOriginEvent.eventId) return;

    lastHandledMapEventRef.current = mapOriginEvent.eventId;

    if (!mapOriginEvent.manual) {
      setOriginPoint(mapOriginEvent.point);
      return;
    }

    void applyManualMapOrigin(mapOriginEvent.point);
  }, [mapOriginEvent]);

  const applyCurrentLocation = async () => {
    setLoadingOrigin(true);
    setRouteError(null);
    setOriginSearchError(null);
    setOriginHint('Solicitando ubicación actual...');

    const current = await geo.requestCurrentLocation();
    if (!current) {
      setLoadingOrigin(false);
      setOriginHint('');
      return;
    }

    const nextOrigin = { lat: current.lat, lng: current.lng };
    setOriginPoint(nextOrigin);
     setOriginHint('Convirtiendo coordenadas a dirección...');

     const reverseAddress = await reverseGeocodeOrigin(nextOrigin);
     if (reverseAddress) {
       setOriginInput(reverseAddress);
       setOriginLabel(reverseAddress);
       setOriginHint(`Ubicación actual: ${nextOrigin.lat.toFixed(5)}, ${nextOrigin.lng.toFixed(5)}`);
     } else {
       setOriginInput('Mi ubicación actual');
       setOriginLabel('Mi ubicación actual');
       setOriginHint(`Coordenadas detectadas: ${nextOrigin.lat.toFixed(5)}, ${nextOrigin.lng.toFixed(5)}`);
     }
    onOriginMarkerChange?.(nextOrigin, { source: 'current-location', manual: false });
    setLoadingOrigin(false);
  };

  const findOrigin = async () => {
    const query = originInput.trim();
    if (!query) {
      setOriginSearchError('Escribe un punto de partida o usa tu ubicación actual.');
      return;
    }

    setLoadingOrigin(true);
    setOriginSearchError(null);
    setOriginHint('Buscando coordenadas del origen...');

    const result = await geocodeAddress(query);
    if (!result.success || result.latitud === undefined || result.longitud === undefined) {
      setOriginSearchError(result.message || 'No se encontró el punto de partida.');
      setOriginPoint(null);
      setOriginHint('');
      setLoadingOrigin(false);
      return;
    }

    const origin = {
      lat: normalizePoint(result.latitud),
      lng: normalizePoint(result.longitud)
    };

    if (!origin.lat || !origin.lng) {
      setOriginSearchError('El origen encontrado no tiene coordenadas válidas.');
      setOriginPoint(null);
      setOriginHint('');
      setLoadingOrigin(false);
      return;
    }

    setOriginPoint(origin);
    setOriginLabel(query);
    setOriginHint(`Origen encontrado: ${origin.lat.toFixed(5)}, ${origin.lng.toFixed(5)}`);
    onOriginMarkerChange?.(origin, { source: 'search', manual: false });
    setLoadingOrigin(false);
  };

  const handleCalculateRoutes = async () => {
    let origin = originPoint;
    if (!origin) {
      origin = ensureDefaultOriginPoint();
    }

    if (!user) {
      setShowLoginModal(true);
      return;
    }

    setLoadingRoute(true);
    setRouteError(null);
    setAvailableRoutes([]);
    setNavigationStarted(false);

    try {
      const currentHour = new Date().getHours();
      const routeResult = await getRoute({
        origin,
        destination,
        mode: transportMode,
        departureHour: currentHour
      });

      if (routeResult.success) {
        const all = routeResult.routes?.length
          ? routeResult.routes
          : routeResult.route
          ? [routeResult.route]
          : [];
        setAvailableRoutes(all);
        setSelectedRouteIdx(0);
        setRoute(routeResult);
        hasCalculatedRoutesRef.current = true;
        onNavigationStart?.();
      } else {
        setRouteError(routeResult.error || 'No se pudo calcular la ruta');
      }
    } catch (err: any) {
      setRouteError(err.message || 'Error al calcular la ruta');
    } finally {
      setLoadingRoute(false);
    }
  };

  const handleStartNavigation = () => {
    setCurrentStepIdx(0);
    currentStepIdxRef.current = 0;
    setDistanceToNext(null);
    setHasArrived(false);
    setLiveNavView('live');
    setNavigationStarted(true);
  };

  const handleShareRoute = async () => {
    const selectedRoute = availableRoutes[selectedRouteIdx];
    if (!selectedRoute) return;

    const shareText = `Ruta a ${placeName}\nSalida: ${originLabel}\nDestino: ${placeName} - ${destinationAddress}\nDistancia: ${selectedRoute.distance.toFixed(2)}km\nDuración: ${selectedRoute.durationWithTraffic ?? selectedRoute.duration}min`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Ruta a ${placeName}`,
          text: shareText,
          url: window.location.href
        });
      } catch (err) {
        console.error('Error compartiendo:', err);
      }
      return;
    }

    navigator.clipboard.writeText(shareText);
    alert('Ruta copiada al portapapeles');
  };

  const clearRoute = () => {
    setRoute(null);
    setRouteError(null);
    setAvailableRoutes([]);
    setSelectedRouteIdx(0);
    setNavigationStarted(false);
    setCurrentStepIdx(0);
    currentStepIdxRef.current = 0;
    setDistanceToNext(null);
    setHasArrived(false);
    setIsRecalculating(false);
    setOffRoutePosition(null);
    offRouteCountRef.current = 0;
    isAutoRecalcRef.current = false;
    hasCalculatedRoutesRef.current = false;
  };

  return (
    <div className="w-full max-w-full min-w-0 overflow-x-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-[#0E5A26] via-[#11622b] to-[#0b4b1f] text-white shadow-[0_18px_50px_rgba(13,96,30,0.28)] h-full flex flex-col">
      <button
        type="button"
        onClick={() => setIsExpanded(prev => !prev)}
        className={`flex w-full min-w-0 items-center justify-between gap-3 px-4 py-4 text-left transition-colors duration-200 hover:bg-white/[0.08] active:bg-white/[0.14]${!isExpanded ? ' flex-1 rounded-3xl' : ' rounded-t-3xl'}`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/15 backdrop-blur-sm">
            <FiNavigation className="h-5 w-5 text-[#CFF7D5]" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#CFF7D5]/80">Cómo llegar</p>
            <h3 className="truncate text-base font-semibold">Navegar a {placeName}</h3>
            <p className="truncate text-sm text-white/70">
              {originLabel} → {placeName}
            </p>
          </div>
        </div>
        <FiChevronDown
          className={`h-5 w-5 shrink-0 text-white/85 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {isExpanded && (
        <div className="min-w-0 space-y-3 border-t border-white/10 bg-gradient-to-b from-[#0F6A2B] to-[#0B4D1E] p-3 text-slate-800 sm:p-4">
          <div className="flex flex-col gap-3">
            <section className="rounded-2xl border border-emerald-200 bg-white p-3 shadow-[0_8px_18px_rgba(0,0,0,0.08)]">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-700">Punto de partida</p>
                  <h4 className="text-sm font-semibold text-slate-900">Escribe o usa ubicación</h4>
                </div>
                <FiUser className="h-5 w-5 text-emerald-700" />
              </div>

              <div className="flex items-center gap-2">
                <div className="relative min-w-0 flex-1">
                  <input
                    value={originInput}
                    onChange={e => { setOriginInput(e.target.value); if (originSearchError) setOriginSearchError(null); }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        void findOrigin();
                      }
                    }}
                    placeholder="Ej. Centro, Chapultepec, tu hotel..."
                    className="min-w-0 w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 pr-12 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setOriginPoint(null);
                      setOriginLabel('Elige un punto de partida');
                      setOriginInput('');
                      setOriginHint('');
                      setOriginSearchError(null);
                      onOriginMarkerChange?.(null, { source: 'clear', manual: false });
                    }}
                    aria-label="Limpiar punto de partida"
                    title="Limpiar"
                    className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-black transition-all duration-200 hover:bg-red-500 hover:text-white hover:shadow-[0_8px_18px_rgba(239,68,68,0.28)]"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => void findOrigin()}
                  disabled={loadingOrigin}
                  aria-label="Buscar punto de partida"
                  title="Buscar"
                  className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loadingOrigin ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiSearch className="h-5 w-5" />}
                </button>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void applyCurrentLocation()}
                  disabled={loadingOrigin || geo.loading}
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-emerald-800 transition hover:border-emerald-400 hover:bg-emerald-100 disabled:opacity-60"
                >
                  <FiTarget className="h-4 w-4" />
                  Mi ubicación
                </button>
              </div>

              {originSearchError && (
                <div className="mt-2 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{originSearchError}</p>
                </div>
              )}

              <div className="mt-2 rounded-2xl border border-emerald-200 bg-white px-3 py-2 text-xs text-slate-600">
                <span className="font-semibold text-slate-900">Salida actual:</span> {originLabel}
              </div>
            </section>

            <section className="rounded-2xl border border-emerald-200 bg-white p-3 shadow-[0_8px_18px_rgba(0,0,0,0.08)]">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700">Destino</p>
                </div>
                <FiMapPin className="h-5 w-5 text-amber-700" />
              </div>

              <div className="space-y-2 rounded-2xl border border-amber-200 bg-[#FFFCF5] p-3 min-w-0">
                <p className="text-base font-semibold text-slate-900 break-words">{placeName}</p>
                <p className="text-sm text-slate-600 break-words">{destinationAddress}</p>
              </div>
            </section>
          </div>

          <section className="rounded-2xl border border-emerald-200 bg-white p-3 shadow-[0_8px_18px_rgba(0,0,0,0.08)]">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Modo de viaje</p>
                <h4 className="text-sm font-semibold text-slate-900">{selectedTransportModeLabel}</h4>
              </div>
              <FiClock className="h-5 w-5 text-slate-500" />
            </div>
            <div className="grid grid-cols-5 gap-2">
              {(Object.keys(TRANSPORT_MODE_LABELS) as TransportMode[]).map(mode => {
                const Icon = TRANSPORT_MODE_ICONS[mode];
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setTransportMode(mode)}
                    aria-label={TRANSPORT_MODE_LABELS[mode]}
                    title={TRANSPORT_MODE_LABELS[mode]}
                    className={`inline-flex h-11 w-full items-center justify-center rounded-xl border transition ${
                      transportMode === mode
                        ? TRANSPORT_MODE_STYLES[mode]
                        : TRANSPORT_MODE_OUTLINE[mode]
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </section>

          {routeError && (
            <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{routeError}</p>
            </div>
          )}

          {/* ESTADO 1: Sin rutas — botón Calcular ruta */}
          {availableRoutes.length === 0 && (
            <button
              type="button"
              onClick={() => void handleCalculateRoutes()}
              disabled={loadingRoute || loadingOrigin}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#0E5F27] bg-white px-4 py-3 font-semibold text-[#0E5F27] shadow-[0_8px_20px_rgba(6,78,24,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.01] hover:bg-emerald-700 hover:text-white hover:shadow-[0_12px_24px_rgba(14,95,39,0.28)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loadingRoute ? <FiLoader className="h-5 w-5 animate-spin" /> : <FiNavigation className="h-5 w-5" />}
              {loadingRoute ? 'Calculando rutas...' : 'Calcular ruta'}
            </button>
          )}

          {/* ESTADO 2: Rutas disponibles — selector + Iniciar navegación */}
          {availableRoutes.length > 0 && !navigationStarted && (
            <section className="space-y-3 rounded-2xl border border-emerald-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <h5 className="text-sm font-semibold text-slate-900">Rutas disponibles</h5>
                <button type="button" onClick={clearRoute} className="text-xs text-slate-400 hover:text-red-500 transition">
                  <FiX className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2">
                {availableRoutes.map((r, idx) => {
                  const COLORS = ['#2563eb', '#d97706', '#7c3aed'];
                  const LABELS = ['Ruta más rápida', 'Ruta alternativa', 'Ruta adicional'];
                  const isSelected = idx === selectedRouteIdx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedRouteIdx(idx)}
                      className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all ${
                        isSelected
                          ? 'border-blue-300 bg-blue-50 shadow-sm'
                          : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ background: COLORS[idx % COLORS.length] }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">{LABELS[idx] ?? `Ruta ${idx + 1}`}</p>
                        <p className="text-xs text-slate-500">
                          {r.distance.toFixed(1)} km · {r.durationWithTraffic ?? r.duration} min
                        </p>
                      </div>
                      {isSelected && (
                        <span className="shrink-0 rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-bold text-white">
                          Seleccionada
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={handleStartNavigation}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 font-semibold text-white shadow-[0_8px_20px_rgba(6,78,24,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-[0_12px_24px_rgba(6,78,24,0.3)]"
              >
                <FiNavigation className="h-5 w-5" />
                Iniciar navegación
              </button>
            </section>
          )}

          {/* ESTADO 3: Navegación iniciada */}
          {navigationStarted && availableRoutes[selectedRouteIdx] && (() => {
            const activeRoute = availableRoutes[selectedRouteIdx];
            const steps = activeRoute.steps ?? [];
            const step = steps[currentStepIdx];
            const nextStep = steps[currentStepIdx + 1];
            const progressPct = steps.length > 1
              ? Math.round((currentStepIdx / (steps.length - 1)) * 100)
              : 0;

            return (
              <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-white">
                {/* Toggle bar */}
                <div className="flex border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => setLiveNavView('live')}
                    className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition ${
                      liveNavView === 'live'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${liveNavView === 'live' ? 'bg-white' : 'bg-slate-400'}`} />
                    En vivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setLiveNavView('steps')}
                    className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition ${
                      liveNavView === 'steps'
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <FiNavigation className="h-3 w-3" />
                    Pasos
                  </button>
                </div>

                {/* ── LIVE VIEW ────────────────────────────────── */}
                {liveNavView === 'live' && (
                  <div className="space-y-0">
                    {/* Arrived banner */}
                    {hasArrived ? (
                      <div className="flex flex-col items-center gap-2 bg-emerald-600 px-4 py-6 text-white">
                        <span className="text-4xl">📍</span>
                        <p className="text-lg font-bold">¡Llegaste a tu destino!</p>
                        <p className="text-sm opacity-80">{placeName}</p>
                      </div>
                    ) : (
                      <>
                        {/* Current instruction */}
                        <div className="bg-emerald-600 px-4 py-4 text-white">
                          {isRecalculating && (
                            <div className="mb-2 flex items-center gap-2 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold">
                              <span className="inline-block h-2 w-2 animate-ping rounded-full bg-white" />
                              Recalculando ruta...
                            </div>
                          )}
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 text-3xl leading-none">
                              {maneuverIcon(step?.maneuver, undefined)}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-lg font-bold leading-snug">
                                {step?.instruction ?? 'Continúa por la ruta'}
                              </p>
                              {step?.road && (
                                <p className="mt-0.5 text-sm opacity-80">{step.road}</p>
                              )}
                            </div>
                          </div>
                          {/* Distance to next maneuver */}
                          {distanceToNext !== null && (
                            <div className="mt-3 flex items-center gap-2">
                              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-emerald-500">
                                <div
                                  className="h-full rounded-full bg-white transition-all duration-700"
                                  style={{
                                    width: step?.distance
                                      ? `${Math.max(5, 100 - (distanceToNext / (step.distance * 1000)) * 100)}%`
                                      : '50%'
                                  }}
                                />
                              </div>
                              <span className="shrink-0 text-sm font-bold">
                                {fmtDist(distanceToNext)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Next step preview */}
                        {nextStep && (
                          <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 text-sm">
                            <span className="text-xl text-slate-400">
                              {maneuverIcon(nextStep.maneuver, undefined)}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-slate-400">A continuación</p>
                              <p className="truncate font-semibold text-slate-700">{nextStep.instruction}</p>
                            </div>
                            <span className="shrink-0 text-xs text-slate-400">
                              {fmtDist(nextStep.distance * 1000)}
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    {/* Route summary + progress */}
                    <div className="px-4 py-3">
                      {/* Progress bar */}
                      <div className="mb-2 h-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Paso {currentStepIdx + 1} / {steps.length}</span>
                        <span>{activeRoute.distance.toFixed(1)} km · {activeRoute.durationWithTraffic ?? activeRoute.duration} min</span>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 px-4 py-3">
                      <button
                        type="button"
                        onClick={clearRoute}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                      >
                        <FiX className="h-4 w-4" />
                        Finalizar navegación
                      </button>
                    </div>
                  </div>
                )}

                {/* ── STEPS VIEW ───────────────────────────────── */}
                {liveNavView === 'steps' && (
                  <div className="space-y-0">
                    {/* Summary */}
                    <div className="grid grid-cols-2 gap-3 p-4">
                      <div className="rounded-xl bg-emerald-50 p-3">
                        <p className="text-[11px] uppercase tracking-wider text-emerald-700">Distancia</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900">{activeRoute.distance.toFixed(1)} km</p>
                      </div>
                      <div className="rounded-xl bg-amber-50 p-3">
                        <p className="text-[11px] uppercase tracking-wider text-amber-700">Tiempo</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900">
                          {activeRoute.durationWithTraffic ?? activeRoute.duration}
                          <span className="ml-1 text-sm font-medium text-slate-500">min</span>
                        </p>
                      </div>
                    </div>

                    {/* Step list */}
                    {steps.length > 0 && (
                      <div className="max-h-64 overflow-y-auto border-t border-slate-100 px-4 py-3">
                        <div className="space-y-2">
                          {steps.map((s, i) => {
                            const isCurrent = i === currentStepIdx;
                            const isDone = i < currentStepIdx;
                            return (
                              <div
                                key={i}
                                className={`flex gap-3 rounded-xl border p-3 text-sm transition ${
                                  isCurrent
                                    ? 'border-emerald-300 bg-emerald-50'
                                    : isDone
                                    ? 'border-slate-100 bg-slate-50 opacity-50'
                                    : 'border-slate-100 bg-white'
                                }`}
                              >
                                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                  isCurrent ? 'bg-emerald-600 text-white' : isDone ? 'bg-slate-300 text-slate-600' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {isDone ? '✓' : i + 1}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className={`font-medium ${isCurrent ? 'text-emerald-900' : 'text-slate-700'}`}>
                                    {s.instruction}
                                  </p>
                                  <p className="text-xs text-slate-400">{fmtDist(s.distance * 1000)} · {s.duration} min</p>
                                </div>
                                {isCurrent && distanceToNext !== null && (
                                  <span className="shrink-0 self-center rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                    {fmtDist(distanceToNext)}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 border-t border-slate-100 p-4">
                      <button
                        type="button"
                        onClick={() => void handleShareRoute()}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                      >
                        <FiShare2 className="h-4 w-4" />
                        Compartir
                      </button>
                      <button
                        type="button"
                        onClick={clearRoute}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                      >
                        <FiX className="h-4 w-4" />
                        Finalizar
                      </button>
                    </div>
                  </div>
                )}
              </section>
            );
          })()}

          {showLoginModal && (
            <div className="fixed inset-0 z-[350] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/50" onClick={() => setShowLoginModal(false)} />
              <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
                <h3 className="text-lg font-semibold text-slate-900">Acceso requerido</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Debes iniciar sesión para usar la navegación.
                </p>
                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLoginModal(false)}
                    className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = '/login';
                    }}
                    className="flex-1 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    Ir al login
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NavigationPanel;
