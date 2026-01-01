"use client";
import React, { useState } from "react";
import Papa from 'papaparse';
import { generarItinerarioManual, Lugar } from '@/lib/pitzbol-engine';
import { FiSend, FiClock, FiActivity } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

export default function ItinerarioPage() {
    // 1. SOLUCIÓN AL ERROR: Declaración del estado 'setResponse'
    const [response, setResponse] = useState("");
    const [loading, setLoading] = useState(false);
    const [tiempo, setTiempo] = useState(180); // 3 horas por defecto
    const [intereses, setIntereses] = useState<string[]>([]);

    const handleGenerar = async () => {
        setLoading(true);
        try {
            const res = await fetch('/datosLugares.csv');
            
            // 2. SOLUCIÓN AL ERROR: Verificar si body no es null
            if (!res.body) throw new Error("No se pudo leer el archivo de datos");

            const reader = res.body.getReader();
            const result = await reader.read();
            const decoder = new TextDecoder('utf-8');
            const csv = decoder.decode(result.value);

            // Convertir CSV a Objeto JSON
            const { data } = Papa.parse(csv, { 
                header: true, 
                dynamicTyping: true,
                skipEmptyLines: true 
            });
            
            // Ejecutar tu algoritmo manual de lib/pitzbol-engine.ts
            // Punto de partida: Centro de Guadalajara
            const resultadoTexto = generarItinerarioManual(
                data as Lugar[], 
                intereses.length > 0 ? intereses : ["futbol", "gastronomia"], 
                tiempo, 
                { lat: 20.6767, lng: -103.3371 } 
            );

            setResponse(resultadoTexto);
        } catch (error) {
            console.error("Error cargando el itinerario:", error);
            setResponse("¡Híjole! Hubo un problema al cargar los datos. Revisa que datosLugares.csv esté en la carpeta /public.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFCF9] p-6 md:p-12 flex flex-col items-center font-sans">
            <div className="max-w-3xl w-full space-y-8">
                <header className="text-center">
                    <h1 className="text-4xl font-black text-[#1A4D2E] uppercase" style={{ fontFamily: "'Jockey One', sans-serif" }}>
                        Planificador <span className="text-[#F00808]">Pitzbol</span>
                    </h1>
                    <p className="text-[#769C7B] italic mt-2">Algoritmo de rutas inteligentes para el Mundial 2026</p>
                </header>

                {/* CONTROLES DE USUARIO */}
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-[#F6F0E6] space-y-6">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#769C7B] flex items-center gap-2 mb-3">
                            <FiClock /> Tiempo disponible: {Math.floor(tiempo / 60)}h {tiempo % 60}min
                        </label>
                        <input 
                            type="range" min="60" max="600" step="30" 
                            value={tiempo} 
                            onChange={(e) => setTiempo(parseInt(e.target.value))}
                            className="w-full h-2 bg-[#F6F0E6] rounded-lg appearance-none cursor-pointer accent-[#1A4D2E]"
                        />
                    </div>

                    <button 
                        onClick={handleGenerar}
                        disabled={loading}
                        className="w-full bg-[#1A4D2E] text-white py-4 rounded-full font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-[#F00808] transition-all shadow-lg active:scale-95"
                    >
                        {loading ? "Calculando ruta óptima..." : <><FiActivity /> Generar mi Ruta Pitzbol</>}
                    </button>
                </div>

                {/* RESULTADO DEL ALGORITMO */}
                <AnimatePresence>
                    {response && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white p-8 md:p-10 rounded-[40px] shadow-xl border-l-8 border-[#1A4D2E] relative"
                        >
                            <div className="prose prose-green max-w-none">
                                <pre className="whitespace-pre-wrap font-sans text-[#1A4D2E] leading-relaxed text-sm md:text-base">
                                    {response}
                                </pre>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}