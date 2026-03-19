"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BusinessInfo from "./BusinessInfo";
import BusinessModal from "./BusinessModal";
import { FiAlertTriangle } from "react-icons/fi";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

/**
 * Wrapper para mostrar primero la pantalla informativa,
 * y después el modal de registro de negocio.
 * Si el usuario ya tiene solicitudes previas, muestra una advertencia.
 */
const PublishBusinessFlow: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [showInfo, setShowInfo] = useState(true);
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [existingCount, setExistingCount] = useState(0);
  const [existingIds, setExistingIds] = useState<string[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [fetchFailed, setFetchFailed] = useState(false);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setShowInfo(true);
      setShowBusinessModal(false);
      setShowWarning(false);
      setFetchFailed(false);
      setExistingIds([]);
    }
  }, [isOpen]);

  // Check for existing requests when flow opens
  useEffect(() => {
    if (!isOpen) return;
    const checkExisting = async () => {
      try {
        const token = localStorage.getItem("pitzbol_token");
        setIsLoggedIn(!!token);
        if (!token) return;
        const res = await fetch(`${BACKEND_URL}/api/business/my-requests`, {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          console.warn("[PublishBusinessFlow] Error al verificar solicitudes:", res.status, res.statusText);
          setFetchFailed(true);
          return;
        }
        const data = await res.json();
        if (data.success) {
          const sols: any[] = data.solicitudes || [];
          setExistingCount(sols.length);
          setExistingIds(sols.map((s: any) => s.id).filter(Boolean));
        } else {
          setFetchFailed(true);
        }
      } catch (err) {
        console.warn("[PublishBusinessFlow] No se pudo verificar solicitudes existentes:", err);
        setFetchFailed(true);
      }
    };
    checkExisting();
  }, [isOpen]);

  const handleContinue = () => {
    if (existingCount > 0) {
      // Show warning before opening the form
      setShowInfo(false);
      setShowWarning(true);
    } else {
      setShowInfo(false);
      setTimeout(() => setShowBusinessModal(true), 200);
    }
  };

  const handleViewRequests = () => {
    onClose();
    if (existingIds.length === 1) {
      router.push(`/negocio/mis-solicitudes/${existingIds[0]}`);
    } else {
      router.push("/negocio/mis-solicitudes");
    }
  };

  const handleWarningContinue = () => {
    setShowWarning(false);
    setTimeout(() => setShowBusinessModal(true), 200);
  };

  const handleWarningViewRequests = () => {
    setShowWarning(false);
    onClose();
    if (existingIds.length === 1) {
      router.push(`/negocio/mis-solicitudes/${existingIds[0]}`);
    } else {
      router.push("/negocio/mis-solicitudes");
    }
  };

  const handleCloseAll = () => {
    setShowBusinessModal(false);
    setShowWarning(false);
    setShowInfo(true);
    onClose();
  };

  return (
    <>
      <BusinessInfo
        isOpen={isOpen && showInfo}
        onClose={onClose}
        onContinue={handleContinue}
        onViewRequests={(existingCount > 0 || (fetchFailed && isLoggedIn)) ? handleViewRequests : undefined}
        hasPendingRequests={existingCount > 0}
      />

      {/* Warning modal when user has existing requests */}
      {isOpen && showWarning && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 1100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "1.5rem",
              padding: "2.2rem 2.4rem",
              maxWidth: 460,
              width: "100%",
              boxShadow: "0 8px 40px rgba(59,93,80,0.18)",
              animation: "fadeInUp 0.3s",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  background: "#FFF3CD",
                  borderRadius: "50%",
                  width: 52,
                  height: 52,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <FiAlertTriangle size={26} color="#B08B00" />
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: "1.15rem",
                    color: "#3B5D50",
                  }}
                >
                  Ya tienes solicitudes enviadas
                </div>
                <div style={{ color: "#888", fontSize: "0.92rem", marginTop: 2 }}>
                  Tienes{" "}
                  <b style={{ color: "#B08B00" }}>
                    {existingCount} solicitud{existingCount > 1 ? "es" : ""}
                  </b>{" "}
                  de negocio registrada{existingCount > 1 ? "s" : ""}.
                </div>
              </div>
            </div>

            <p style={{ color: "#555", fontSize: "0.97rem", lineHeight: 1.6, marginBottom: 24 }}>
              ¿Deseas enviar <b>otra nueva solicitud</b> o prefieres revisar las que ya enviaste?
            </p>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <button
                onClick={handleWarningViewRequests}
                style={{
                  background: "linear-gradient(90deg,#3B5D50 60%,#769C7B 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "1rem",
                  padding: "0.7rem 1.5rem",
                  fontWeight: 700,
                  fontSize: "1rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                📋 Ver mis solicitudes enviadas
              </button>
              <button
                onClick={handleWarningContinue}
                style={{
                  background: "none",
                  border: "2px solid #3B5D50",
                  color: "#3B5D50",
                  borderRadius: "1rem",
                  padding: "0.65rem 1.5rem",
                  fontWeight: 700,
                  fontSize: "0.97rem",
                  cursor: "pointer",
                }}
              >
                Enviar otra solicitud de todas formas
              </button>
              <button
                onClick={handleCloseAll}
                style={{
                  background: "none",
                  border: "none",
                  color: "#aaa",
                  fontSize: "0.93rem",
                  cursor: "pointer",
                  padding: "0.4rem",
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <BusinessModal isOpen={isOpen && showBusinessModal} onClose={handleCloseAll} />
    </>
  );
};

export default PublishBusinessFlow;

