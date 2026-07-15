"use client";

import { Modal } from "@/components/ui/modal";
import { useModal } from "@/providers/modal-provider";

export function EnglishComingSoonModal() {
  const { isEnglishModalOpen, closeEnglishModal } = useModal();

  return (
    <Modal
      isOpen={isEnglishModalOpen}
      onClose={closeEnglishModal}
      title="English — Coming Soon"
      description="We're preparing the English version of Arab Skills Bank. The platform is currently available in Arabic. We'll notify you when English launches."
    />
  );
}
