import { AlertTriangle, X } from 'lucide-react';
import { ModalCard } from './ModalCard';

/**
 * ConfirmationModal — the PIN-family confirmation dialog, ported from Phoenix
 * Insight Nexus' `frontend/src/components/ConfirmationModal.tsx` (adapted to
 * Tekton conventions: named export, parent-owned lifecycle, and an `okOnly`
 * alert-style mode that replaces native `window.alert`).
 *
 * The chrome (scrim, dialog semantics, focus trap, Esc — including the
 * topmost-modal rule for nested dialogs) lives in `ModalCard`, shared with
 * the setup wizard; this component is the family's *content*: variant icon,
 * message, and the Confirm/Cancel action row. WCAG 2.2 AA additions over
 * PIN's original: role/aria-modal/labelled title + focus management.
 */

export interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  variant?: 'danger' | 'warning' | 'info';
  confirmText?: string;
  cancelText?: string;
  /** Alert-style dialog (replaces window.alert): a single OK button. */
  okOnly?: boolean;
  onConfirm(): void;
  onCancel(): void;
}

const VARIANT_STYLES = {
  danger: {
    iconBg: 'bg-red-500/15',
    iconColor: 'text-red-400',
    button: 'bg-red-500 hover:bg-red-600',
  },
  warning: {
    iconBg: 'bg-amber-500/15',
    iconColor: 'text-amber-400',
    button: 'bg-amber-500 hover:bg-amber-600',
  },
  info: {
    iconBg: 'bg-brand-secondary/15',
    iconColor: 'text-brand-secondary',
    button: 'bg-brand-secondary hover:bg-brand-primary',
  },
} as const;

export function ConfirmationModal(props: ConfirmationModalProps) {
  if (!props.isOpen) return null;

  const variant = VARIANT_STYLES[props.variant ?? 'danger'];
  const buttonBase =
    'flex-1 py-2.5 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg transition-all active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100';

  return (
    <ModalCard labelledBy="tk-dialog-title" onEscape={props.onCancel}>
      <div className="px-6 py-5 border-b border-gray-700 flex items-center justify-between">
        <h2
          id="tk-dialog-title"
          className="text-lg font-black uppercase tracking-tighter text-white"
        >
          {props.title}
        </h2>
        <button
          type="button"
          onClick={props.onCancel}
          className="tk-close"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <div className="p-6">
        <div className="flex gap-4">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${variant.iconBg}`}
            aria-hidden="true"
          >
            <AlertTriangle className={`w-5 h-5 ${variant.iconColor}`} aria-hidden="true" />
          </div>
          <p className="flex-1 min-w-0 text-sm text-gray-300 leading-relaxed">
            {props.message}
          </p>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-gray-700 flex gap-3">
        {!props.okOnly && (
          <button
            type="button"
            onClick={props.onCancel}
            className="flex-1 py-2.5 border border-gray-600 text-gray-300 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-gray-700 transition-all motion-reduce:transition-none"
          >
            {props.cancelText ?? 'Cancel'}
          </button>
        )}
        <button
          type="button"
          onClick={props.onConfirm}
          className={`${buttonBase} ${variant.button}`}
        >
          {props.confirmText ?? 'Confirm'}
        </button>
      </div>
    </ModalCard>
  );
}