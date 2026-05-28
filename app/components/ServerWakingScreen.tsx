"use client";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useServerStatus } from "../context/ServerStatusContext";

/* ------------------------------------------------------------------ */
/*  Anillo expansivo (paleta Pitzbol)                                  */
/* ------------------------------------------------------------------ */
function PulseRing({ delay, scale }: { delay: number; scale: number }) {
  return (
    <motion.div
      className="absolute inset-0 rounded-full border-2"
      style={{ borderColor: "rgba(13,96,30,0.25)" }}
      initial={{ scale: 0.85, opacity: 0.7 }}
      animate={{ scale: scale, opacity: 0 }}
      transition={{ duration: 2.4, delay, repeat: Infinity, ease: "easeOut" }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Puntos animados "..."                                              */
/* ------------------------------------------------------------------ */
function AnimatedDots() {
  return (
    <span className="inline-flex gap-1 ml-1.5 align-middle">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{ background: "#F00808" }}
          animate={{ y: [0, -5, 0], opacity: [0.35, 1, 0.35] }}
          transition={{ duration: 1.1, delay: i * 0.18, repeat: Infinity, ease: "easeInOut" }}
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

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="server-waking"
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden px-4"
          style={{
            background:
              "radial-gradient(ellipse at 50% 30%, #FBF7EE 0%, #F6F0E6 55%, #E9DFC9 100%)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
        >
          {/* Patrón sutil de pasto/hojas en el fondo */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.07]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 80%, #0D601E 0%, transparent 40%), radial-gradient(circle at 80% 20%, #1A4D2E 0%, transparent 45%)",
            }}
          />

          {/* Tarjeta central */}
          <motion.div
            className="relative z-10 flex flex-col items-center w-full max-w-md bg-white/80 backdrop-blur-sm rounded-[28px] shadow-[0_20px_60px_-15px_rgba(26,77,46,0.25)] border border-[#1A4D2E]/10 px-6 sm:px-8 py-9 sm:py-10"
            initial={{ y: 24, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Logo con anillos de pulso */}
            <div
              className="relative flex items-center justify-center mb-7"
              style={{ width: 108, height: 108 }}
            >
              <PulseRing delay={0} scale={1.7} />
              <PulseRing delay={0.7} scale={2.2} />
              <PulseRing delay={1.4} scale={2.7} />

              <motion.div
                className="relative z-10 w-24 h-24 rounded-3xl overflow-hidden flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #1A4D2E 0%, #0D601E 100%)",
                  boxShadow: "0 12px 30px -8px rgba(13,96,30,0.45)",
                }}
                animate={
                  justWoke
                    ? { scale: [1, 1.18, 1], rotate: [0, -6, 6, 0] }
                    : { scale: [1, 1.04, 1] }
                }
                transition={
                  justWoke
                    ? { duration: 0.5 }
                    : { duration: 2.6, repeat: Infinity, ease: "easeInOut" }
                }
              >
                <Image
                  src="/icon-512.png"
                  alt="Pitzbol"
                  width={84}
                  height={84}
                  className="w-20 h-20 object-contain drop-shadow"
                  priority
                />
              </motion.div>
            </div>

            {/* Marca PITZBOL */}
            <h1
              className="text-3xl leading-none mb-3 drop-shadow-[1px_2px_2px_rgba(0,0,0,0.15)]"
              style={{ fontFamily: "'Jockey One', sans-serif", color: "#1A4D2E" }}
            >
              PITZ<span style={{ color: "#F00808" }}>BOL</span>
            </h1>

            {/* Título dinámico */}
            <AnimatePresence mode="wait">
              {justWoke ? (
                <motion.h2
                  key="awake"
                  className="text-lg font-semibold mb-1 text-center"
                  style={{ color: "#0D601E" }}
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  ¡Listo! Bienvenido
                </motion.h2>
              ) : (
                <motion.h2
                  key="waking"
                  className="text-lg sm:text-xl font-semibold mb-1 text-center flex items-center justify-center"
                  style={{ color: "#1A4D2E" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  Preparando tu experiencia
                  <AnimatedDots />
                </motion.h2>
              )}
            </AnimatePresence>

            {/* Subtítulo */}
            {!justWoke && (
              <p className="text-sm text-[#769C7B] text-center mb-6">
                Estamos abriendo las puertas de San Pedro
              </p>
            )}

            {/* Barra de progreso indeterminada */}
            {!justWoke && (
              <div
                className="w-full h-1.5 rounded-full overflow-hidden mb-5"
                style={{ background: "rgba(26,77,46,0.08)" }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, #0D601E, #1A4D2E, transparent)",
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
                className="text-[#769C7B] text-xs mb-4 tabular-nums font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {elapsed < 60
                  ? `${elapsed}s`
                  : `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`}
              </motion.p>
            )}

            {/* Tarjeta de contexto */}
            <motion.div
              className="w-full rounded-2xl p-4 text-center"
              style={{
                background: "rgba(13,96,30,0.06)",
                border: "1px solid rgba(13,96,30,0.12)",
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-xs text-[#1A4D2E]/80 leading-relaxed">
                <span className="font-semibold text-[#0D601E]">
                  Nuestro servidor estaba descansando.
                </span>{" "}
                Tardará unos <span className="font-semibold">30–60 segundos</span> en encenderse.
                Gracias por tu paciencia.
              </p>
            </motion.div>

            {!justWoke && (
              <motion.p
                className="text-[#769C7B]/80 text-[11px] mt-4 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0.6, 1] }}
                transition={{ delay: 1.2, duration: 2, repeat: Infinity }}
              >
                La página continuará automáticamente
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
