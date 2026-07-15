"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface ModalContextValue {
  isEnglishModalOpen: boolean;
  openEnglishModal: () => void;
  closeEnglishModal: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isEnglishModalOpen, setIsEnglishModalOpen] = useState(false);

  const openEnglishModal = useCallback(() => setIsEnglishModalOpen(true), []);
  const closeEnglishModal = useCallback(() => setIsEnglishModalOpen(false), []);

  const value = useMemo(
    () => ({ isEnglishModalOpen, openEnglishModal, closeEnglishModal }),
    [isEnglishModalOpen, openEnglishModal, closeEnglishModal],
  );

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within ModalProvider");
  }
  return context;
}
