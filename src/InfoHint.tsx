import { useId } from 'react';
import { Info } from 'lucide-react';

export interface InfoHintProps {
  /** Spoken name of the trigger — the tip is not part of the accessible name. */
  label: string;
  tip: string;
}

/**
 * InfoHint — the ⓘ beside group labels (STAGES, LANES). Hover AND keyboard
 * focus reveal the tip (never hover-only — the same doctrine as the delete
 * controls and the status-footer tooltips), and aria-describedby links the
 * two so screen readers announce the tip after the trigger.
 */
export function InfoHint({ label, tip }: InfoHintProps) {
  const tipId = useId();
  return (
    <span className="tk-info-hint">
      <button
        type="button"
        className="tk-info-hint-btn"
        aria-label={label}
        aria-describedby={tipId}
      >
        <Info className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
      <span role="tooltip" id={tipId} className="tk-info-hint-tip">
        {tip}
      </span>
    </span>
  );
}