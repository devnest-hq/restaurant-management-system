import { useEffect } from "react";
import "./ui.css";

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
  closeOnBackdrop = true,
  closeOnEscape = true,
  className = "",
}) {
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (event) => {
    if (closeOnBackdrop && event.target === event.currentTarget) onClose?.();
  };

  return (
    <div className="dn-modal-backdrop" onMouseDown={handleBackdropClick}>
      <section
        className={`dn-modal dn-modal--${size} ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "dn-modal-title" : undefined}
      >
        <header className="dn-modal__header">
          {title && <h2 id="dn-modal-title" className="dn-modal__title">{title}</h2>}
          <button
            type="button"
            className="dn-modal__close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </header>
        <div className="dn-modal__content">{children}</div>
        {footer && <footer className="dn-modal__footer">{footer}</footer>}
      </section>
    </div>
  );
}
