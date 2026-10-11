import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { BlueprintCard, BlueprintLane } from './types';
import { laneKindLabel } from './types';

export interface CardInspectorProps {
  open: boolean;
  lane: BlueprintLane | null;
  stageName: string;
  card: BlueprintCard | null;
  onCardChange(field: 'title' | 'blurb', value: string): void;
  onInterpretationChange(value: string): void;
  onClose(): void;
}

/**
 * CardInspector — the inspector-drawer reused as the card EDITOR in Build mode
 * (the engine's drawer pattern, doubled as an authoring surface). Focus returns
 * to the drawer's first field when opened; Esc closes.
 */
export function CardInspector(props: CardInspectorProps) {
  const { open, lane, stageName, card, onClose } = props;
  const firstField = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // preventScroll: the browser otherwise runs its focus-scroll into every
    // scrollable ancestor — at canvas zoom that pan-jumps the blueprint grid
    // (the "popping" world-slide). keyboard focus lands exactly as before.
    if (open) firstField.current?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <aside
      className={`tk-inspector ${open ? 'is-open' : ''}`}
      role="region"
      aria-label="Card inspector"
      aria-hidden={!open}
      {...(!open ? { inert: 'true' } : {})}
    >
      <div className="tk-inspector-head">
        <div className="flex-1 min-w-0">
          <h2 className="tk-inspector-heading">Card inspector</h2>
          <p className="tk-inspector-blurb">Edit this card — content blurb + the lane's interpretation.</p>
        </div>
        <button
          type="button"
          className="tk-close"
          aria-label="Close card inspector"
          onClick={onClose}
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
      {open && lane && card && (
        <div className="tk-inspector-body">
          <p className="tk-inspector-pill">
            {lane.name} · {stageName}
            {lane.kind ? ` · ${laneKindLabel(lane.kind)}` : ''}
          </p>
          <label className="tk-field">
            <span>Card title</span>
            <span className="tk-field-help">What this card is called.</span>
            <input
              ref={firstField}
              type="text"
              value={card.title}
              onChange={(e) => props.onCardChange('title', e.target.value)}
            />
          </label>
          <label className="tk-field">
            <span>Card blurb</span>
            <span className="tk-field-help">The supporting line under the title.</span>
            <textarea
              rows={3}
              value={card.blurb}
              aria-label="Card blurb"
              onChange={(e) => props.onCardChange('blurb', e.target.value)}
            />
          </label>
          <label className="tk-field">
            <span>Lane interpretation</span>
            <span className="tk-field-help">What a reader must understand about this lane (shows in the card drawer).</span>
            <textarea
              rows={5}
              value={lane.interpretation ?? ''}
              aria-label="Lane interpretation"
              onChange={(e) => props.onInterpretationChange(e.target.value)}
            />
          </label>
        </div>
      )}
    </aside>
  );
}