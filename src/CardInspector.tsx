import { useEffect, useRef } from 'react';
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
    if (open) firstField.current?.focus();
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
      {...(!open ? { inert: true } : {})}
    >
      <div className="tk-inspector-head">
        <button
          type="button"
          className="tk-inspector-close"
          aria-label="Close card inspector"
          onClick={onClose}
        >
          ×
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
            <input
              ref={firstField}
              type="text"
              value={card.title}
              onChange={(e) => props.onCardChange('title', e.target.value)}
            />
          </label>
          <label className="tk-field">
            <span>Card blurb</span>
          </label>
          <textarea
            rows={3}
            value={card.blurb}
            aria-label="Card blurb"
            onChange={(e) => props.onCardChange('blurb', e.target.value)}
          />
          <label className="tk-field">
            <span>Lane interpretation (drawer text)</span>
          </label>
          <textarea
            rows={5}
            value={lane.interpretation ?? ''}
            aria-label="Lane interpretation"
            onChange={(e) => props.onInterpretationChange(e.target.value)}
          />
        </div>
      )}
    </aside>
  );
}