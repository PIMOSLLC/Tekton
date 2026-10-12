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
    // The document FACE: band, stat, and note pairs — the regions above and
    // below the grid, all engine-linted pairs the canvas now paints too.
    '--tk-doc-band-bg': doc.theme?.['band_bg'] ?? '#060d2f',
    '--tk-doc-band-border': doc.theme?.['band_border'] ?? '#27539c',
    '--tk-doc-band-eyebrow': doc.theme?.['band_eyebrow'] ?? '#9fc4ff',
    '--tk-doc-band-text': doc.theme?.['band_text'] ?? '#cbd7f1',
    '--tk-doc-accent': doc.theme?.['accent'] ?? '#1d4ed8',
    '--tk-doc-stat-caption': doc.theme?.['stat_caption'] ?? '#53647c',
    '--tk-doc-note-ink': doc.theme?.['note_ink'] ?? '#59677d',
  } as CSSProperties;

  return (
    <div
      className="tk-canvas"
      data-phoenix-theme="tekton-light"
      style={docVars as CSSProperties}
    >
      {/* The document FACE, in the artifact's reading order: band → stats →
          grid → note. The canvas mirrors what the panel governs and what
          exports — a first-run reader sees every region form as they type
          (pure paint; the panel rows stay the edit entries). */}
      <header className="tk-canvas-band">
        <span className="tk-canvas-band-eyebrow">{doc.meta.eyebrow}</span>
        <h2>{doc.meta.title}</h2>
        {doc.meta.intro && <p>{doc.meta.intro}</p>}
      </header>
      {(doc.stats?.length ?? 0) > 0 && (
        <div className="tk-canvas-stats">
          {(doc.stats ?? []).map((stat, i) => (
            <div className="tk-canvas-stat" key={`stat-${i}`}>
              <strong>{stat.figure}</strong>
              <span>{stat.caption}</span>
            </div>
          ))}
        </div>
      )}
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
      {doc.note && (
        <p className="tk-canvas-note">
          <strong>{doc.note.label}</strong> {doc.note.body}
        </p>
      )}
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