"use client";
import React, { useEffect, useState } from "react";
import GuideInfo from "./GuideInfo";
import GuideModal from "./GuideModal";
import { useRouter } from "next/navigation";

/**
 * Este componente es un wrapper para mostrar primero la pantalla informativa,
 * y después el modal de registro de guía.
 */
const BecomeGuideFlow: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
  const [showInfo, setShowInfo] = useState(true);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;
    const storedUser = localStorage.getItem("pitzbol_user");
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    const hasGuideFlag = parsedUser?.uid
      ? localStorage.getItem(`pitzbol_guide_submitted_${parsedUser.uid}`) === "true"
      : false;
    const guideStatus = parsedUser?.guide_status;
    setIsPending(
      guideStatus === "pendiente" ||
      guideStatus === "en_revision" ||
      hasGuideFlag
    );
  }, [isOpen]);

  const handleContinue = () => {
    if (isPending) {
      onClose();
      router.push("/guide/estatus");
      return;
    }
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
      <GuideInfo isOpen={isOpen && showInfo} onClose={onClose} onContinue={handleContinue} isPending={isPending} />
      <GuideModal isOpen={isOpen && showGuideModal} onClose={handleCloseAll} />
    </>
  );
};

export default BecomeGuideFlow;
