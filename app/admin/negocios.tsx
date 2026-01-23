"use client";
import React, { useEffect, useState } from "react";
import styles from "../styles/Negocios.module.css";
// import { db } from "../../lib/firebase";
// import { collection, query, getDocs, updateDoc, doc, Timestamp } from "firebase/firestore";
import { enviarNotificacion } from "../../lib/notificaciones";

export default function AdminNegociosPage() {
  const [negocios, setNegocios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [archivarId, setArchivarId] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");

  useEffect(() => {
    fetchNegocios();
  }, []);

  const fetchNegocios = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/admin/negocios", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          // Si usas JWT, agrega aquí el header Authorization
        },
      });
      const data = await res.json();
      if (data.success) {
        setNegocios(data.negocios);
      } else {
        setNegocios([]);
      }
    } catch (err) {
      setNegocios([]);
    }
    setLoading(false);
  };

  const handleArchivar = async () => {
    if (!archivarId) return;
    // Archivar negocio vía API REST
    try {
      const res = await fetch(`http://localhost:3001/api/admin/negocios/${archivarId}/archivar`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          // Si usas JWT, agrega aquí el header Authorization
        },
        body: JSON.stringify({ motivo, adminUid: "ADMIN_UID_AQUI" }) // Reemplaza por el UID real del admin
      });
      const data = await res.json();
      if (data.success) {
        setArchivarId(null);
        setMotivo("");
        fetchNegocios();
      } else {
        alert("Error al archivar negocio: " + (data.message || data.error));
      }
    } catch (err) {
      alert("Error de red al archivar negocio");
    }
  };

  if (loading) return <div className="p-8 text-center">Cargando negocios...</div>;

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6 text-[#3B5D50]">Administrar Negocios</h2>
      <div className={styles.negociosGrid}>
        {negocios.map(neg => (
          <div key={neg.id} className={styles.negocioCard}>
            <div style={{flex:1}}>
              <div className="font-bold text-lg text-[#3B5D50]">{neg.name}</div>
              <div className="text-gray-700 mb-2">{neg.description}</div>
              <div className={styles.negocioImages}>
                {neg.images && neg.images.map((img: string, i: number) => (
                  <img key={i} src={img} alt="Imagen negocio" />
                ))}
              </div>
              <div className={`text-xs mb-2 negocioStatus ${styles.negocioStatus} ${styles[neg.status]}`}>{neg.status}</div>
            </div>
            <div className={styles.negocioActions}>
              <button className={styles.negocioBtn + " " + styles.deleteBtn} onClick={() => setArchivarId(neg.id)}>Archivar</button>
            </div>
          </div>
        ))}
      </div>
      {/* Modal de archivado */}
      {archivarId && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard + " animate-fadeIn"}>
            <h3 className="text-xl font-bold mb-4 text-[#B90808]">¿Seguro que deseas archivar este negocio?</h3>
            <label className="block mb-2 text-[#B90808]">Motivo de archivado</label>
            <input className={styles.negocioInput} value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Motivo..." />
            <div className={styles.modalActions}>
              <button className={styles.negocioBtn + " " + styles.deleteBtn} onClick={handleArchivar} disabled={!motivo}>Archivar</button>
              <button className={styles.negocioBtn} style={{background:'#e5e7eb',color:'#222'}} onClick={() => setArchivarId(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
