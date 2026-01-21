import React, { useState } from "react";
import GuideInfo from "./GuideInfo";
import GuideModal from "./GuideModal";

/**
 * Este componente es un wrapper para mostrar primero la pantalla informativa,
 * y después el modal de registro de guía.
 */
const BecomeGuideFlow: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
  const [showInfo, setShowInfo] = useState(true);
  const [showGuideModal, setShowGuideModal] = useState(false);

  const handleContinue = () => {
    setShowInfo(false);
    setTimeout(() => setShowGuideModal(true), 200); // Pequeña transición
  };

  const handleCloseAll = () => {
    setShowGuideModal(false);
    setShowInfo(true);
    onClose();
  };

  return (
    <>
      <GuideInfo isOpen={isOpen && showInfo} onClose={onClose} onContinue={handleContinue} />
      <GuideModal isOpen={isOpen && showGuideModal} onClose={handleCloseAll} />
    </>
  );
};

export default BecomeGuideFlow;
