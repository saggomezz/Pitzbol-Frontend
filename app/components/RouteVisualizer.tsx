/**
 * Componente Leaflet para visualizar rutas y markers de navegación
 * Renderiza polilíneas, markers de origen/destino y waypoints
 */

import React, { useEffect } from 'react';
import { Polyline, Marker, Popup, FeatureGroup } from 'react-leaflet';
import L from 'leaflet';
import { GeoPoint } from '@/lib/geoClient';

// Iconos personalizados para markers
const originIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMzYjgyZjYiIHN0cm9rZS13aWR0aD0iMiI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iOCIvPjwvc3ZnPg==',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

const destinationIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjZWY0NDQ0Ij48cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptMCAxOGMtNC40MSAwLTgtMy41OS04LTggczMuNTktOCA4LTggOCAzLjU5IDggOC0zLjU5IDgtOCA4eiIvPjwvc3ZnPg==',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const waypointIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmNTlhMjMiIHN0cm9rZS13aWR0aD0iMiI+PHBvbHlnb24gcG9pbnRzPSIxMiwyIDIwLDIwIDEyLDE2IDQsMjAiLz48L3N2Zz4=',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28]
});

export interface RouteVisualizerProps {
  geometry?: string; // GeoJSON LineString como string
  origin?: GeoPoint;
  destination?: GeoPoint;
  waypoints?: GeoPoint[];
  distance?: number; // km
  duration?: number; // minutos
  routeColor?: string; // Hex color, default #3b82f6
  strokeWidth?: number; // default 3
  opacity?: number; // 0-1, default 0.7
}

/**
 * Parseador de geometría GeoJSON
 */
function parseGeometry(geometry: any): Array<[number, number]> {
  if (!geometry) return [];

  if (typeof geometry === 'string') {
    try {
      geometry = JSON.parse(geometry);
    } catch {
      return [];
    }
  }

  if (geometry.type === 'LineString' && Array.isArray(geometry.coordinates)) {
    // OSRM devuelve [lng, lat], convertir a [lat, lng] para Leaflet
    return geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
  }

  return [];
}

/**
 * Componente para visualizar ruta en el mapa
 */
export function RouteVisualizer({
  geometry,
  origin,
  destination,
  waypoints,
  distance,
  duration,
  routeColor = '#3b82f6',
  strokeWidth = 3,
  opacity = 0.7
}: RouteVisualizerProps) {
  const routePoints = parseGeometry(geometry);

  if (routePoints.length === 0) {
    return null;
  }

  return (
    <FeatureGroup>
      {/* Polilínea de ruta */}
      <Polyline
        positions={routePoints}
        color={routeColor}
        weight={strokeWidth}
        opacity={opacity}
        lineCap="round"
        lineJoin="round"
        dashArray={undefined}
      >
        <Popup>
          <div className="text-sm whitespace-pre-line">
            {`Distancia: ${distance?.toFixed(2)}km\nDuración: ${duration}min`}
          </div>
        </Popup>
      </Polyline>

      {/* Marker de origen */}
      {origin && (
        <Marker position={[origin.lat, origin.lng]} icon={originIcon}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">Origen</p>
              <p className="text-xs text-gray-600">
                {origin.lat.toFixed(4)}, {origin.lng.toFixed(4)}
              </p>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Marker de destino */}
      {destination && (
        <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">Destino</p>
              <p className="text-xs text-gray-600">
                {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}
              </p>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Markers de waypoints */}
      {waypoints && waypoints.map((wp, idx) => (
        <Marker
          key={`waypoint-${idx}`}
          position={[wp.lat, wp.lng]}
          icon={waypointIcon}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">Parada {idx + 1}</p>
              <p className="text-xs text-gray-600">
                {wp.lat.toFixed(4)}, {wp.lng.toFixed(4)}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Líneas de inicio a primer waypoint y último waypoint a destino si hay waypoints */}
      {waypoints && waypoints.length > 0 && origin && destination && (
        <>
          {/* Línea punteada de origen al primer waypoint (visualización) */}
          <Polyline
            positions={[
              [origin.lat, origin.lng],
              [waypoints[0].lat, waypoints[0].lng]
            ]}
            color={routeColor}
            weight={2}
            opacity={0.4}
            dashArray="5, 5"
          />
          {/* Línea punteada del último waypoint al destino */}
          <Polyline
            positions={[
              [waypoints[waypoints.length - 1].lat, waypoints[waypoints.length - 1].lng],
              [destination.lat, destination.lng]
            ]}
            color={routeColor}
            weight={2}
            opacity={0.4}
            dashArray="5, 5"
          />
        </>
      )}
    </FeatureGroup>
  );
}

/**
 * Hook para gestionar múltiples rutas en el mapa
 */
export interface RouteLayer {
  id: string;
  geometry: string;
  origin: GeoPoint;
  destination: GeoPoint;
  distance: number;
  duration: number;
  color?: string;
}

export function useRouteVisualization(routes: RouteLayer[] = []) {
  return {
    renderRoutes: () =>
      routes.map(route => (
        <RouteVisualizer
          key={route.id}
          geometry={route.geometry}
          origin={route.origin}
          destination={route.destination}
          distance={route.distance}
          duration={route.duration}
          routeColor={route.color || '#3b82f6'}
          opacity={routes.length > 1 ? 0.5 : 0.7}
        />
      ))
  };
}
