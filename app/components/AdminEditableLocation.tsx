"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { FiEdit2, FiX, FiCheck, FiLoader, FiMapPin } from "react-icons/fi";
import { getBackendOrigin } from "@/lib/backendUrl";

interface EditableLocationProps {
  location: string;
  latitud: string | null | undefined;
  longitud: string | null | undefined;
  calle?: string;
  numero?: string;
  colonia?: string;
  codigoPostal?: string;
  ciudad?: string;
  estado?: string;
  local?: string;
  referencias?: string;
  onSave: (data: {
    location: string;
    latitud: string;
    longitud: string;
    calle?: string;
    numero?: string;
    colonia?: string;
    codigoPostal?: string;
    ciudad?: string;
    estado?: string;
    local?: string;
    referencias?: string;
  }) => Promise<void>;
  linkedLatitud?: string;
  linkedLongitud?: string;
  onCoordinatesChange?: (lat: string, lng: string) => void;
  onEditModeChange?: (isEditing: boolean) => void;
  isLoading?: boolean;
  forceEditMode?: boolean;
  editModeSurface?: "green" | "white";
}

export default function AdminEditableLocation({
  location,
  latitud,
  longitud,
  calle,
  numero,
  colonia,
  codigoPostal,
  ciudad,
  estado,
  local,
  referencias,
  onSave,
  linkedLatitud,
  linkedLongitud,
  onCoordinatesChange,
  onEditModeChange,
  isLoading = false,
  forceEditMode = false,
  editModeSurface = "green",
}: EditableLocationProps) {
  const [isEditing, setIsEditing] = useState(forceEditMode);
  const isGreenSurface = editModeSurface === "green";
  const [isSaving, setIsSaving] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geocodeError, setGeocodeError] = useState("");

  const [calleValue, setCalleValue] = useState("");
  const [numeroValue, setNumeroValue] = useState("");
  const [coloniaValue, setColoniaValue] = useState("");
  const [codigoPostalValue, setCodigoPostalValue] = useState("");
  const [ciudadValue, setCiudadValue] = useState("");
  const [estadoValue, setEstadoValue] = useState("");
  const [localValue, setLocalValue] = useState("");
  const [referenciasValue, setReferenciasValue] = useState("");

  const [mapLatitud, setMapLatitud] = useState(latitud || "");
  const [mapLongitud, setMapLongitud] = useState(longitud || "");
  const lastGeocodeRef = useRef<string>("");
  const reverseGeocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isManualMapChangeRef = useRef<boolean>(false);
  const BACKEND_URL = getBackendOrigin();

  const parseLocation = (rawLocation: string) => {
    const parts = (rawLocation || "")
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    const firstPart = parts[0] || "";
    const localPart = parts.find((part) => /^local\s+/i.test(part)) || "";
    const refPart = parts.find((part) => /^referencias?/i.test(part)) || "";
    const cpPart = parts.find((part) => /\b\d{5}\b/.test(part)) || "";

    const cleanParts = parts.filter(
      (part) => !/^local\s+/i.test(part) && !/^referencias?/i.test(part) && !/\b\d{5}\b/.test(part)
    );

    const nonStreetParts = cleanParts.slice(1);
    const estadoPart = nonStreetParts.length > 0 ? nonStreetParts[nonStreetParts.length - 1] : "";
    const ciudadPart = nonStreetParts.length > 1 ? nonStreetParts[nonStreetParts.length - 2] : "";
    const coloniaPart = nonStreetParts.length > 2 ? nonStreetParts[0] : "";

    const calleNumeroMatch = firstPart.match(/^(.*?)(?:\s+(\d+[A-Za-z0-9-]*))?$/);

    return {
      calleParsed: calleNumeroMatch?.[1]?.trim() || firstPart,
      numeroParsed: calleNumeroMatch?.[2]?.trim() || "",
      coloniaParsed: coloniaPart,
      codigoPostalParsed: (cpPart.match(/\d{5}/)?.[0] || "").trim(),
      ciudadParsed: ciudadPart,
      estadoParsed: estadoPart,
      localParsed: localPart.replace(/^local\s+/i, "").trim(),
      referenciasParsed: refPart.replace(/^referencias?\s*/i, "").trim(),
    };
  };

  const composeLocation = () => {
    const firstLine = [calleValue.trim(), numeroValue.trim()].filter(Boolean).join(" ");
    const composed = [
      firstLine,
      localValue.trim() ? `Local ${localValue.trim()}` : "",
      coloniaValue.trim(),
      ciudadValue.trim(),
      estadoValue.trim(),
      codigoPostalValue.trim(),
      referenciasValue.trim() ? `Referencias ${referenciasValue.trim()}` : "",
    ].filter(Boolean);

    return composed.join(", ");
  };

  const shouldAutoGeocode = useMemo(() => {
    return (
      calleValue.trim() !== "" &&
      (coloniaValue.trim() !== "" || codigoPostalValue.trim() !== "") &&
      !mapLatitud &&
      !mapLongitud
    );
  }, [calleValue, coloniaValue, codigoPostalValue, mapLatitud, mapLongitud]);

  const hydrateAddressFields = () => {
    const parsed = parseLocation(location || "");

    setCalleValue((calle || parsed.calleParsed || "").trim());
    setNumeroValue((numero || parsed.numeroParsed || "").trim());
    setColoniaValue((colonia || parsed.coloniaParsed || "").trim());
    setCodigoPostalValue((codigoPostal || parsed.codigoPostalParsed || "").trim());
    setCiudadValue((ciudad || parsed.ciudadParsed || "").trim());
    setEstadoValue((estado || parsed.estadoParsed || "").trim());
    setLocalValue((local || parsed.localParsed || "").trim());
    setReferenciasValue((referencias || parsed.referenciasParsed || "").trim());

    setMapLatitud(latitud || "");
    setMapLongitud(longitud || "");
    setGeocodeError("");
  };

  useEffect(() => {
    if (!isEditing) {
      hydrateAddressFields();
    }
  }, [location, latitud, longitud, calle, numero, colonia, codigoPostal, ciudad, estado, local, referencias, isEditing]);

  useEffect(() => {
    if (forceEditMode) {
      setIsEditing(true);
      hydrateAddressFields();
      onEditModeChange?.(true);
    }
  }, [forceEditMode]);

  const handleEdit = () => {
    setIsEditing(true);
    hydrateAddressFields();
    setError(null);
    onEditModeChange?.(true);
    onCoordinatesChange?.(latitud || "", longitud || "");
  };

  const handleCancel = () => {
    setIsEditing(false);
    hydrateAddressFields();
    setError(null);
    onEditModeChange?.(false);
    onCoordinatesChange?.(latitud || "", longitud || "");
  };

  const obtenerCiudadEstado = async (lat: string, lng: string, forceManualUpdate = false) => {
    if (!lat || !lng) return;

    let address: any | null = null;

    // 1) Intentar reverse geocoding vía backend
    try {
      const response = await fetch(`/api/lugares/reverse-geocode`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ latitud: lat, longitud: lng }),
      });

      if (response.ok) {
        const payload = await response.json();
        if (payload?.success && payload?.address) {
          address = payload.address;
        }
      }
    } catch {
      // Continuar con fallback directo.
    }

    // 2) Fallback: comportamiento anterior directo a Nominatim
    if (!address) {
      try {
        const directResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&countrycodes=mx`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (directResponse.ok) {
          const directPayload = await directResponse.json();
          if (directPayload?.address) {
            address = directPayload.address;
          }
        }
      } catch {
        // Si también falla, salir sin romper UI.
      }
    }

    if (!address) return;

    const displayName = typeof address?.display_name === "string" ? address.display_name : "";
    const firstDisplaySegment = displayName ? displayName.split(",")[0]?.trim() || "" : "";

    const calleDetectada =
      address.road ||
      address.pedestrian ||
      address.footway ||
      address.path ||
      address.cycleway ||
      address.residential ||
      address.living_street ||
      address.street ||
      address.construction ||
      firstDisplaySegment ||
      "";

    const ciudadDetectada =
      address.city ||
      address.town ||
      address.municipality ||
      address.city_district ||
      address.county ||
      "";

    const estadoDetectado = address.state || address.region || address.state_district || "";

    const coloniaDetectada =
      address.neighbourhood ||
      address.suburb ||
      address.quarter ||
      address.borough ||
      address.city_district ||
      address.township ||
      address.subdistrict ||
      address.village ||
      address.hamlet ||
      address.county ||
      "";
    const numeroDetectado = address.house_number || address.housenumber || address.house_name || "";
    const codigoPostalDetectado = address.postcode || "";

    const isManualChange = forceManualUpdate || isManualMapChangeRef.current;

    setCalleValue((prev) => (isManualChange ? calleDetectada || prev : prev));
    setCiudadValue((prev) => ciudadDetectada || prev);
    setEstadoValue((prev) => estadoDetectado || prev);
    setColoniaValue((prev) => coloniaDetectada || prev);
    setNumeroValue((prev) => numeroDetectado || prev);
    setCodigoPostalValue((prev) => codigoPostalDetectado || prev);
  };

  const buscarCoordenadas = async (direccion: string) => {
    if (!direccion.trim()) return;

    setIsGeocoding(true);
    setGeocodeError("");

    try {
      const response = await fetch(`/api/lugares/geocode`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ direccion: direccion.trim() }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error del servidor:", response.status, errorText);
        setGeocodeError(`Error al buscar: ${response.status} ${response.statusText}`);
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.latitud && data.longitud) {
        isManualMapChangeRef.current = false;
        setMapLatitud(data.latitud);
        setMapLongitud(data.longitud);
        onCoordinatesChange?.(data.latitud, data.longitud);
        setGeocodeError("");
        await obtenerCiudadEstado(data.latitud, data.longitud);
      } else {
        setGeocodeError(
          data.message || "No se encontraron coordenadas para esta dirección. Completa más campos o ajusta manualmente en el mapa."
        );
      }
    } catch (geocodeErr) {
      console.error("Error buscando coordenadas:", geocodeErr);
      setGeocodeError("No se pudo buscar las coordenadas. Intenta de nuevo o ajusta manualmente.");
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleGeocode = async () => {
    const query = composeLocation();
    if (!query.trim()) {
      setError("Completa la dirección para calcular coordenadas");
      return;
    }
    setError(null);
    await buscarCoordenadas(query);
  };

  useEffect(() => {
    if (!isEditing) return;

    if (!shouldAutoGeocode || isGeocoding) {
      if (!shouldAutoGeocode) {
        setGeocodeError("");
      }
      return;
    }

    const direccion = composeLocation();
    const trimmed = direccion.trim();

    if (trimmed.length < 4) {
      return;
    }

    if (lastGeocodeRef.current === trimmed) {
      return;
    }

    const timer = setTimeout(() => {
      lastGeocodeRef.current = trimmed;
      buscarCoordenadas(trimmed);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isEditing, shouldAutoGeocode, isGeocoding, calleValue, coloniaValue, codigoPostalValue, numeroValue, ciudadValue, estadoValue, localValue]);

  useEffect(() => {
    if (!isEditing || !mapLatitud || !mapLongitud) return;

    if (reverseGeocodeTimeoutRef.current) {
      clearTimeout(reverseGeocodeTimeoutRef.current);
    }

    reverseGeocodeTimeoutRef.current = setTimeout(() => {
      obtenerCiudadEstado(mapLatitud, mapLongitud);
    }, 500);

    return () => {
      if (reverseGeocodeTimeoutRef.current) {
        clearTimeout(reverseGeocodeTimeoutRef.current);
      }
    };
  }, [isEditing, mapLatitud, mapLongitud]);

  useEffect(() => {
    if (!isEditing) return;
    if (linkedLatitud === undefined || linkedLongitud === undefined) return;

    const nextLat = linkedLatitud || "";
    const nextLng = linkedLongitud || "";

    if (nextLat !== mapLatitud || nextLng !== mapLongitud) {
      isManualMapChangeRef.current = true;
      setMapLatitud(nextLat);
      setMapLongitud(nextLng);

      if (nextLat && nextLng) {
        if (reverseGeocodeTimeoutRef.current) {
          clearTimeout(reverseGeocodeTimeoutRef.current);
        }

        reverseGeocodeTimeoutRef.current = setTimeout(() => {
          obtenerCiudadEstado(nextLat, nextLng, true);
        }, 300);
      }
    }
  }, [isEditing, linkedLatitud, linkedLongitud, mapLatitud, mapLongitud]);

  const handleSave = async () => {
    if (!calleValue.trim()) {
      setError("La calle es obligatoria");
      return;
    }

    if (!numeroValue.trim()) {
      setError("El número es obligatorio");
      return;
    }

    if (!coloniaValue.trim()) {
      setError("La colonia es obligatoria");
      return;
    }

    if (!codigoPostalValue.trim() || !/^\d{5}$/.test(codigoPostalValue.trim())) {
      setError("El código postal debe tener 5 dígitos");
      return;
    }

    if (!ciudadValue.trim()) {
      setError("La ciudad es obligatoria");
      return;
    }

    if (!estadoValue.trim()) {
      setError("El estado es obligatorio");
      return;
    }

    const composedLocation = composeLocation();
    if (!composedLocation.trim()) {
      setError("La ubicación es obligatoria");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSave({
        location: composedLocation,
        latitud: mapLatitud || "",
        longitud: mapLongitud || "",
        calle: calleValue.trim(),
        numero: numeroValue.trim(),
        colonia: coloniaValue.trim(),
        codigoPostal: codigoPostalValue.trim(),
        ciudad: ciudadValue.trim(),
        estado: estadoValue.trim(),
        local: localValue.trim(),
        referencias: referenciasValue.trim(),
      });
      setIsEditing(false);
      onEditModeChange?.(false);
    } catch (err: any) {
      setError(err.message || "Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {!isEditing ? (
        <div className="bg-white border-2 border-[#1A4D2E]/10 rounded-2xl p-5 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="bg-[#0D601E]/10 p-3 rounded-full flex-shrink-0">
                <FiMapPin className="text-[#0D601E]" size={24} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-[#769C7B] font-semibold uppercase mb-1">
                  Ubicación
                </p>
                <p className="text-lg font-bold text-[#1A4D2E] mb-1">{location}</p>
                {latitud && longitud && (
                  <p className="text-sm text-[#769C7B]">
                    📍 {latitud}, {longitud}
                  </p>
                )}
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleEdit}
              disabled={isLoading}
              className="flex-shrink-0 bg-[#0D601E]/10 hover:bg-[#0D601E]/20 disabled:bg-gray-100 p-2.5 rounded-full transition-colors"
            >
              <FiEdit2 className="text-[#0D601E] disabled:text-gray-400" size={18} />
            </motion.button>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={
            editModeSurface === "white"
              ? "bg-white border-2 border-[#DCE7DF] rounded-2xl p-5"
              : "bg-[#F3FAF5] border-2 border-[#0D601E]/45 rounded-2xl p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
          }
        >
          <p className={`text-xs font-semibold uppercase mb-4 ${isGreenSurface ? "text-[#1A4D2E]" : "text-[#769C7B]"}`}>
            Editar dirección completa
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <input
              type="text"
              value={calleValue}
              onChange={(event) => {
                setCalleValue(event.target.value);
                setMapLatitud("");
                setMapLongitud("");
                onCoordinatesChange?.("", "");
                if (error) setError(null);
              }}
              className={`w-full border-2 rounded-lg p-3 font-medium text-[#1A4D2E] focus:outline-none focus:border-[#0D601E] ${isGreenSurface ? "bg-white border-[#1A4D2E]/25" : "border-[#1A4D2E]/20"}`}
              placeholder="Calle"
              disabled={isSaving}
            />
            <input
              type="text"
              value={numeroValue}
              onChange={(event) => setNumeroValue(event.target.value)}
              className={`w-full border-2 rounded-lg p-3 font-medium text-[#1A4D2E] focus:outline-none focus:border-[#0D601E] ${isGreenSurface ? "bg-white border-[#1A4D2E]/25" : "border-[#1A4D2E]/20"}`}
              placeholder="Número"
              disabled={isSaving}
            />
          </div>

          <div className="mb-3">
            <button
              type="button"
              onClick={handleGeocode}
              disabled={isSaving || isGeocoding}
              className={`text-[12px] px-4 py-2 rounded-full font-bold disabled:bg-gray-100 disabled:text-gray-400 ${isGreenSurface ? "bg-[#0D601E] text-white hover:bg-[#094d18]" : "bg-[#0D601E]/10 text-[#0D601E] hover:bg-[#0D601E]/20"}`}
            >
              {isGeocoding ? "Calculando..." : "Calcular coordenadas en el mapa"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <input
              type="text"
              value={coloniaValue}
              onChange={(event) => setColoniaValue(event.target.value)}
              className={`w-full border-2 rounded-lg p-3 font-medium text-[#1A4D2E] ${isGreenSurface ? "border-[#1A4D2E]/20 bg-[#F1F5F2]" : "border-[#1A4D2E]/20 bg-gray-100"}`}
              placeholder="Colonia"
              disabled
            />
            <input
              type="text"
              value={codigoPostalValue}
              onChange={(event) => {
                setCodigoPostalValue(event.target.value.replace(/\D/g, "").slice(0, 5));
                setMapLatitud("");
                setMapLongitud("");
                onCoordinatesChange?.("", "");
              }}
              className={`w-full border-2 rounded-lg p-3 font-medium text-[#1A4D2E] focus:outline-none focus:border-[#0D601E] ${isGreenSurface ? "bg-white border-[#1A4D2E]/25" : "border-[#1A4D2E]/20"}`}
              placeholder="Código Postal"
              disabled={isSaving}
            />
          </div>

          <p className={`text-[11px] mb-3 ${isGreenSurface ? "text-[#245038]" : "text-[#769C7B]"}`}>
            Ajusta el marcador en el mapa de la izquierda para actualizar coordenadas y dirección.
          </p>

          {geocodeError && (
            <p className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded border border-red-200 mb-4">
              {geocodeError}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <input
              type="text"
              value={ciudadValue}
              onChange={(event) => setCiudadValue(event.target.value)}
              className={`w-full border-2 rounded-lg p-3 font-medium text-[#1A4D2E] ${isGreenSurface ? "border-[#1A4D2E]/20 bg-[#F1F5F2]" : "border-[#1A4D2E]/20 bg-gray-100"}`}
              placeholder="Ciudad"
              disabled
            />
            <input
              type="text"
              value={estadoValue}
              onChange={(event) => setEstadoValue(event.target.value)}
              className={`w-full border-2 rounded-lg p-3 font-medium text-[#1A4D2E] ${isGreenSurface ? "border-[#1A4D2E]/20 bg-[#F1F5F2]" : "border-[#1A4D2E]/20 bg-gray-100"}`}
              placeholder="Estado"
              disabled
            />
          </div>

          <div className="grid grid-cols-1 gap-3 mb-3">
            <input
              type="text"
              value={localValue}
              onChange={(event) => setLocalValue(event.target.value)}
              className={`w-full border-2 rounded-lg p-3 font-medium text-[#1A4D2E] focus:outline-none focus:border-[#0D601E] ${isGreenSurface ? "bg-white border-[#1A4D2E]/25" : "border-[#1A4D2E]/20"}`}
              placeholder="Local (opcional)"
              disabled={isSaving}
            />
            <input
              type="text"
              value={referenciasValue}
              onChange={(event) => setReferenciasValue(event.target.value)}
              className={`w-full border-2 rounded-lg p-3 font-medium text-[#1A4D2E] focus:outline-none focus:border-[#0D601E] ${isGreenSurface ? "bg-white border-[#1A4D2E]/25" : "border-[#1A4D2E]/20"}`}
              placeholder="Referencias (opcional)"
              disabled={isSaving}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <input
              type="text"
              value={mapLatitud}
              onChange={(event) => setMapLatitud(event.target.value)}
              className={`w-full border-2 rounded-lg p-3 font-medium text-[#1A4D2E] focus:outline-none focus:border-[#0D601E] ${isGreenSurface ? "bg-white border-[#1A4D2E]/25" : "border-[#1A4D2E]/20"}`}
              placeholder="Latitud"
              disabled={isSaving}
            />
            <input
              type="text"
              value={mapLongitud}
              onChange={(event) => setMapLongitud(event.target.value)}
              className={`w-full border-2 rounded-lg p-3 font-medium text-[#1A4D2E] focus:outline-none focus:border-[#0D601E] ${isGreenSurface ? "bg-white border-[#1A4D2E]/25" : "border-[#1A4D2E]/20"}`}
              placeholder="Longitud"
              disabled={isSaving}
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded border border-red-200 mb-4">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 bg-[#0D601E] hover:bg-[#094d18] disabled:bg-gray-300 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              {isSaving ? (
                <>
                  <FiLoader className="animate-spin" size={16} />
                  Guardando...
                </>
              ) : (
                <>
                  <FiCheck size={16} />
                  Guardar ubicación
                </>
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              <FiX size={16} />
              Cancelar
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
