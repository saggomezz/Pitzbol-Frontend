"use client";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useServerStatus } from "../context/ServerStatusContext";

/* ------------------------------------------------------------------ */
/*  Partícula flotante                                                  */
/* ------------------------------------------------------------------ */
function Particle({ delay, x, size }: { delay: number; x: number; size: number }) {
  return (
    <motion.div
      className="absolute bottom-0 rounded-full opacity-0"
      style={{ left: `${x}%`, width: size, height: size, background: "rgba(251,191,36,0.35)" }}
      animate={{ y: [0, -320], opacity: [0, 0.7, 0] }}
      transition={{ duration: 4 + Math.random() * 3, delay, repeat: Infinity, ease: "easeOut" }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Anillo expansivo                                                    */
/* ------------------------------------------------------------------ */
function PulseRing({ delay, scale }: { delay: number; scale: number }) {
  return (
    <motion.div
      className="absolute inset-0 rounded-full border border-amber-400/30"
      initial={{ scale: 0.8, opacity: 0.6 }}
      animate={{ scale: scale, opacity: 0 }}
      transition={{ duration: 2.5, delay, repeat: Infinity, ease: "easeOut" }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Puntos animados "..."                                               */
/* ------------------------------------------------------------------ */
function AnimatedDots() {
  return (
    <span className="inline-flex gap-[3px] ml-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400"
          animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Pantalla principal                                                  */
/* ------------------------------------------------------------------ */
export default function ServerWakingScreen() {
  const { status } = useServerStatus();
  const [elapsed, setElapsed] = useState(0);
  const [justWoke, setJustWoke] = useState(false);
  const prevStatus = useRef(status);
  const startTime = useRef<number | null>(null);

  // Cronómetro: cuenta desde que se mostró la pantalla
  useEffect(() => {
    if (status === "waking") {
      if (startTime.current === null) startTime.current = Date.now();
      const id = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime.current!) / 1000));
      }, 1000);
      return () => clearInterval(id);
    }
  }, [status]);

  // Animación de "¡Listo!" cuando despierta
  useEffect(() => {
    if (prevStatus.current === "waking" && status === "awake") {
      setJustWoke(true);
      const t = setTimeout(() => {
        setJustWoke(false);
        startTime.current = null;
        setElapsed(0);
      }, 2000);
      return () => clearTimeout(t);
    }
    prevStatus.current = status;
  }, [status]);

  const visible = status === "waking" || justWoke;

  const particles = useRef(
    Array.from({ length: 18 }, (_, i) => ({
      delay: i * 0.4,
      x: 5 + Math.floor(Math.random() * 90),
      size: 4 + Math.floor(Math.random() * 6),
    }))
  );

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="server-waking"
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
          style={{
            background: "radial-gradient(ellipse at 50% 40%, #0f172a 0%, #020617 60%, #000 100%)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Partículas flotantes */}
          <div className="absolute inset-0 pointer-events-none">
            {particles.current.map((p, i) => (
              <Particle key={i} {...p} />
            ))}
          </div>

          {/* Resplandor de fondo */}
          <motion.div
            className="absolute w-[500px] h-[500px] rounded-full pointer-events-none"
            style={{
              background: justWoke
                ? "radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)"
                : "radial-gradient(circle, rgba(251,191,36,0.08) 0%, transparent 70%)",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Tarjeta central */}
          <motion.div
            className="relative z-10 flex flex-col items-center px-8 py-10 mx-4 max-w-sm w-full"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            {/* Logo con anillos de pulso */}
            <div className="relative flex items-center justify-center mb-8" style={{ width: 100, height: 100 }}>
              <PulseRing delay={0} scale={1.8} />
              <PulseRing delay={0.8} scale={2.4} />
              <PulseRing delay={1.6} scale={3.0} />

              <motion.div
                className="relative z-10 w-20 h-20 rounded-2xl overflow-hidden shadow-2xl"
                animate={
                  justWoke
                    ? { scale: [1, 1.2, 1], rotate: [0, -8, 8, 0] }
                    : { scale: [1, 1.04, 1] }
                }
                transition={
                  justWoke
                    ? { duration: 0.5 }
                    : { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
                }
              >
                <Image
                  src="/icon-512.png"
                  alt="Pitzbol"
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                  priority
                />
              </motion.div>
            </div>

            {/* Título */}
            <AnimatePresence mode="wait">
              {justWoke ? (
                <motion.h2
                  key="awake"
                  className="text-2xl font-bold text-green-400 mb-2 text-center"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  ¡Listo! 🚀
                </motion.h2>
              ) : (
                <motion.h2
                  key="waking"
                  className="text-2xl font-semibold text-white mb-2 text-center flex items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  Despertando el servidor
                  <AnimatedDots />
                </motion.h2>
              )}
            </AnimatePresence>

            {/* Barra de progreso indeterminada */}
            {!justWoke && (
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-1 mb-6">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: "linear-gradient(90deg, transparent, #fbbf24, #f59e0b, transparent)",
                    width: "40%",
                  }}
                  animate={{ x: ["-100%", "300%"] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            )}

            {/* Cronómetro */}
            {!justWoke && elapsed > 0 && (
              <motion.p
                className="text-slate-400 text-sm mb-5 tabular-nums"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {elapsed < 60
                  ? `${elapsed}s esperando...`
                  : `${Math.floor(elapsed / 60)}m ${elapsed % 60}s esperando...`}
              </motion.p>
            )}

            {/* Separador */}
            <div className="w-full border-t border-slate-700/50 mb-5" />

            {/* Mensaje principal */}
            <motion.p
              className="text-slate-300 text-sm text-center leading-relaxed mb-3"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              El servidor está en <span className="text-amber-400 font-medium">modo reposo</span>.
              Tardará unos{" "}
              <span className="text-white font-medium">30–60 segundos</span> en encenderse.
            </motion.p>

            {/* Caja de "ahorro" */}
            <motion.div
              className="w-full rounded-xl p-4 text-center"
              style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)" }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <p className="text-xs text-slate-400 leading-relaxed">
                🌱{" "}
                <span className="text-amber-400/80 font-medium">
                  Operamos con un plan gratuito
                </span>{" "}
                para mantener el servicio accesible. El servidor se apaga automáticamente
                cuando no hay actividad y se vuelve a encender con tu primera visita.
              </p>
            </motion.div>

            {/* Texto de espera */}
            {!justWoke && (
              <motion.p
                className="text-slate-500 text-xs mt-4 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0.6, 1] }}
                transition={{ delay: 1.5, duration: 2, repeat: Infinity }}
              >
                La página cargará automáticamente cuando esté disponible
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
