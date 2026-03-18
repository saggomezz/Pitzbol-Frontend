"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../styles/Negocios.module.css";
import { fetchWithAuth } from "../../lib/fetchWithAuth";
import { enviarNotificacion } from "../../lib/notificaciones";

export default function AdminNegociosPage() {
  const router = useRouter();
  const [negocios, setNegocios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'registrados' | 'pendientes' | 'archivados'>('registrados');

  useEffect(() => {
    fetchNegocios();
    // eslint-disable-next-line
  }, [tab]);

  const fetchNegocios = async () => {
    setLoading(true);
    const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
    let endpoint = `${API_BASE}/api/admin/negocios`;
    if (tab === 'pendientes') endpoint = `${API_BASE}/api/admin/negocios/pendientes`;
    if (tab === 'archivados') endpoint = `${API_BASE}/api/admin/negocios/archivados`;
    try {
      const res = await fetchWithAuth(endpoint, {
        headers: { "Content-Type": "application/json" },
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

  if (loading) return <div className="p-8 text-center">Cargando negocios...</div>;

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6 text-[#3B5D50]">Gestionar Negocios</h2>
      <div style={{display:'flex',gap:16,marginBottom:32}}>
        <button
          className={tab==='registrados' ? styles.tabActive : styles.tab}
          onClick={()=>setTab('registrados')}
        >Registrados</button>
        <button
          className={tab==='pendientes' ? styles.tabActive : styles.tab}
          onClick={()=>setTab('pendientes')}
        >Pendientes</button>
        <button
          className={tab==='archivados' ? styles.tabActive : styles.tab}
          onClick={()=>setTab('archivados')}
        >Archivados</button>
      </div>
      <div className={styles.negociosGrid}>
        {negocios.map(neg => {
          const logo = neg.business?.logo;
          const images = Array.isArray(neg.business?.images) ? neg.business.images.filter((img: string) => !!img) : [];
          
          const handleClick = (e: React.MouseEvent) => {
            e.preventDefault();
            console.log('Clickeando negocio:', neg.id, neg.business?.name);
            router.push(`/admin/negocios/${neg.id}`);
          };
          
          return (
            <div 
              key={neg.id} 
              className={`${styles.negocioCard}`}
              onClick={handleClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleClick(e as any);
                }
              }}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{flex:1, pointerEvents: 'none'}}>
                <div className="font-bold text-lg text-[#3B5D50]">{neg.business?.name}</div>
                <div className="text-gray-700 mb-2">{neg.business?.description}</div>
                <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:8}}>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',border:'2px dashed #B0B0B0',borderRadius:12,width:80,height:80,background:'#FAFAFA'}}>
                    {logo ? (
                      <img src={logo} alt="Logo negocio" style={{maxWidth:64,maxHeight:64,borderRadius:8}} />
                    ) : (
                      <span style={{fontSize:32,opacity:0.3}}>🖼️<br/><span style={{fontSize:10}}>Logo</span></span>
                    )}
                  </div>
                  <div style={{display:'flex',gap:8}}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',border:'2px dashed #B0B0B0',borderRadius:12,width:80,height:80,background:'#FAFAFA'}}>
                        {images[i] ? (
                          <img src={images[i]} alt={`Imagen galería ${i+1}`} style={{maxWidth:64,maxHeight:64,borderRadius:8}} />
                        ) : (
                          <span style={{fontSize:32,opacity:0.3}}>🖼️<br/><span style={{fontSize:10}}>Foto {i+1}</span></span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className={`text-xs mb-2 negocioStatus ${styles.negocioStatus} ${styles[neg.status]}`}>{neg.status}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
