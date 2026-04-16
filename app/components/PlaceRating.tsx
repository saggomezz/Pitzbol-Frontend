"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiStar } from "react-icons/fi";

const API_BASE = "/api";
const STATS_CACHE_TTL_MS = 60000;
const placeStatsCache = new Map<string, { averageRating: number; totalRatings: number; expiresAt: number }>();
const inFlightStatsRequests = new Map<string, Promise<{ averageRating: number; totalRatings: number } | null>>();

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchPlaceStatsWithBackoff(placeName: string): Promise<{ averageRating: number; totalRatings: number } | null> {
  const requestKey = placeName.trim().toLowerCase();
  const existingRequest = inFlightStatsRequests.get(requestKey);
  if (existingRequest) return existingRequest;

  const requestPromise = (async () => {
    const endpoint = `${API_BASE}/place-ratings/${encodeURIComponent(placeName)}/stats`;

    // Primer intento
    let response = await fetch(endpoint);

    // Si hay rate-limit, respetar Retry-After cuando exista y reintentar una vez
    if (response.status === 429) {
      const retryAfterRaw = response.headers.get("retry-after");
      const retryAfterSeconds = Number(retryAfterRaw);
      const retryDelayMs = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
        ? retryAfterSeconds * 1000
        : 1500;

      await wait(retryDelayMs);
      response = await fetch(endpoint);
    }

    if (!response.ok) return null;

    const payload = await response.json();
    return {
      averageRating: payload?.stats?.averageRating || 0,
      totalRatings: payload?.stats?.totalRatings || 0,
    };
  })();

  inFlightStatsRequests.set(requestKey, requestPromise);

  try {
    return await requestPromise;
  } finally {
    inFlightStatsRequests.delete(requestKey);
  }
}

interface PlaceRatingProps {
  placeName: string;
  showLabel?: boolean;
  size?: "small" | "medium" | "large";
  readonly?: boolean;
  displayMode?: "single" | "split" | "compact";
  onRatingChange?: (newRating: number) => void;
}

export default function PlaceRating({
  placeName,
  showLabel = true,
  size = "medium",
  readonly = false,
  displayMode = "single",
  onRatingChange,
}: PlaceRatingProps) {
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalRatings, setTotalRatings] = useState<number>(0);
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const sizeClasses = {
    small: "text-sm",
    medium: "text-base",
    large: "text-lg",
  };

  const starSizes = {
    small: 14,
    medium: 18,
    large: 22,
  };

  useEffect(() => {
    loadRatingData();
  }, [placeName]);

  const loadRatingData = async () => {
    setIsLoading(true);
    try {
      // Verificar autenticación
      const token = localStorage.getItem("pitzbol_token");
      setIsAuthenticated(!!token);

      const cacheKey = placeName.trim().toLowerCase();
      const cachedStats = placeStatsCache.get(cacheKey);
      if (cachedStats && cachedStats.expiresAt > Date.now()) {
        setAverageRating(cachedStats.averageRating || 0);
        setTotalRatings(cachedStats.totalRatings || 0);
        setIsLoading(false);
        return;
      }

      // Obtener estadísticas públicas del lugar (con dedupe y backoff ante 429)
      const statsData = await fetchPlaceStatsWithBackoff(placeName);

      if (statsData) {
        const nextAverage = statsData.averageRating || 0;
        const nextTotal = statsData.totalRatings || 0;
        setAverageRating(nextAverage);
        setTotalRatings(nextTotal);
        placeStatsCache.set(cacheKey, {
          averageRating: nextAverage,
          totalRatings: nextTotal,
          expiresAt: Date.now() + STATS_CACHE_TTL_MS,
        });
      }
    } catch (error) {
      // Si el backend no responde, mantenemos la UI en estado neutro sin bloquear la página.
      console.warn("No se pudieron cargar los datos de rating");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRatePlace = async (rating: number) => {
    if (readonly || !isAuthenticated) return;

    const token = localStorage.getItem("pitzbol_token");
    if (!token) {
      alert("Debes iniciar sesión para calificar lugares");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/place-ratings/rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          placeName,
          rating,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserRating(rating);
        setAverageRating(data.stats.averageRating);
        setTotalRatings(data.stats.totalRatings);
        const cacheKey = placeName.trim().toLowerCase();
        placeStatsCache.set(cacheKey, {
          averageRating: data.stats.averageRating || 0,
          totalRatings: data.stats.totalRatings || 0,
          expiresAt: Date.now() + STATS_CACHE_TTL_MS,
        });
        
        if (onRatingChange) {
          onRatingChange(rating);
        }
      } else {
        const error = await response.json();
        alert(error.message || "Error al guardar calificación");
      }
    } catch (error) {
      console.warn("No se pudo guardar la calificación", error);
      alert("Error al guardar calificación");
    }
  };

  const displayRating = userRating || averageRating;
  const activeRating = hoverRating || displayRating;
  const hasAverageRatings = totalRatings > 0;

  if (isLoading) {
    if (readonly) return null;
    return (
      <div className={`flex items-center gap-1 ${sizeClasses[size]}`}>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <FiStar key={star} size={starSizes[size]} className="text-gray-300" />
          ))}
        </div>
      </div>
    );
  }

  if (readonly && !hasAverageRatings) return null;

  const renderStars = ({
    value,
    filledClass,
    interactive,
  }: {
    value: number;
    filledClass: string;
    interactive: boolean;
  }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= value;

          if (!interactive) {
            return (
              <FiStar
                key={star}
                size={starSizes[size]}
                className={`transition-colors ${isFilled ? filledClass : "text-gray-300"}`}
                fill={isFilled ? "currentColor" : "none"}
              />
            );
          }

          return (
            <motion.button
              key={star}
              whileHover={{ scale: readonly ? 1 : 1.2 }}
              whileTap={{ scale: readonly ? 1 : 0.9 }}
              onClick={() => handleRatePlace(star)}
              onMouseEnter={() => !readonly && setHoverRating(star)}
              onMouseLeave={() => !readonly && setHoverRating(0)}
              disabled={readonly || !isAuthenticated}
              className={`transition-colors ${
                readonly || !isAuthenticated ? "cursor-default" : "cursor-pointer"
              }`}
              title={
                !isAuthenticated
                  ? "Inicia sesión para calificar"
                  : "Calificar con " + star + " estrellas"
              }
            >
              <FiStar
                size={starSizes[size]}
                className={`transition-colors ${isFilled ? filledClass : "text-gray-300"}`}
                fill={isFilled ? "currentColor" : "none"}
              />
            </motion.button>
          );
        })}
      </div>
    );
  };

  if (displayMode === "compact") {
    if (!hasAverageRatings) return null;
    return (
      <div className="flex items-center gap-1">
        <FiStar
          size={starSizes[size]}
          className="text-[#FDB813] fill-[#FDB813]"
          fill="currentColor"
        />
        <span className="font-bold text-[#1A4D2E] text-xs leading-none">
          {averageRating.toFixed(1)}
        </span>
      </div>
    );
  }

  if (displayMode === "split") {
    const myActiveRating = hoverRating || userRating;

    return (
      <div className="grid gap-2 text-sm text-[#1A4D2E]">
        <div className="grid grid-cols-[110px_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1">
          <span className="font-semibold whitespace-nowrap">Promedio:</span>
          {hasAverageRatings ? (
            <>
              <div className="min-w-0">
                {renderStars({
                  value: averageRating,
                  filledClass: "text-[#FDB813] fill-[#FDB813]",
                  interactive: false,
                })}
              </div>
              {showLabel && (
                <div className="flex items-baseline gap-1 justify-self-end whitespace-nowrap">
                  <span className="font-bold text-[#1A4D2E]">
                    {averageRating.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({totalRatings})
                  </span>
                </div>
              )}
            </>
          ) : null}
        </div>

        <div className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-x-2 gap-y-1">
          <span className="font-semibold whitespace-nowrap">Tu calificación:</span>
          <div className="min-w-0">
            {renderStars({
              value: myActiveRating,
              filledClass: "text-[#F00808] fill-[#F00808]",
              interactive: !readonly,
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${sizeClasses[size]}`}>
      {hasAverageRatings ? (
        renderStars({
          value: activeRating,
          filledClass: userRating > 0 ? "text-[#F00808] fill-[#F00808]" : "text-[#FDB813] fill-[#FDB813]",
          interactive: !readonly,
        })
      ) : (
        null
      )}

      {showLabel && hasAverageRatings && (
        <div className="flex flex-col leading-none">
          <span className="font-bold text-[#1A4D2E]">
            {averageRating.toFixed(1)}
          </span>
          <span className="text-xs text-gray-500">
            ({totalRatings} {totalRatings === 1 ? "calificación" : "calificaciones"})
          </span>
        </div>
      )}

      {!readonly && isAuthenticated && userRating > 0 && (
        <span className="text-xs text-[#F00808] font-medium">
          Tu calificación
        </span>
      )}

      {!readonly && !isAuthenticated && (
        <span className="text-xs text-gray-400 italic">
          Inicia sesión para calificar
        </span>
      )}
    </div>
  );
}
