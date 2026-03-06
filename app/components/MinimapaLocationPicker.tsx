"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// Inicializar iconos solo en el cliente
let draggableIcon: any = undefined;

if (typeof window !== "undefined") {
  const L = require("leaflet");

  // Fix para iconos de Leaflet en Next.js
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });

  // Icono azul para el marcador arrastrable
  draggableIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
}

// Componente para actualizar el centro del mapa cuando cambian las coordenadas
function MapCenter({ center, zoom }: { center: LatLngExpression; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    if (Array.isArray(center) && center.length === 2 && typeof center[0] === "number" && typeof center[1] === "number") {
      map.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, map]);

  return null;
}

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

interface MinimapaLocationPickerProps {
  latitud: string;
  longitud: string;
  onLocationChange: (lat: string, lng: string) => void;
  height?: string;
}

function MinimapaLocationPickerComponent({
  latitud,
  longitud,
  onLocationChange,
  height = "300px",
}: MinimapaLocationPickerProps) {
  // Coordenadas por defecto: Guadalajara
  const defaultLat = 20.6597;
  const defaultLng = -103.3496;

  // Parsear coordenadas o usar valores por defecto
  const initialLat = latitud ? parseFloat(latitud) : defaultLat;
  const initialLng = longitud ? parseFloat(longitud) : defaultLng;

  const [position, setPosition] = useState<[number, number]>([
    isNaN(initialLat) ? defaultLat : initialLat,
    isNaN(initialLng) ? defaultLng : initialLng,
  ]);

  // Actualizar posición cuando cambian las coordenadas externamente (desde geocodificación)
  useEffect(() => {
    if (latitud && longitud) {
      const lat = parseFloat(latitud);
      const lng = parseFloat(longitud);
      if (!isNaN(lat) && !isNaN(lng)) {
        setPosition([lat, lng]);
      }
    }
  }, [latitud, longitud]);

  // Manejar cuando se arrastra el marcador
  const handleMarkerDrag = (e: any) => {
    const { lat, lng } = e.target.getLatLng();
    const newPosition: [number, number] = [lat, lng];
    setPosition(newPosition);
    // Actualizar coordenadas en el formulario
    onLocationChange(lat.toFixed(6), lng.toFixed(6));
  };

  const handleMapPick = (lat: number, lng: number) => {
    const newPosition: [number, number] = [lat, lng];
    setPosition(newPosition);
    onLocationChange(lat.toFixed(6), lng.toFixed(6));
  };

  if (typeof window === "undefined" || !draggableIcon) {
    return (
      <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", background: "#e0e0e0", borderRadius: "12px" }}>
        <p style={{ color: "#769C7B", fontWeight: 600 }}>Cargando mapa...</p>
      </div>
    );
  }

  return (
    <div style={{ height, borderRadius: "12px", overflow: "hidden", border: "2px solid #1A4D2E/20" }}>
      <MapContainer
        center={position}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapCenter center={position} zoom={15} />
        <MapClickHandler onPick={handleMapPick} />

        <Marker
          position={position}
          icon={draggableIcon}
          draggable={true}
          eventHandlers={{
            dragend: handleMarkerDrag,
          }}
        />
      </MapContainer>

      <div style={{
        padding: "8px 12px",
        background: "rgba(26, 77, 46, 0.9)",
        color: "white",
        fontSize: "12px",
        textAlign: "center",
        fontWeight: 600
      }}>
        📍 Arrastra el marcador para ajustar la ubicación exacta
      </div>
    </div>
  );
}

// Exportar como componente dinámico para evitar problemas con SSR
const MinimapaLocationPicker = dynamic(
  () => Promise.resolve(MinimapaLocationPickerComponent),
  {
    ssr: false,
    loading: () => (
      <div style={{
        height: "300px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#e0e0e0",
        borderRadius: "12px"
      }}>
        <p style={{ color: "#769C7B", fontWeight: 600 }}>Cargando mapa...</p>
      </div>
    ),
  }
);

export default MinimapaLocationPicker;
