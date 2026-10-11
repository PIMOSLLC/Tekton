import { useState } from 'react';
import type { BlueprintDocument } from './types';
import { effectiveTint } from './types';

export interface BuildCanvasProps {
  doc: BlueprintDocument;
  selectedCard: { lane: number; stage: number } | null;
  onSelectCard(position: { lane: number; stage: number }): void;
}

/**
 * Build-mode canvas (adopted from the Gemini prototype's central workspace):
 * the light-theme editable view of the document — the "Aetherehkne simulated
 * workspace." Every card is a real <button> (keyboard operable); clicking opens
 * the CardInspector drawer.
 *
 * Separation lines render as the shaded full-width bands the engine produces
 * (`divider-bg`); clicking a band shades the row it governs — the
 * association affordance from the original prototype, done as a real toggle
 * button (hover-only interaction is rejected). The shading is view state:
 * it reflects nothing in the document.
 */
export function BuildCanvas({ doc, selectedCard, onSelectCard }: BuildCanvasProps) {
  const [lineLane, setLineLane] = useState<number | null>(null);
  const stageCount = Math.max(doc.stages.length, 1);
  const gridStyle = {
    gridTemplateColumns: `200px repeat(${stageCount}, minmax(180px, 1fr))`,
  };
  const dividerBg = doc.theme?.['divider_bg'] ?? '#182150';

  return (
    <div className="tk-canvas" data-phoenix-theme="tekton-light">
      <div className="tk-canvas-grid" style={gridStyle}>
        <div className="tk-canvas-corner">Service layer ↓ <small>Stage →</small></div>
        {doc.stages.map((stage, i) => (
          <div className="tk-canvas-stage" key={`stage-head-${i}`}>
            <span className="tk-canvas-stage-index">Stage {i + 1}</span>
            <h3>{stage.name}</h3>
            {stage.blurb && <p>{stage.blurb}</p>}
          </div>
        ))}

        {doc.lanes.map((lane, li) => (
          <LaneRow
            key={`lane-row-${li}`}
            laneIndex={li}
            laneName={lane.name}
            laneBlurb={lane.blurb}
            divider={lane.divider}
            dividerBg={dividerBg}
            associated={lineLane === li}
            onToggleLine={() =>
              setLineLane((prev) => (prev === li ? null : li))
            }
            tint={effectiveTint(lane, doc.theme)}
            cards={lane.cards}
            selected={selectedCard}
            onSelectCard={onSelectCard}
          />
        ))}
      </div>
    </div>
  );
}

interface LaneRowProps {
  laneIndex: number;
  laneName: string;
  laneBlurb?: string;
  divider?: string;
  dividerBg: string;
  /** True when this row is the one the clicked line band governs. */
  associated: boolean;
  onToggleLine(): void;
  tint?: string;
  cards: { title: string; blurb: string }[];
  selected: { lane: number; stage: number } | null;
  onSelectCard(position: { lane: number; stage: number }): void;
}

function LaneRow({
  laneIndex,
  laneName,
  laneBlurb,
  divider,
  dividerBg,
  associated,
  onToggleLine,
  tint,
  cards,
  selected,
  onSelectCard,
}: LaneRowProps) {
  return (
    <>
      {divider && (
        <button
          type="button"
          className={`tk-canvas-divider ${associated ? 'is-active' : ''}`}
          style={{ background: dividerBg }}
          aria-pressed={associated}
          onClick={onToggleLine}
          title={`${divider} — shade the row this line governs`}
        >
          {divider}
        </button>
      )}
      <div className={`tk-canvas-lane-label ${associated ? 'is-associated' : ''}`}>
        <h4>{laneName}</h4>
        {laneBlurb && <p>{laneBlurb}</p>}
      </div>
      {cards.map((card, ci) => {
        const isSelected =
          selected?.lane === laneIndex && selected?.stage === ci;
        return (
          <button
            key={`card-${laneIndex}-${ci}`}
            type="button"
            className={`tk-canvas-card ${isSelected ? 'is-selected' : ''} ${
              associated ? 'is-associated' : ''
            } ${card.title ? '' : 'is-untitled'}`}
            style={tint ? { background: tint } : undefined}
            aria-pressed={isSelected}
            onClick={() => onSelectCard({ lane: laneIndex, stage: ci })}
          >
            <strong>{card.title || 'Untitled card'}</strong>
            <span>{card.blurb}</span>
          </button>
        );
      })}
    </>
  );
}