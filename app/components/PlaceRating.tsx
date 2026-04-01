"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiStar } from "react-icons/fi";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

interface PlaceRatingProps {
  placeName: string;
  showLabel?: boolean;
  size?: "small" | "medium" | "large";
  readonly?: boolean;
  displayMode?: "single" | "split";
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

      // Obtener estadísticas públicas del lugar
      const statsResponse = await fetch(
        `${BACKEND_URL}/api/place-ratings/${encodeURIComponent(placeName)}/stats`
      );
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setAverageRating(statsData.stats.averageRating || 0);
        setTotalRatings(statsData.stats.totalRatings || 0);
      }

      // Si está autenticado, obtener su calificación
      if (token) {
        const userRatingResponse = await fetch(
          `${BACKEND_URL}/api/place-ratings/${encodeURIComponent(placeName)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (userRatingResponse.ok) {
          const userData = await userRatingResponse.json();
          setUserRating(userData.userRating || 0);
        }
      }
    } catch (error) {
      console.error("Error al cargar datos de rating:", error);
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
      const response = await fetch(`${BACKEND_URL}/api/place-ratings/rate`, {
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
        
        if (onRatingChange) {
          onRatingChange(rating);
        }
      } else {
        const error = await response.json();
        alert(error.message || "Error al guardar calificación");
      }
    } catch (error) {
      console.error("Error al calificar lugar:", error);
      alert("Error al guardar calificación");
    }
  };

  const displayRating = userRating || averageRating;
  const activeRating = hoverRating || displayRating;
  const hasAverageRatings = totalRatings > 0;

  if (isLoading) {
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
          ) : (
            {null}
          )}
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
