"use client";
import React, { useEffect, useState } from "react";

import { usePitzbolUser } from "../../lib/usePitzbolUser";
import Link from "next/link";
import styles from "../styles/Negocios.module.css";

export default function EstatusNegocioPage() {
  const user = usePitzbolUser();
  const [negocios, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function fetchBusiness() {
      setLoading(true);
      if (!user) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/negocios?owner=${user.uid}`);
        const data = await res.json();
        if (data.length > 0) setBusiness(data[0]);
      } catch (e) {
        setBusiness(null);
      }
      setLoading(false);
    }
    fetchBusiness();
  }, [user]);

  if (!user) return <div className="p-8 text-center">Debes iniciar sesión para ver el estatus de tu negocio.</div>;
  if (loading) return <div className="p-8 text-center">Cargando...</div>;
  if (!negocios) return <div className="p-8 text-center">No has enviado ninguna solicitud de negocio.<br/><Link href="/negocio" className="text-blue-600 underline">Publicar negocio</Link></div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F6F8F7] p-4">
      <div className={styles.negocioCard + " w-full max-w-md"} style={{marginTop:32}}>
        <h2 className="text-2xl font-bold mb-4 text-[#3B5D50]">Estatus de tu Solicitud</h2>
        <div className="mb-4">
          <b>Nombre:</b> {negocios.name}<br/>
          <b>Descripción:</b> {negocios.description}<br/>
          <b>Estatus:</b> <span className={`negocioStatus ${styles.negocioStatus} ${styles[negocios.status]}`}>{negocios.status}</span>
        </div>
        {negocios.images && negocios.images.length > 0 && (
          <div className={styles.negocioImages} style={{marginBottom:16}}>
            {negocios.images.map((img: string, i: number) => (
              <img key={i} src={img} alt="Imagen negocio" />
            ))}
          </div>
        )}
        <div className="text-sm text-gray-500 mb-2">Última actualización: {negocios.updatedAt?.toDate?.().toLocaleString?.() || "-"}</div>
        <Link href="/negocio/preview" className="text-blue-600 underline">Ver detalles enviados</Link>
      </div>
    </div>
  );
}
