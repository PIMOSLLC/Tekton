import { useEffect, useRef, type ReactNode } from 'react';

export interface ModalCardProps {
  /** id of the modal's title element (aria-labelledby target). */
  labelledBy: string;
  /** Called on Esc. */
  onEscape(): void;
  /** Extra card classes (sizing overrides etc.). */
  cardClassName?: string;
  /** Extra scrim classes (entry animations etc.). */
  scrimClassName?: string;
  children: ReactNode;
}

/**
 * ModalCard — the modal chrome every dialog in the app shares: scrim +
 * labelled dialog card + initial focus + Esc (cancel) + a Tab wrap so
 * keyboard focus cannot escape.
 *
 * Nested modals are supported by a TOPMOST rule: with several dialogs in the
 * DOM, only the last-mounted one (document order = paint order) handles Esc
 * and Tab — the wizard keeps its state while the discard-confirm above it
 * takes the keys, and background modals simply fall silent instead of
 * fighting over the keyboard.
 */
export function ModalCard({ labelledBy, onEscape, cardClassName = '', scrimClassName = '', children }: ModalCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const escapeRef = useRef(onEscape);
  escapeRef.current = onEscape;

  useEffect(() => {
    cardRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      const modals = document.querySelectorAll('.tk-modal-dialog');
      // Only the topmost modal reacts to the keyboard.
      if (modals.length === 0 || modals[modals.length - 1] !== cardRef.current) return;
      if (e.key === 'Escape') {
        // The modal owns Esc: stop the pushed panel's document-level handler.
        e.stopImmediatePropagation();
        escapeRef.current();
        return;
      }
      if (e.key === 'Tab' && cardRef.current) {
        const focusables = cardRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, select, textarea',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, []);

  return (
    // The scrim is not a close affordance (owner direction: clicking outside
    // the panels means "interact", never "dismiss") — Esc, X, and the buttons
    // decide this dialog's fate, matching PIN's modal.
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm ${scrimClassName}`}
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`tk-modal-dialog bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-gray-700 focus:outline-none ${cardClassName}`}
      >
        {children}
      </div>
    </div>
  );
}