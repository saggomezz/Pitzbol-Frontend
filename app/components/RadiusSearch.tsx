/**
 * Componente de búsqueda por radio en el mapa
 * Busca lugares cercanos a la ubicación del usuario o un punto dado
 */

'use client';

import React, { useState, useEffect } from 'react';
import { FiSearch, FiMapPin, FiLoader, FiAlertCircle } from 'react-icons/fi';
import { useGeolocation, UserLocation } from '@/lib/useGeolocation';
import { searchByRadius, SearchRadiusResponse, PlaceResult, GeoPoint } from '@/lib/geoClient';

export interface RadiusSearchProps {
  radius?: number; // km, default 2
  categories?: string[];
  limit?: number; // default 50
  onPlacesFound?: (places: PlaceResult[]) => void;
  onPlaceSelected?: (place: PlaceResult) => void;
  centerPoint?: GeoPoint; // Si no se proporciona, usa ubicación actual
}

const CATEGORIES = [
  '🍽️ Gastronomía',
  '⚽ Futbol',
  '🎨 Arte',
  '🏥 Medico',
  '🎭 Cultura',
  '🛍️ Empresa',
  '🏨 Hospedaje',
  '🎪 Eventos'
];

export function RadiusSearch({
  radius = 2,
  categories = [],
  limit = 50,
  onPlacesFound,
  onPlaceSelected,
  centerPoint
}: RadiusSearchProps) {
  const [searchRadius, setSearchRadius] = useState(radius);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(categories);
  const [results, setResults] = useState<SearchRadiusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const geo = useGeolocation({ enableHighAccuracy: true, confirmBeforeUse: true });

  // Realizar búsqueda
  const handleSearch = async () => {
    const center = centerPoint || geo.location;

    if (!center) {
      setError('Ubicación no disponible');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await searchByRadius({
        center: { lat: center.lat, lng: center.lng },
        radiusKm: searchRadius,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        limit
      });

      setResults(response);
      onPlacesFound?.(response.places);
    } catch (err: any) {
      setError(err.message || 'Error buscando lugares');
    } finally {
      setLoading(false);
    }
  };

  // Buscar al cambiar parámetros
  useEffect(() => {
    const timer = setTimeout(() => {
      if (geo.location || centerPoint) {
        handleSearch();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchRadius, selectedCategories, centerPoint, geo.location]);

  return (
    <div className="flex flex-col gap-4">
      {/* Filtro de radio */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Radio: {searchRadius.toFixed(1)} km
        </label>
        <input
          type="range"
          min="0.5"
          max="50"
          step="0.5"
          value={searchRadius}
          onChange={e => setSearchRadius(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          disabled={loading}
        />
      </div>

      {/* Filtro de categorías */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Categorías</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() =>
                setSelectedCategories(
                  selectedCategories.includes(cat)
                    ? selectedCategories.filter(c => c !== cat)
                    : [...selectedCategories, cat]
                )
              }
              disabled={loading}
              className={`px-3 py-1 rounded-full text-sm transition-all disabled:opacity-50 ${
                selectedCategories.includes(cat)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Estado de ubicación */}
      {!centerPoint && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <FiMapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            {geo.loading ? (
              'Obteniendo ubicación...'
            ) : geo.error ? (
              `Error: ${geo.error}`
            ) : geo.location ? (
              `Centro: ${geo.location.lat.toFixed(4)}, ${geo.location.lng.toFixed(4)}`
            ) : (
              'Activa geolocalización para buscar'
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
          <FiAlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Botón de búsqueda manual */}
      {!results && !loading && (
        <button
          onClick={handleSearch}
          className="w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors flex items-center justify-center gap-2"
        >
          <FiSearch className="w-4 h-4" />
          Buscar
        </button>
      )}

      {/* Resultados */}
      {results && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              {results.count} lugares encontrados
            </h3>
            {loading && <FiLoader className="w-4 h-4 animate-spin text-blue-600" />}
          </div>

          {results.places.length === 0 ? (
            <p className="text-sm text-gray-600 text-center py-4">
              No se encontraron lugares en este radio
            </p>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-2">
              {results.places.map((place, idx) => (
                <button
                  key={`${place.id}-${idx}`}
                  onClick={() => onPlaceSelected?.(place)}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate group-hover:text-blue-700">
                        {place.nombre}
                      </h4>
                      <p className="text-xs text-gray-600">
                        {place.categoria || 'Lugar'} • {place.distance?.toFixed(2)}km
                      </p>
                      {place.descripcion && (
                        <p className="text-xs text-gray-500 line-clamp-1 mt-1">
                          {place.descripcion}
                        </p>
                      )}
                    </div>
                    <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold flex-shrink-0">
                      {place.distance?.toFixed(1)}km
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {results.total > results.count && (
            <p className="text-xs text-gray-600 text-center">
              Mostrando {results.count} de {results.total} lugares
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Versión simplificada como panel deslizable
 */
export function RadiusSearchPanel({
  onPlaceSelected,
  ...props
}: RadiusSearchProps & { onPlaceSelected?: (place: PlaceResult) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Botón de toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all z-40 flex items-center justify-center"
      >
        <FiSearch className="w-6 h-6" />
      </button>

      {/* Panel deslizable */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 bg-white rounded-lg shadow-xl p-4 z-40 max-h-96 overflow-y-auto">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
          <RadiusSearch
            {...props}
            onPlaceSelected={place => {
              onPlaceSelected?.(place);
            }}
          />
        </div>
      )}
    </>
  );
}
