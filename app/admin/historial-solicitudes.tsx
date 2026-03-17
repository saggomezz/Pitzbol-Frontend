"use client";
import React, { useEffect, useState } from "react";
import styles from "../styles/Negocios.module.css";
import { fetchWithAuth } from "../../lib/fetchWithAuth";


export default function AdminHistorialSolicitudesPage() {
  const [negocios, setNegocios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    fetchNegocios();
  }, []);

  const fetchNegocios = async () => {
    setLoading(true);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const res = await fetchWithAuth(`${API_BASE}/api/admin/negocios`);
      if (res.ok) {
        const data = await res.json();
        setNegocios(data.negocios || []);
      } else {
        setNegocios([]);
      }
    } catch (e) {
      setNegocios([]);
    }
    setLoading(false);
  };

  if (loading) return <div className="p-8 text-center">Cargando historial...</div>;

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6 text-[#3B5D50]">Historial de Solicitudes de Negocios</h2>
      <div className={styles.negociosGrid}>
        {negocios.length === 0 ? (
          <div className="text-gray-600">No hay solicitudes registradas.</div>
        ) : (
          negocios.map(neg => (
            <div key={neg.id} className={styles.negocioCard}>
              <div className="font-bold text-lg text-[#3B5D50]">{neg.name}</div>
              <div className="text-gray-700 mb-2">{neg.description}</div>
              <div className={styles.negocioImages}>
                {neg.images && neg.images.map((img: string, i: number) => (
                  <img key={i} src={img} alt="Imagen negocio" />
                ))}
              </div>
              <div className={`text-xs mb-2 negocioStatus ${styles.negocioStatus} ${styles[neg.status]}`}>Estado: {neg.status}</div>
              <div className="text-xs text-gray-500 mb-2">Dueño: {neg.owner}</div>
              <div className="text-xs text-gray-500 mb-2">Historial:</div>
              <ul className="text-xs text-gray-600 mb-2 list-disc ml-6">
                {neg.history && neg.history.map((h: any, i: number) => (
                  <li key={i}>{h.action} por {h.by} el {h.date?.toDate?.().toLocaleString?.() || h.date} {h.reason && `- Motivo: ${h.reason}`}</li>
                ))}
              </ul>
              {neg.archivedReason && (
                <div className="text-xs text-red-600">Motivo de archivado: {neg.archivedReason}</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
