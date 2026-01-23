"use client";
import React, { useEffect, useState } from "react";
import styles from "../styles/Negocios.module.css";

import { enviarNotificacion } from "../../lib/notificaciones";

export default function AdminNegociosPendientesPage() {
  const [negocios, setNegocios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [accion, setAccion] = useState<"" | "aprobado" | "rechazado">("");
  const [motivoRechazo, setMotivoRechazo] = useState("");

  useEffect(() => {
    fetchNegocios();
  }, []);

  const fetchNegocios = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/negocios?status=pendiente`);
      const data = await res.json();
      setNegocios(data);
    } catch (e) {
      setNegocios([]);
    }
    setLoading(false);
  };

  const handleDecision = async (aprobado: boolean) => {
    if (!selected) return;
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/negocios/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: aprobado ? "aprobado" : "rechazado",
        updatedAt: new Date().toISOString(),
        history: [...(selected.history || []), { action: aprobado ? "aprobado" : "rechazado", date: new Date().toISOString(), by: "admin", reason: aprobado ? undefined : motivoRechazo }],
      })
    });
    enviarNotificacion(
      selected.owner,
      aprobado ? 'aprobado' : 'rechazado',
      aprobado ? 'Negocio aprobado' : 'Negocio rechazado',
      aprobado
        ? '¡Tu negocio ha sido aprobado y ya es visible para los usuarios!'
        : `Tu solicitud de negocio fue rechazada. Motivo: ${motivoRechazo}`,
      '/negocio/estatus'
    );
    setSelected(null);
    setMotivoRechazo("");
    fetchNegocios();
  };

  if (loading) return <div className="p-8 text-center">Cargando negocios pendientes...</div>;

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6 text-[#3B5D50]">Negocios Pendientes</h2>
      <div className={styles.negociosGrid}>
        {negocios.map(neg => (
          <div key={neg.id} className={styles.negocioCard + " cursor-pointer"} onClick={() => setSelected(neg)}>
            <div style={{flex:1}}>
              <div className="font-bold text-lg text-[#3B5D50]">{neg.name}</div>
              <div className="text-gray-700 mb-2">{neg.description}</div>
              <div className={styles.negocioImages}>
                {neg.images && neg.images.map((img: string, i: number) => (
                  <img key={i} src={img} alt="Imagen negocio" />
                ))}
              </div>
              <div className={`text-xs mb-2 negocioStatus ${styles.negocioStatus} ${styles[neg.status]}`}>Dueño: {neg.owner} <span className={styles.pendiente}>Pendiente</span></div>
            </div>
          </div>
        ))}
      </div>
      {/* Modal de vista previa y decisión */}
      {selected && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard + " animate-fadeIn"}>
            <h3 className="text-xl font-bold mb-4 text-[#3B5D50]">Revisar Negocio</h3>
            <div className="mb-2"><b>Nombre:</b> {selected.name}</div>
            <div className="mb-2"><b>Descripción:</b> {selected.description}</div>
            <div className="mb-2"><b>Dueño:</b> {selected.owner}</div>
            <div className={styles.negocioImages} style={{marginBottom:16}}>
              {selected.images && selected.images.map((img: string, i: number) => (
                <img key={i} src={img} alt="Imagen negocio" />
              ))}
            </div>
            <div className={styles.modalActions}>
              <button className={styles.negocioBtn + " " + styles.editBtn} onClick={() => { setAccion("aprobado"); handleDecision(true); }}>Aprobar</button>
              <button className={styles.negocioBtn + " " + styles.deleteBtn} onClick={() => setAccion("rechazado")}>Rechazar</button>
              <button className={styles.negocioBtn} style={{background:'#e5e7eb',color:'#222'}} onClick={() => setSelected(null)}>Cerrar</button>
            </div>
            {accion === "rechazado" && (
              <div className="mt-2">
                <label className="block mb-2 text-[#B90808]">Motivo de rechazo</label>
                <input className={styles.negocioInput} value={motivoRechazo} onChange={e => setMotivoRechazo(e.target.value)} placeholder="Motivo..." />
                <button className={styles.negocioBtn + " " + styles.deleteBtn} onClick={() => handleDecision(false)} disabled={!motivoRechazo}>Confirmar rechazo</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
