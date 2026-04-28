"use client";
import React, { useEffect, useState } from "react";
import GuideInfo from "./GuideInfo";
import GuideModal from "./GuideModal";
import { useRouter } from "next/navigation";
import { getBackendOrigin } from "@/lib/backendUrl";

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

    const locallyPending =
      guideStatus === "pendiente" ||
      guideStatus === "en_revision" ||
      hasGuideFlag;

    if (!locallyPending) {
      setIsPending(false);
      return;
    }

    // Si localStorage dice pendiente, verificar que realmente exista la solicitud en el backend
    const token = localStorage.getItem("pitzbol_token");
    fetch(`${getBackendOrigin()}/api/guides/my-request`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
    })
      .then(res => {
        if (res.status === 404) {
          // El backend no tiene solicitud: permitir que complete el registro
          setIsPending(false);
        } else {
          setIsPending(true);
        }
      })
      .catch(() => {
        // Si no se puede conectar, confiar en el estado local
        setIsPending(locallyPending);
      });
  }, [isOpen]);

  const handleContinue = () => {
    if (isPending) {
      onClose();
      router.push("/guide/estatus");
      return;
    }
    setShowInfo(false);
    setTimeout(() => setShowGuideModal(true), 200);
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
