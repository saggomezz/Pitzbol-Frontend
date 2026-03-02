"use client";
import React, { useState } from "react";
import BusinessInfo from "./BusinessInfo";
import BusinessModal from "./BusinessModal";

/**
 * Wrapper para mostrar primero la pantalla informativa,
 * y después el modal de registro de negocio.
 */
const PublishBusinessFlow: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
  const [showInfo, setShowInfo] = useState(true);
  const [showBusinessModal, setShowBusinessModal] = useState(false);

  const handleContinue = () => {
    setShowInfo(false);
    setTimeout(() => setShowBusinessModal(true), 200);
  };

  const handleCloseAll = () => {
    setShowBusinessModal(false);
    setShowInfo(true);
    onClose();
  };

  return (
    <>
      <BusinessInfo isOpen={isOpen && showInfo} onClose={onClose} onContinue={handleContinue} />
      <BusinessModal isOpen={isOpen && showBusinessModal} onClose={handleCloseAll} />
    </>
  );
};

export default PublishBusinessFlow;
