"use client";
import React, { useRef, useEffect, useState } from "react";
import styles from "../styles/GuideInfo.module.css";
import { FaMapMarkedAlt, FaUserEdit, FaWallet, FaRegComments, FaStar, FaCalendarAlt, FaCheckCircle, FaUserFriends, FaIdCard, FaCamera, FaUniversity } from "react-icons/fa";

interface GuideInfoProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
}

const GuideInfo: React.FC<GuideInfoProps> = ({ isOpen, onClose, onContinue }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);
  const [showArrow, setShowArrow] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined' || !isOpen) return;
    const handleScroll = () => {
      const el = contentRef.current;
      if (!el) return;
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 10;
      setShowArrow(!atBottom);
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const el = contentRef.current;
    if (el) el.addEventListener('scroll', handleScroll);
    window.addEventListener('keydown', handleEsc);
    handleScroll();
    return () => {
      if (el) el.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  const scrollToBtn = () => {
    if (btnRef.current) {
      btnRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (!isOpen) return null;
  return (
    <div className={styles.guideInfoOverlay}>
      <div className={styles.guideInfoModal}>
        <div className={styles.guideInfoHeader}>
          <div className={styles.guideInfoHeaderIcon}><FaUserFriends /></div>
          <div className={styles.guideInfoHeaderTitle}>¡Conviértete en Guía de Pitzbol!</div>
          <button onClick={onClose} style={{position:'absolute',top:18,right:24,fontSize:22,background:'none',border:'none',cursor:'pointer',color:'#fff'}} aria-label="Cerrar">×</button>
        </div>
        <div className={styles.guideInfoContent} ref={contentRef} style={{position:'relative'}}>
          <div style={{fontSize:'1.13rem',color:'#3B5D50',marginBottom:'0.7rem',textAlign:'center',lineHeight:1.6}}>
            <b>¿Te apasiona mostrar tu ciudad?</b> <br/>
            Convertirte en guía en Pitzbol es mucho más que solo acompañar turistas: es compartir tu historia, tu cultura y tu pasión con personas de todo el mundo.<br/><br/>
            <b>¿Qué podrás hacer como guía?</b>
          </div>
          <ul className={styles.guideInfoList}>
            <li><FaCheckCircle color="#769C7B" size={20}/> Publicar tus propios tours o simplemente ofrecerte como guía personal para turistas.</li>
            <li><FaCalendarAlt color="#769C7B" size={20}/> Gestionar tus tours, horarios y disponibilidad de forma sencilla.</li>
            <li><FaMapMarkedAlt color="#769C7B" size={20}/> Aparecer en el mapa de tours para que te encuentren fácilmente.</li>
            <li><FaRegComments color="#769C7B" size={20}/> Chatear directamente con los clientes para resolver dudas y coordinar detalles.</li>
            <li><FaUserEdit color="#769C7B" size={20}/> Tener un perfil público listo para personalizar y destacar tus fortalezas.</li>
            <li><FaWallet color="#769C7B" size={20}/> Recibir pagos seguros y llevar el control de tus ingresos desde tu cartera digital.</li>
            <li><FaStar color="#769C7B" size={20}/> Ser calificado por los usuarios y construir tu reputación como guía local.</li>
          </ul>
          <div style={{fontSize:'1.05rem',color:'#769C7B',background:'#F6F8F7',borderLeft:'4px solid #3B5D50',padding:'0.7rem 1rem',borderRadius:'0.7rem',marginBottom:'1rem',animation:'fadeInItem 0.7s'}}>Recuerda: <b>todos los tours que publiques serán revisados y aprobados por un administrador</b> para garantizar la mejor experiencia a los viajeros.</div>
          <div style={{
            background: 'linear-gradient(90deg, #fff 80%, #ffeaea 100%)',
            border: '1.5px solid #F3B1B1',
            borderRadius: '1.2rem',
            marginBottom: '1.1rem',
            marginTop: '-0.3rem',
            boxShadow: '0 2px 12px rgba(185,8,8,0.06)',
            padding: '1.1rem 1.2rem 1.1rem 1.2rem',
            animation: 'fadeInItem 0.7s',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.7rem',
            color: '#B90808',
          }}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:'0.2rem'}}>
              <FaCamera style={{color:'#B90808',fontSize:22}}/>
              <span style={{fontWeight:800,fontSize:'1.13rem',color:'#B90808',letterSpacing:'-0.5px'}}>ANTES DE COMENZAR</span>
            </div>
            <span style={{color:'#B90808'}}>Para confirmar tu identidad, ten a la mano los siguientes documentos:</span>
            <ul style={{listStyle:'none',padding:0,margin:0,display:'flex',flexDirection:'column',gap:'0.6rem'}}>
              <li style={{display:'flex',alignItems:'center',gap:10}}>
                <FaIdCard color="#B90808" size={19}/>
                <span style={{color:'#B90808',display:'flex',alignItems:'center',gap:8}}>
                  <b>INE (credencial de elector frente y reverso)</b> vigente.
                </span>
              </li>
                  <span
                    style={{
                      fontSize: '0.85em',
                      color: '#B90808BB',
                      marginLeft: 8,
                      background: '#fff6',
                      padding: '2px 8px',
                      borderRadius: '8px',
                      border: '1px solid #F3B1B1',
                      fontWeight: 700,
                      fontStyle: 'italic',
                      verticalAlign: 'middle',
                      display: 'inline-block',
                      width: 'auto',
                      maxWidth: '100%',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    formato jpg, png o webp
                  </span>
              <li style={{display:'flex',alignItems:'center',gap:10}}>
                <FaCamera color="#B90808" size={19}/>
                <span style={{color:'#B90808'}}>Se te pedirá tomar <b>foto de tu rostro</b> para validar tu identidad.</span>
              </li>
              <li style={{display:'flex',alignItems:'center',gap:10}}>
                <FaCheckCircle color="#B90808" size={19}/>
                <span style={{color:'#B90808'}}>Busca buena iluminación y ten los documentos listos antes de iniciar.</span>
              </li>
            </ul>
          </div>
          <div style={{fontSize:'1.01rem',color:'#3B5D50',marginBottom:'0.5rem',textAlign:'center',lineHeight:1.5}}>
            <b>¿Listo para empezar?</b> Da el primer paso y únete a la comunidad de guías que están transformando la manera de viajar en México.<br/>
            <span style={{color:'#769C7B'}}>¡No estás solo! Nuestro equipo te acompaña en todo el proceso.</span>
          </div>
          <div ref={btnRef} className={styles.guideInfoActions}>
            <button className={styles.guideInfoBtn} onClick={onContinue}>
              ¡Quiero convertirme en guía!
            </button>
          </div>
          {showArrow && (
            <button
              onClick={scrollToBtn}
              style={{
                position: 'absolute',
                right: 24,
                bottom: 24,
                background: 'radial-gradient(circle at 60% 40%, #fff 70%, #3B5D50 100%)',
                border: '3px solid #3B5D50',
                borderRadius: '50%',
                boxShadow: '0 4px 24px 0 #3B5D5040',
                width: 70,
                height: 70,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 1200,
                animation: 'arrowBounce 1.2s infinite',
                outline: 'none',
                pointerEvents: 'auto',
                transition: 'box-shadow 0.2s',
              }}
              aria-label="Ir al botón de guía"
            >
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="24" cy="24" r="22" fill="#3B5D50" fillOpacity="0.18"/>
                <path d="M24 15V34" stroke="#3B5D50" strokeWidth="4" strokeLinecap="round"/>
                <path d="M16 27L24 35L32 27" stroke="#3B5D50" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
// Inicializar estilos de animación en el cliente
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `@keyframes arrowBounce { 0%,100%{transform:translateY(0);} 50%{transform:translateY(12px);} }`;
  if (!document.getElementById('arrow-bounce-style')) {
    style.id = 'arrow-bounce-style';
    document.head.appendChild(style);
  }
}

export default GuideInfo;
