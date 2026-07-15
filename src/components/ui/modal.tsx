"use client";

import { Button } from "@/components/ui/button";
import { IconClose } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { useEffect, useRef, type ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
}

export function Modal({ isOpen, onClose, title, description, children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === overlayRef.current) onClose();
      }}
    >
      <div className="absolute inset-0 bg-navy-900/15 backdrop-blur-[3px] dark:bg-black/50" aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? "modal-description" : undefined}
        className={cn(
          "relative w-full max-w-[26rem] rounded-md border border-border bg-surface surface-content p-8 shadow-md",
          "animate-[reveal_0.35s_cubic-bezier(0.22,1,0.36,1)_both]",
        )}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 id="modal-title" className="type-card-title text-foreground">
              {title}
            </h2>
            {description && (
              <p id="modal-description" className="type-body mt-2">
                {description}
              </p>
            )}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-foreground-muted transition-colors duration-200 hover:bg-sage-50 hover:text-foreground dark:hover:bg-sage-900/25 dark:hover:text-surface-text"
            aria-label="إغلاق"
          >
            <IconClose size={16} />
          </button>
        </div>

        {children}

        <div className="mt-8">
          <Button variant="primary" fullWidth onClick={onClose}>
            حسناً
          </Button>
        </div>
      </div>
    </div>
  );
}
