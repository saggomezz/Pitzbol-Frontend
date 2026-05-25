'use client';

import React, { useEffect, useState } from 'react';
import { FiMapPin, FiX } from 'react-icons/fi';
import { setLocationPermissionHandler } from '@/lib/locationPermission';

export default function LocationPermissionModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [promiseResolver, setPromiseResolver] = useState<((v: boolean) => void) | null>(null);

  const onAccept = React.useCallback(() => {
    setIsOpen(false);
    promiseResolver?.(true);
    setPromiseResolver(null);
  }, [promiseResolver]);

  const onDeny = React.useCallback(() => {
    setIsOpen(false);
    promiseResolver?.(false);
    setPromiseResolver(null);
  }, [promiseResolver]);

  useEffect(() => {
    // Register handler that shows this modal and returns a promise
    setLocationPermissionHandler(() => {
      return new Promise<boolean>(resolve => {
        setPromiseResolver(() => resolve);
        setIsOpen(true);
      });
    });

    return () => {
      setLocationPermissionHandler(null);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onDeny();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onDeny]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[360] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-[#04140A]/65 backdrop-blur-[1px]" onClick={onDeny} />
      <div className="relative w-full max-w-md overflow-hidden rounded-t-3xl border border-emerald-900/30 bg-[#F7F5EF] pb-[max(env(safe-area-inset-bottom),14px)] shadow-[0_24px_70px_rgba(4,20,10,0.45)] sm:rounded-3xl sm:pb-0">
        <div className="bg-gradient-to-r from-[#0A5B24] via-[#0E6A2B] to-[#0B4B1F] px-5 pb-4 pt-3 text-white sm:pt-4">
          <div className="mb-3 flex justify-center sm:hidden">
            <span className="h-1.5 w-14 rounded-full bg-white/35" />
          </div>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
                <FiMapPin className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-100/90">Permisos</p>
                <h3 className="text-lg font-semibold sm:text-xl">Compartir ubicación</h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onDeny}
              aria-label="Cerrar modal"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5 text-slate-700 sm:space-y-5">
          <p className="text-[15px] leading-6 sm:leading-7">
            Pitzbol necesita acceso a tu ubicación para calcular rutas y búsquedas cercanas.
          </p>
          <p className="text-sm text-slate-500">
            Si el navegador bloqueó el permiso antes, actívalo en el ícono de candado junto a la URL.
          </p>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
            <button
              type="button"
              onClick={onDeny}
              className="order-2 h-12 rounded-xl border border-slate-300 bg-white px-4 font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 sm:order-1"
            >
              No permitir
            </button>
            <button
              type="button"
              onClick={onAccept}
              className="order-1 h-12 rounded-xl border border-[#0B5C24] bg-[#0E6A2B] px-4 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#0B5C24] hover:shadow-[0_10px_22px_rgba(14,106,43,0.35)] sm:order-2"
            >
              Sí, permitir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
