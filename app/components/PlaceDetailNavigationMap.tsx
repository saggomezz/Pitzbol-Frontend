"use client";

import React, { useEffect, useRef, useState } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents } from "react-leaflet";
import dynamic from "next/dynamic";
import type { GeoPoint } from "@/lib/geoClient";

let destinationIcon: any = undefined;
let originIcon: any = undefined;

if (typeof window !== "undefined") {
  const L = require("leaflet");

  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });

  destinationIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  originIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
}

type OriginChangeMeta = {
  manual: boolean;
};

interface PlaceDetailNavigationMapProps {
  destination: GeoPoint;
  destinationName: string;
  origin: GeoPoint | null;
  onOriginChange?: (point: GeoPoint, meta: OriginChangeMeta) => void;
  isNavigationMode?: boolean;
  routes?: { polyline: string }[];
  selectedRouteIndex?: number;
  /** Live GPS position + bearing during navigation. null = not navigating. */
  liveNavPosition?: { lat: number; lng: number; bearing: number | null } | null;
}

function isValidPoint(point: GeoPoint | null | undefined): point is GeoPoint {
  if (!point) return false;
  return Number.isFinite(point.lat) && Number.isFinite(point.lng);
}

/** Exposes the Leaflet map instance to a parent ref (must live inside MapContainer) */
function MapRefSetter({ mapRef }: { mapRef: React.MutableRefObject<any> }) {
  const map = useMap();
  useEffect(() => { mapRef.current = map; }, [map, mapRef]);
  return null;
}

/**
 * Controls map rotation, look-ahead pan, and follow/free mode.
 *
 * follow mode  — map rotates to heading, auto-pans ahead of the user (Android Auto style).
 *                Drag fires onDisengage() which switches to free mode.
 * free mode    — CSS rotation removed; Leaflet drags normally (correct direction).
 */
function MapNavigationController({
  liveNavPosition,
  followMode,
  onDisengage,
}: {
  liveNavPosition: { lat: number; lng: number; bearing: number | null } | null | undefined;
  followMode: 'follow' | 'free';
  onDisengage: () => void;
}) {
  const map = useMap();
  const prevBearingRef = useRef<number>(0);
  /** EMA-smoothed bearing to prevent wild CSS jumps from noisy GPS readings */
  const smoothBearingRef = useRef<number>(0);
  const navZoomSetRef = useRef(false);

  // Reset zoom flag whenever follow mode is re-engaged so we snap back to zoom 17
  useEffect(() => {
    if (followMode === 'follow') navZoomSetRef.current = false;
  }, [followMode]);

  // Detect user-initiated drag to disengage follow mode.
  // We immediately strip the CSS rotation in the event handler (before React re-renders)
  // so that Leaflet's first drag-move pixel delta is calculated against an unrotated container.
  useEffect(() => {
    if (!liveNavPosition || followMode !== 'follow') return;
    const handleDragStart = () => {
      const container = map.getContainer();
      const ctrl = container.querySelector<HTMLElement>('.leaflet-control-container');
      container.style.transition = 'none';
      container.style.transform = '';
      container.style.transformOrigin = '50% 50%';
      if (ctrl) { ctrl.style.transition = 'none'; ctrl.style.transform = ''; }
      onDisengage();
    };
    map.on('dragstart', handleDragStart);
    return () => { map.off('dragstart', handleDragStart); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveNavPosition, followMode]);

  // Main effect: apply or remove CSS rotation + look-ahead
  useEffect(() => {
    const container = map.getContainer();
    const ctrlContainer = container.querySelector<HTMLElement>('.leaflet-control-container');

    // ── Free mode or no navigation: restore normal map ──────────────────────
    if (!liveNavPosition || followMode !== 'follow') {
      container.style.transition = 'transform 0.4s ease-out';
      container.style.transform = '';
      container.style.transformOrigin = '50% 50%';
      if (ctrlContainer) {
        ctrlContainer.style.transition = 'transform 0.4s ease-out';
        ctrlContainer.style.transform = '';
      }
      if (!liveNavPosition) navZoomSetRef.current = false;
      return;
    }

    // ── Follow mode: rotate map + look-ahead pan ─────────────────────────────
    // Apply EMA smoothing to the raw bearing to prevent CSS spinning from
    // noisy GPS heading values. Alpha 0.3 = responsive but stable.
    if (liveNavPosition.bearing !== null && liveNavPosition.bearing !== undefined) {
      const raw = liveNavPosition.bearing;
      const prev = smoothBearingRef.current;
      // Shortest-arc interpolation handles the 355°→5° wrap-around case
      const diff = ((raw - prev + 540) % 360) - 180;
      smoothBearingRef.current = (prev + 0.3 * diff + 360) % 360;
      prevBearingRef.current = smoothBearingRef.current;
    }
    const bearing = prevBearingRef.current;

    const toRad = (d: number) => (d * Math.PI) / 180;
    const bearingRad = toRad(bearing);

    // ── Zoom + scale must be computed first (used by look-ahead) ─────────────
    // Zoom 17 on first (or re-centred) GPS fix; respect manual zoom after that.
    const zoom = navZoomSetRef.current ? map.getZoom() : 17;
    navZoomSetRef.current = true;

    // Scale to cover all corners: s >= max((|c|W+|s|H)/W, (|c|H+|s|W)/H) * margin
    const W = container.offsetWidth  || 400;
    const H = container.offsetHeight || 600;
    const ac = Math.abs(Math.cos(bearingRad));
    const as = Math.abs(Math.sin(bearingRad));
    const scale = Math.max((ac * W + as * H) / W, (ac * H + as * W) / H, 1) * 1.08;

    // Adaptive look-ahead: keeps the arrow at ~72% from the top of the
    // visible area regardless of zoom level or container size.
    // Formula: visibleH * 0.22 * metersPerPixel  (22% below map center = 72% from top)
    const mPerPx = 156543 * Math.abs(Math.cos(toRad(liveNavPosition.lat))) / Math.pow(2, zoom);
    const visH = H / scale;
    const lookM = Math.max(60, Math.min(600, visH * 0.22 * mPerPx));
    const cosLat = Math.cos(toRad(liveNavPosition.lat));
    const lookLat = liveNavPosition.lat + (lookM / 111_320) * Math.cos(bearingRad);
    const lookLng = liveNavPosition.lng + (lookM / (111_320 * cosLat)) * Math.sin(bearingRad);

    map.setView([lookLat, lookLng], zoom, { animate: true, duration: 0.35, noMoveStart: true });

    // Only re-apply CSS rotation if bearing changed by >= 3° (skip micro-jitter repaints)
    const lastTransformKey = container.dataset.navBearing ?? '';
    const bearingRounded = Math.round(bearing * 10) / 10;
    if (lastTransformKey !== String(bearingRounded)) {
      container.dataset.navBearing = String(bearingRounded);
      container.style.transformOrigin = '50% 50%';
      container.style.transition = 'transform 0.4s ease-out';
      container.style.transform = `rotate(${-bearing}deg) scale(${scale})`;

      if (ctrlContainer) {
        ctrlContainer.style.transformOrigin = '50% 50%';
        ctrlContainer.style.transition = 'transform 0.4s ease-out';
        ctrlContainer.style.transform = `scale(${(1 / scale).toFixed(4)}) rotate(${bearing}deg)`;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveNavPosition, followMode]);

  return null;
}

function MapViewport({
  destination,
  origin,
  isNavigating,
}: {
  destination: GeoPoint;
  origin: GeoPoint | null;
  isNavigating: boolean;
}) {
  const map = useMap();
  // Store the last coordinate key that triggered a fit so we only re-fit when
  // the actual lat/lng VALUES change — not just when the parent passes a new
  // object reference (which happens on every re-render).
  const lastFitKeyRef = useRef('');

  useEffect(() => {
    // Navigation controller owns the view while navigating
    if (isNavigating) return;
    if (!isValidPoint(destination)) return;

    const key = [
      destination.lat.toFixed(6),
      destination.lng.toFixed(6),
      isValidPoint(origin) ? origin.lat.toFixed(6) : 'null',
      isValidPoint(origin) ? origin.lng.toFixed(6) : 'null',
    ].join('|');

    // Same coordinates as last fit — nothing to do
    if (key === lastFitKeyRef.current) return;
    lastFitKeyRef.current = key;

    const timeoutId = setTimeout(() => {
      if (isValidPoint(origin)) {
        map.fitBounds(
          [[origin.lat, origin.lng], [destination.lat, destination.lng]],
          { padding: [45, 45], maxZoom: 16, animate: true },
        );
      } else {
        map.setView([destination.lat, destination.lng], 15, { animate: true });
      }
    }, 50);

    return () => clearTimeout(timeoutId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination, origin, isNavigating]);

  return null;
}

function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    // ResizeObserver para detectar cambios en el tamaño del contenedor del mapa
    const mapContainer = map.getContainer();
    if (!mapContainer) return;

    const resizeObserver = new ResizeObserver(() => {
      // Esperar a que el DOM se estabilice antes de invalidar
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    });

    resizeObserver.observe(mapContainer);

    return () => {
      resizeObserver.disconnect();
    };
  }, [map]);

  return null;
}

function MapPickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

function PlaceDetailNavigationMapComponent({
  destination,
  destinationName,
  origin,
  onOriginChange,
  isNavigationMode = false,
  routes = [],
  selectedRouteIndex = 0,
  liveNavPosition,
}: PlaceDetailNavigationMapProps) {
  /**
   * follow — map rotates + auto-pans (Android Auto).  default during navigation.
   * free   — no rotation, free pan. activated by user drag; re-center button restores follow.
   */
  const [followMode, setFollowMode] = useState<'follow' | 'free'>('follow');
  const mapInstanceRef = useRef<any>(null);

  // Load Leaflet CSS lazily on mount to avoid the "preloaded but not used" warning
  useEffect(() => {
    import("leaflet/dist/leaflet.css");
  }, []);

  // Reset to follow when navigation starts or ends
  useEffect(() => {
    setFollowMode('follow');
  }, [!!liveNavPosition]);

  const handleRecenter = () => setFollowMode('follow');

  const handleOverview = () => {
    setFollowMode('free');
    const map = mapInstanceRef.current;
    if (!map) return;
    const allCoords: [number, number][] = [];
    routes.forEach((r) => {
      try {
        (JSON.parse(r.polyline) as [number, number][]).forEach(([lng, lat]) =>
          allCoords.push([lat, lng]),
        );
      } catch {}
    });
    if (allCoords.length > 0) {
      map.fitBounds(allCoords, { padding: [40, 60], animate: true });
    }
  };

  const fallbackDestination: GeoPoint = isValidPoint(destination)
    ? destination
    : { lat: 20.6597, lng: -103.3496 };

  const ROUTE_COLORS = ['#2563eb', '#d97706', '#7c3aed', '#dc2626'];

  // ── Navigation arrow DivIcon (created fresh on bearing change) ─────────────
  // The map container is rotated by -bearing so heading = screen-top.
  // The arrow itself needs +bearing counter-rotation to always face screen-top.
  const navArrowIcon = (() => {
    if (typeof window === "undefined") return undefined;
    const L = require("leaflet");
    const counterRot = liveNavPosition?.bearing ?? 0;
    const html = `
      <div style="position:relative;width:56px;height:56px;display:flex;align-items:center;justify-content:center;">
        <div style="
          position:absolute;width:56px;height:56px;border-radius:50%;
          background:rgba(26,115,232,0.18);border:2px solid rgba(26,115,232,0.4);
          animation:navPulse 2s ease-in-out infinite;
        "></div>
        <div style="transform:rotate(${counterRot}deg);transition:transform 0.5s ease-out;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.45));">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="36" height="42">
            <defs>
              <linearGradient id="arrowGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#4a9eff"/>
                <stop offset="100%" stop-color="#1a73e8"/>
              </linearGradient>
            </defs>
            <polygon points="16,2 31,36 16,27 1,36"
              fill="url(#arrowGrad)" stroke="white" stroke-width="2.5"
              stroke-linejoin="round"/>
            <circle cx="16" cy="22" r="3.5" fill="white" opacity="0.9"/>
          </svg>
        </div>
      </div>
      <style>
        @keyframes navPulse {
          0%,100%{transform:scale(1);opacity:0.9}
          50%{transform:scale(1.3);opacity:0.4}
        }
      </style>
    `;
    return new L.DivIcon({
      className: "",
      html,
      iconSize: [56, 56],
      iconAnchor: [28, 28],
    });
  })();

  function parsePolylinePositions(polyline: string): [number, number][] {
    try {
      const coords: [number, number][] = JSON.parse(polyline);
      return coords.map(([lng, lat]) => [lat, lng]);
    } catch {
      return [];
    }
  }

  const handleMapPick = (lat: number, lng: number) => {
    onOriginChange?.({ lat, lng }, { manual: true });
  };

  const handleOriginDragEnd = (event: any) => {
    const { lat, lng } = event.target.getLatLng();
    onOriginChange?.({ lat, lng }, { manual: true });
  };

  if (typeof window === "undefined" || !destinationIcon || !originIcon) {
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#E6EFE8" }}>
        <p style={{ color: "#1A4D2E", fontWeight: 600 }}>Cargando mapa...</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Grey-corner clipping during CSS rotation is handled by the parent
          .mapContainer CSS class (overflow:hidden + border-radius:20px).
          Adding a second overflow:hidden here created extra compositing layers
          that caused mobile WebKit to drop the map rendering layer. */}
      <MapContainer
        center={[fallbackDestination.lat, fallbackDestination.lng]}
        zoom={15}
        style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}
        className="leaflet-container"
        scrollWheelZoom={true}
        doubleClickZoom={true}
        touchZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          keepBuffer={6}
        />

        <MapViewport destination={fallbackDestination} origin={origin} isNavigating={!!liveNavPosition} />
        <MapResizeHandler />
        {/* Block map-click origin changes while live navigation is active */}
        {!liveNavPosition && <MapPickHandler onPick={handleMapPick} />}
        <MapRefSetter mapRef={mapInstanceRef} />
        <MapNavigationController
          liveNavPosition={liveNavPosition}
          followMode={followMode}
          onDisengage={() => setFollowMode('free')}
        />

        <Marker
          position={[fallbackDestination.lat, fallbackDestination.lng]}
          icon={destinationIcon}
        />

        {/* During live navigation: show arrow at GPS position; otherwise: show draggable origin marker */}
        {liveNavPosition ? (
          navArrowIcon && (
            <Marker
              position={[liveNavPosition.lat, liveNavPosition.lng]}
              icon={navArrowIcon}
            />
          )
        ) : (
          isValidPoint(origin) && (
            <Marker
              position={[origin.lat, origin.lng]}
              icon={originIcon}
              draggable={true}
              eventHandlers={{
                dragend: handleOriginDragEnd,
              }}
            />
          )
        )}

        {/* Render non-selected routes first (below), selected route last (on top) */}
        {[...routes.map((r, idx) => ({ r, idx })).filter(({ idx }) => idx !== selectedRouteIndex),
           ...routes.map((r, idx) => ({ r, idx })).filter(({ idx }) => idx === selectedRouteIndex),
        ].map(({ r, idx }) => {
          const positions = parsePolylinePositions(r.polyline);
          if (!positions.length) return null;
          const isSelected = idx === selectedRouteIndex;
          return isSelected ? (
            // Selected route: white casing beneath + vivid blue on top (Google Maps style)
            <React.Fragment key={`sel-${idx}`}>
              <Polyline
                positions={positions}
                pathOptions={{ color: 'white', weight: 10, opacity: 0.85 }}
              />
              <Polyline
                positions={positions}
                pathOptions={{ color: '#1a73e8', weight: 6, opacity: 1 }}
              />
            </React.Fragment>
          ) : (
            <Polyline
              key={`alt-${idx}`}
              positions={positions}
              pathOptions={{
                color: ROUTE_COLORS[(idx % (ROUTE_COLORS.length - 1)) + 1],
                weight: 3,
                opacity: 0.4,
              }}
            />
          );
        })}
      </MapContainer>

      {/* ── Navigation HUD (only while in follow mode) ─────────────────────── */}
      {liveNavPosition && followMode === 'follow' && (
        <>
          {/* Compass rose — rotates to always point north */}
          <div
            aria-label="Norte"
            title="Norte"
            style={{
              position: 'absolute', top: 12, left: 12,
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(255,255,255,0.93)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.28)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1000, pointerEvents: 'none',
              transform: `rotate(${-(liveNavPosition.bearing ?? 0)}deg)`,
              transition: 'transform 0.4s ease-out',
            }}
          >
            <svg viewBox="0 0 24 24" width="26" height="26">
              {/* North needle — red */}
              <polygon points="12,3 14.2,12 12,10.5 9.8,12" fill="#e53e3e" />
              {/* South needle — grey */}
              <polygon points="12,21 14.2,12 12,13.5 9.8,12" fill="#a0aec0" />
              {/* N label */}
              <text x="12" y="7.5" textAnchor="middle" fill="white"
                fontSize="3.8" fontWeight="bold" fontFamily="sans-serif">N</text>
            </svg>
          </div>
        </>
      )}

      {/* ── Navigation overlay buttons ──────────────────────────────────────── */}
      {liveNavPosition && (
        <div style={{
          position: 'absolute', top: 12, right: 12,
          display: 'flex', flexDirection: 'column', gap: 8,
          zIndex: 1000, pointerEvents: 'auto',
        }}>
          {/* Overview — fit bounds on the whole route */}
          <button
            onClick={handleOverview}
            title="Vista general de la ruta"
            style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(255,255,255,0.95)',
              border: '1.5px solid rgba(0,0,0,0.10)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          </button>

          {/* Re-center — re-engages follow mode */}
          {followMode === 'free' && (
            <button
              onClick={handleRecenter}
              title="Centrar y seguir"
              style={{
                width: 44, height: 44, borderRadius: 12,
                background: '#1a73e8',
                border: 'none',
                boxShadow: '0 2px 10px rgba(26,115,232,0.55)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="3" />
                <line x1="12" y1="2" x2="12" y2="6" />
                <line x1="12" y1="18" x2="12" y2="22" />
                <line x1="2" y1="12" x2="6" y2="12" />
                <line x1="18" y1="12" x2="22" y2="12" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Non-navigation hint label */}
      {isNavigationMode && !liveNavPosition && (
        <div
          style={{
            position: 'absolute',
            left: 10, right: 10, bottom: 10,
            background: 'rgba(26, 77, 46, 0.92)',
            color: '#fff',
            fontSize: '12px',
            borderRadius: '10px',
            padding: '7px 10px',
            fontWeight: 600,
            zIndex: 999,
            pointerEvents: 'none',
          }}
        >
          {isValidPoint(origin) ? (
            <>Destino: {destinationName}. El marcador azul es el punto de partida y se puede mover.</>
          ) : (
            <>Haz click en el mapa para colocar el marcador de partida</>
          )}
        </div>
      )}
    </div>
  );
}

const PlaceDetailNavigationMap = dynamic(
  () => Promise.resolve(PlaceDetailNavigationMapComponent),
  {
    ssr: false,
    loading: () => (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#E6EFE8" }}>
        <p style={{ color: "#1A4D2E", fontWeight: 600 }}>Cargando mapa...</p>
      </div>
    ),
  }
);

export type { OriginChangeMeta };
export default PlaceDetailNavigationMap;
