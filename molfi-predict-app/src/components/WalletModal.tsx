import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "./ui/button";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function WalletModal({ isOpen, onClose, children }: WalletModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="relative bg-background border border-border rounded-lg shadow-lg max-w-md w-full mx-4 p-6"
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
        {children}
      </div>
    </div>
  );
}
