import { useState, type CSSProperties } from 'react';
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
  // Canvas↔render parity: untinted cards paint the DOCUMENT's surface (the
  // engine's --bp-surface), never a chrome color — a dark document's
  // customer/frontstage/backstage rows must read as dark, exactly as the
  // exported artifact renders them.
  const surface = doc.theme?.['surface'] ?? '#ffffff';
  const inkStrong = doc.theme?.['ink_strong'] ?? '#131b45';
  // The whole grid scaffolding wears the document too: page, stage columns,
  // lane labels, grid corner, and the hairline borders — the same tokens the
  // engine paints the artifact with (each consumed with the chrome look as
  // fallback so a theme-less document keeps the studio's light view).
  const docVars = {
    '--tk-doc-canvas': doc.theme?.['canvas'] ?? '#f5f7fb',
    '--tk-doc-surface': surface,
    '--tk-doc-ink': doc.theme?.['ink'] ?? '#141b3d',
    '--tk-doc-grid-head': doc.theme?.['grid_head'] ?? '#161f4c',
    '--tk-doc-stage-bg': doc.theme?.['stage_bg'] ?? '#eaf1ff',
    '--tk-doc-stage-ink': doc.theme?.['stage_ink'] ?? '#17256d',
    '--tk-doc-stage-blurb': doc.theme?.['stage_blurb'] ?? '#566b8e',
    '--tk-doc-row-bg': doc.theme?.['row_head_bg'] ?? '#f0f4fa',
    '--tk-doc-row-ink': doc.theme?.['ink'] ?? '#141b3d',
    '--tk-doc-row-blurb': doc.theme?.['row_blurb'] ?? '#5e6d83',
    '--tk-doc-border': doc.theme?.['border_soft'] ?? '#e3e8f1',
  } as CSSProperties;

  return (
    <div
      className="tk-canvas"
      data-phoenix-theme="tekton-light"
      style={docVars as CSSProperties}
    >
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
            surface={surface}
            inkStrong={inkStrong}
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
  /** The lane's card background — explicit tint, else the kind default. */
  tint?: string;
  /** The document's card surface (engine: --bp-surface) — untinted fallback. */
  surface: string;
  /** The document's card ink (engine: --bp-ink-strong) — the linted pair. */
  inkStrong: string;
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
  surface,
  inkStrong,
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
            style={{
              // Document pairing: the cell background (tint else surface)
              // and the shared card ink — the same pair the engine lints.
              background: tint ?? surface,
              ['--tk-card-ink' as string]: inkStrong,
            } as CSSProperties}
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