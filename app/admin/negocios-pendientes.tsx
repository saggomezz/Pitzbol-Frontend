"use client";
import React, { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import styles from "../styles/Negocios.module.css";
import { fetchWithAuth } from "../../lib/fetchWithAuth";
import { enviarNotificacion } from "../../lib/notificaciones";
import { gestionarNegocioPendiente } from "../../lib/gestionarNegocioApi";

export default function AdminNegociosPendientesPage() {
  const [negocios, setNegocios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [accion, setAccion] = useState<"" | "aprobado" | "rechazado">("");
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    fetchNegocios();
    
    // Conectar a Socket.io para recibir actualizaciones en tiempo real
    const token = localStorage.getItem("pitzbol_token");
    if (!token) {
      return;
    }
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
    
    socketRef.current = io(BACKEND_URL, {
      auth: {
        token,
      },
    });

    socketRef.current.on("connect_error", (error) => {
      if (error?.message === "Invalid token" || error?.message === "Authentication required") {
        socketRef.current?.disconnect();
      }
    });

    socketRef.current.on("connect", () => {
      console.log("Socket conectado para negocios pendientes");
    });

    // Escuchar nuevo negocio pendiente y refrescar lista
    socketRef.current.on("new-pending-business", (data: any) => {
      console.log("Nuevo negocio pendiente recibido:", data);
      // Refrescar la lista automáticamente
      fetchNegocios();
    });

    socketRef.current.on("disconnect", () => {
      console.log("Socket desconectado");
    });

    // Limpiar la conexión al desmontar
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const fetchNegocios = async () => {
    setLoading(true);
    const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
    try {
      const res = await fetchWithAuth(`${API_BASE}/api/admin/negocios/pendientes`, {
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        setNegocios(data.negocios);
      } else {
        setNegocios([]);
      }
    } catch (e) {
      setNegocios([]);
    }
    setLoading(false);
  };

  const handleDecision = async (aprobado: boolean) => {
    if (!selected) return;
    const adminUid = "ADMIN_UID_AQUI"; // Reemplaza por el UID real del admin si lo tienes
    await gestionarNegocioPendiente({
      negocioId: selected.id,
      accion: aprobado ? "aprobar" : "rechazar",
      adminUid,
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
        {negocios.map(neg => {
          const business = neg.business || {};
          const logo = business.logo;
          const images = Array.isArray(business.images) ? business.images.filter((img: string) => !!img) : [];
          return (
            <div key={neg.id} className={styles.negocioCard + " cursor-pointer"} onClick={() => setSelected(neg)}>
              <div style={{flex:1}}>
                {/* Logotipo */}
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',border:'2px dashed #B0B0B0',borderRadius:12,width:64,height:64,background:'#FAFAFA'}}>
                    {logo ? (
                      <img src={logo} alt="Logo negocio" style={{maxWidth:48,maxHeight:48,borderRadius:8}} />
                    ) : (
                      <span style={{fontSize:28,opacity:0.3}}>🖼️<br/><span style={{fontSize:10}}>Logo</span></span>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-lg text-[#3B5D50]">{business.name || "Sin nombre"}</div>
                    <div className="text-xs text-gray-700">{neg.email || business.email || "Sin email"}</div>
                  </div>
                </div>
                {/* Fecha de entrada */}
                <div className="text-xs text-gray-500 mb-1">
                  Fecha de entrada: {business.createdAt && business.createdAt.seconds ?
                    new Date(business.createdAt.seconds * 1000).toLocaleDateString('es-MX') :
                    (business.createdAt ? new Date(business.createdAt).toLocaleDateString('es-MX') : 'Sin fecha')}
                </div>
                <div className="text-gray-700 mb-2">{business.description || "Sin descripción"}</div>
                <div className={styles.negocioImages} style={{display:'flex',alignItems:'center',gap:16,marginBottom:8}}>
                  <div style={{display:'flex',gap:8}}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',border:'2px dashed #B0B0B0',borderRadius:12,width:64,height:64,background:'#FAFAFA'}}>
                        {images[i] ? (
                          <img src={images[i]} alt={`Imagen galería ${i+1}`} style={{maxWidth:48,maxHeight:48,borderRadius:8}} />
                        ) : (
                          <span style={{fontSize:28,opacity:0.3}}>🖼️<br/><span style={{fontSize:10}}>Foto {i+1}</span></span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className={`text-xs mb-2 negocioStatus ${styles.negocioStatus} ${styles[neg.status]}`}>Dueño: {business.owner || neg.owner || "Sin dueño"} <span className={styles.pendiente}>Pendiente</span></div>
              </div>
            </div>
          );
        })}
      </div>
      {/* Modal de vista previa y decisión */}
      {selected && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard + " animate-fadeIn"}>
            <h3 className="text-xl font-bold mb-4 text-[#3B5D50]">Revisar Negocio</h3>
            <div className="mb-2"><b>Nombre:</b> {selected.name || selected.business?.name || 'Sin nombre'}</div>
            <div className="mb-2"><b>Descripción:</b> {selected.description || selected.business?.description || 'Sin descripción'}</div>
            <div className="mb-2"><b>Dueño:</b> {selected.owner || selected.business?.owner || 'Sin dueño'}</div>
            <div className="mb-2"><b>Correo:</b> {selected.email || selected.business?.email || 'Sin correo'}</div>
            <div className="mb-2"><b>Fecha de publicación:</b> {
              selected.createdAt ?
                (typeof selected.createdAt === 'string' ?
                  new Date(selected.createdAt).toLocaleDateString('es-MX') :
                  (selected.createdAt.seconds ? new Date(selected.createdAt.seconds * 1000).toLocaleDateString('es-MX') : 'Sin fecha')
                ) :
              (selected.business?.createdAt ?
                (typeof selected.business.createdAt === 'string' ?
                  new Date(selected.business.createdAt).toLocaleDateString('es-MX') :
                  (selected.business.createdAt.seconds ? new Date(selected.business.createdAt.seconds * 1000).toLocaleDateString('es-MX') : 'Sin fecha')
                ) : 'Sin fecha')
            }</div>
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
