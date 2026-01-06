"use client";

import { useEffect } from "react";
import { useRouter } from 'next/navigation';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from "react-leaflet";
import type { LatLngExpression, Icon as LeafletIcon } from "leaflet";
import { FiMapPin } from "react-icons/fi";

// Tipos para el icono personalizado
let redIcon: LeafletIcon | undefined;

// Inicializar iconos solo en el cliente
if (typeof window !== "undefined") {
    const L = require("leaflet");
    
    // Fix para iconos de Leaflet en Next.js
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });

    // Icono rojo personalizado
    redIcon = new L.Icon({
        iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
    });
}

interface Lugar {
    nombre: string;
    categoria: string;
    descripcion: string;
    ubicacion: string;
    imagen?: string;
    latitud?: string;
    longitud?: string;
}

interface MapComponentProps {
    lugares: Lugar[];
    selectedPlace: Lugar | null;
    onSelectPlace: (lugar: Lugar) => void;
    mapCenter: [number, number];
    mapZoom: number;
}

export type { MapComponentProps };

// Componente para controlar el centro y zoom del mapa
function MapController({ center, zoom }: { center: LatLngExpression; zoom: number }) {
    const map = useMap();

    useEffect(() => {
        if (center) {
            map.setView(center, zoom, { animate: true });
        }
    }, [center, zoom, map]);

    return null;
}

export default function MapComponent({
    lugares,
    selectedPlace,
    onSelectPlace,
    mapCenter,
    mapZoom,
}: MapComponentProps) {
    const router = useRouter();
    
    if (!redIcon) return <div>Cargando mapa...</div>;

    return (
        <MapContainer
            center={mapCenter as LatLngExpression}
            zoom={mapZoom}
            style={{ height: "100%", width: "100%", borderRadius: "20px" }}
            scrollWheelZoom={true}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapController center={mapCenter as LatLngExpression} zoom={mapZoom} />

            {/* Marcadores - si hay un lugar seleccionado, solo mostrar ese */}
            {(selectedPlace ? [selectedPlace] : lugares).map((lugar, idx) => {
                const lat = parseFloat(lugar.latitud || "20.6597");
                const lng = parseFloat(lugar.longitud || "-103.3496");

                if (isNaN(lat) || isNaN(lng)) return null;

                const position: LatLngExpression = [lat, lng];

                return (
                    <Marker
                        key={idx}
                        position={position}
                        icon={redIcon}
                        eventHandlers={{
                            click: () => {
                                onSelectPlace(lugar);
                            },
                        }}
                    >
                        {/* Tooltip mejorado al pasar el cursor */}
                        <Tooltip 
                            direction="top" 
                            offset={[0, -35]} 
                            opacity={1}
                            className="custom-tooltip"
                        >
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "0.5rem",
                                    minWidth: "200px",
                                    maxWidth: "250px",
                                }}
                            >
                                <img
                                    src="https://via.placeholder.com/250x120?text=Lugar"
                                    alt={lugar.nombre}
                                    style={{
                                        width: "100%",
                                        height: "80px",
                                        objectFit: "cover",
                                        borderRadius: "8px",
                                    }}
                                />
                                <div style={{ padding: "0 0.25rem" }}>
                                    <span
                                        style={{
                                            display: "inline-block",
                                            background: "linear-gradient(135deg, #1A4D2E 0%, #0D601E 100%)",
                                            color: "white",
                                            padding: "0.2rem 0.6rem",
                                            borderRadius: "20px",
                                            fontSize: "0.65rem",
                                            fontWeight: 700,
                                            textTransform: "uppercase",
                                            marginBottom: "0.3rem",
                                        }}
                                    >
                                        {lugar.categoria}
                                    </span>
                                    <h4
                                        style={{
                                            margin: "0.3rem 0 0 0",
                                            fontSize: "0.85rem",
                                            fontWeight: 700,
                                            color: "#1A4D2E",
                                            lineHeight: 1.3,
                                            wordWrap: "break-word",
                                            overflowWrap: "break-word",
                                            hyphens: "auto",
                                        }}
                                    >
                                        {lugar.nombre}
                                    </h4>
                                </div>
                            </div>
                        </Tooltip>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}
