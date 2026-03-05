import { useEffect, useRef } from 'react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

/**
 * Hook para incrementar las vistas de un lugar
 * Solo incrementa una vez por sesión para evitar inflar números
 */
export function usePlaceView(placeName: string | null) {
  const hasIncrementedRef = useRef(false);

  useEffect(() => {
    if (!placeName || hasIncrementedRef.current) return;

    const incrementView = async () => {
      try {
        await fetch(
          `${BACKEND_URL}/api/place-ratings/${encodeURIComponent(placeName)}/view`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        hasIncrementedRef.current = true;
        console.log(`✅ Vista registrada para: ${placeName}`);
      } catch (error) {
        console.error('Error al incrementar vista:', error);
      }
    };

    // Esperar 2 segundos antes de registrar la vista (evitar bots/bounces)
    const timer = setTimeout(incrementView, 2000);

    return () => clearTimeout(timer);
  }, [placeName]);
}
