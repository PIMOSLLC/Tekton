import { useEffect, useState, type CSSProperties } from 'react';
import { ChevronDown } from 'lucide-react';
import type { BlueprintLane, BlueprintStage, BlueprintStat, BlueprintTheme } from './types';
import { LANE_TINT_SWATCHES, LANE_KINDS, laneKindLabel } from './types';
import { InfoHint } from './InfoHint';

/** The engine's lane-tint AA failure, keyed by lane id (ratio + the bg fix). */
export interface TintWarning {
  ratio: number;
  suggestionBg?: string;
}

/** Swatch verdicts keyed by hex (pass + ratio), computed via the engine. */
export type SwatchVerdicts = Record<string, { pass: boolean; ratio: number }>;

export interface VisualArchitectProps {
  eyebrow: string;
  title: string;
  intro: string;
  stages: BlueprintStage[];
  lanes: BlueprintLane[];
  /** The under-title quick figures — edited like stages, rendered below the band. */
  stats: BlueprintStat[];
  /** The document's theme record — the stat preview mirrors the artifact's
   * painted pair (bold accent figure + muted caption on the doc surface). */
  theme?: BlueprintTheme;
  /** AA verdicts for lane tints (live from the engine lint). */
  tintWarnings: Record<string, TintWarning>;
  /** Engine-computed swatch verdicts — only passing swatches are pickable. */
  swatchVerdicts: SwatchVerdicts;
  onMetaChange(field: 'eyebrow' | 'title' | 'intro', value: string): void;
  onStageChange(index: number, field: 'name' | 'blurb', value: string): void;
  onStageAdd(): void;
  onStageRemove(index: number): void;
  onStatChange(index: number, field: 'figure' | 'caption', value: string): void;
  onStatAdd(): void;
  onStatRemove(index: number): void;
  onLaneChange(
    index: number,
    field: 'name' | 'blurb' | 'kind' | 'tint' | 'divider' | 'interpretation',
    value: string,
  ): void;
  onLaneAdd(): void;
  onLaneRemove(index: number): void;
}

/**
 * Visual Architect — the structured editor (adopted from the Gemini prototype's
 * left pane). Editing happens on the parsed document; YAML stays a serialization
 * view. Delete controls reveal on hover AND focus-within (keyboard-visible —
 * the prototype's hover-only pattern fails WCAG 2.2 and stays rejected).
 */
export function VisualArchitect(props: VisualArchitectProps) {
  // The accordion: ONE lane open at a time (the app's one-layer doctrine).
  // Lane 0 starts open so the full editing pattern is visible on boot; a
  // freshly added lane opens itself, ready for typing.
  const [openLane, setOpenLane] = useState<number | null>(0);
  const [laneCount, setLaneCount] = useState(props.lanes.length);
  useEffect(() => {
    if (props.lanes.length > laneCount) setOpenLane(props.lanes.length - 1);
    setLaneCount(props.lanes.length);
  }, [props.lanes.length, laneCount]);

  return (
    <div className="tk-architect">
      <section className="tk-arch-section">
        <div className="tk-arch-group-label" role="group" aria-label="Document">
          DOCUMENT
        </div>
        <label className="tk-field">
          <span>Tagline</span>
          <span className="tk-field-help">
            The short label above the title — designers call this the &ldquo;eyebrow&rdquo;.
          </span>
          <input
            type="text"
            value={props.eyebrow}
            onChange={(e) => props.onMetaChange('eyebrow', e.target.value)}
          />
        </label>
        <label className="tk-field">
          <span>Title</span>
          <span className="tk-field-help">
            What this blueprint is called — it also becomes the saved file&apos;s name.
          </span>
          <input
            type="text"
            value={props.title}
            onChange={(e) => props.onMetaChange('title', e.target.value)}
          />
        </label>
        <label className="tk-field">
          <span>Opening sentence</span>
          <span className="tk-field-help">
            Frames the service and the moment being designed for.
          </span>
          <textarea
            rows={3}
            value={props.intro}
            onChange={(e) => props.onMetaChange('intro', e.target.value)}
          />
        </label>
      </section>

      <section className="tk-arch-section">
        <div className="tk-arch-group-label" role="group" aria-label="Stats">
          <span>Stats</span>
          <InfoHint
            label="About stats"
            tip="Stat cards are the quick figures under the title — the numbers and guarantees a reader scans first. Figure = the bold value; caption = the one line beneath it."
          />
          <span className="tk-count-pill">{props.stats.length} stats</span>
        </div>
        {props.stats.map((stat, i) => (
          <div className="tk-row-card" key={`stat-${i}`}>
            <span className="tk-grab" aria-hidden="true">⋮⋮</span>
            <div className="tk-row-card-main">
              <label className="tk-row-field">
                <span className="tk-row-label">Figure — the bold stat</span>
                <input
                  type="text"
                  value={stat.figure}
                  aria-label={`Stat ${i + 1} figure`}
                  placeholder="The bold stat, e.g. 1 week · 5 stages…"
                  onChange={(e) => props.onStatChange(i, 'figure', e.target.value)}
                />
              </label>
              <label className="tk-row-field">
                <span className="tk-row-label">Caption — one line beneath it</span>
                <input
                  type="text"
                  value={stat.caption}
                  aria-label={`Stat ${i + 1} caption`}
                  placeholder="Its one-line explanation, e.g. From customer signal to monitored release…"
                  onChange={(e) => props.onStatChange(i, 'caption', e.target.value)}
                />
              </label>
              {/* The artifact's stat card, LIVE — the pair paints as it exports
                  (bold accent figure + muted caption on the doc surface), so
                  the field names teach by showing instead of telling. */}
              {(stat.figure || stat.caption) && (
                <div
                  className="tk-stat-preview"
                  aria-hidden="true"
                  style={{
                    background: props.theme?.['surface'] ?? '#ffffff',
                    ['--tk-stat-accent' as string]: props.theme?.['accent'] ?? '#1d4ed8',
                    ['--tk-stat-cap' as string]: props.theme?.['stat_caption'] ?? '#53647c',
                  } as CSSProperties}
                >
                  <strong>{stat.figure || 'Figure'}</strong>
                  <span>{stat.caption || 'Caption'}</span>
                </div>
              )}
            </div>
            <button
              type="button"
              className="tk-remove"
              aria-label={`Remove stat ${stat.figure || i + 1}`}
              onClick={() => props.onStatRemove(i)}
            >
              ×
            </button>
          </div>
        ))}
        <button type="button" className="tk-add" onClick={props.onStatAdd}>
          + Add stat
        </button>
      </section>

      <section className="tk-arch-section">
        <div className="tk-arch-group-label" role="group" aria-label="Stages">
          <span>Stages</span>
          <InfoHint
            label="About stages"
            tip="Stages are the journey's steps — each becomes a canvas column, laid left → right in this order."
          />
          <span className="tk-count-pill">{props.stages.length} stages</span>
        </div>
        {props.stages.map((stage, i) => (
          <div className="tk-row-card" key={`stage-${i}`}>
            <span className="tk-grab" aria-hidden="true">⋮⋮</span>
            <div className="tk-row-card-main">
              <label className="tk-row-field">
                <span className="tk-row-label">Stage name</span>
                <input
                  type="text"
                  value={stage.name}
                  aria-label={`Stage ${i + 1} name`}
                  onChange={(e) => props.onStageChange(i, 'name', e.target.value)}
                />
              </label>
              <label className="tk-row-field">
                <span className="tk-row-label">Stage description</span>
                <input
                  type="text"
                  value={stage.blurb ?? ''}
                  aria-label={`Stage ${i + 1} description`}
                  placeholder="Stage description…"
                  onChange={(e) => props.onStageChange(i, 'blurb', e.target.value)}
                />
              </label>
            </div>
            <button
              type="button"
              className="tk-remove"
              aria-label={`Remove stage ${stage.name}`}
              disabled={props.stages.length <= 1}
              onClick={() => props.onStageRemove(i)}
            >
              ×
            </button>
          </div>
        ))}
        <button type="button" className="tk-add" onClick={props.onStageAdd}>
          + Add stage
        </button>
      </section>

      <section className="tk-arch-section">
        <div className="tk-arch-group-label" role="group" aria-label="Lanes">
          <span>Lanes</span>
          <InfoHint
            label="About lanes"
            tip="Lanes are the bands of who or what does the work — people, backstage processes, systems. Each canvas card lives in one lane."
          />
          <span className="tk-count-pill">{props.lanes.length} lanes</span>
        </div>
        {props.lanes.map((lane, i) =>
          openLane === i ? (
            /* THE OPEN LANE — the full editing card: shared compact head +
               all controls; the fold button collapses it */
            <div className="tk-row-card tk-lane-open" key={`lane-${i}`}>
              <span className="tk-grab" aria-hidden="true">⋮⋮</span>
              <div className="tk-row-card-main">
                <div className="tk-lane-head">
                  {/* The disclosure caret LEADS, like the Contrast terminal's
                      toggle — the lane panel's caret is where the eye starts. */}
                  <button
                    type="button"
                    className="tk-lane-fold"
                    aria-expanded="true"
                    aria-label={`Collapse lane ${i + 1}`}
                    title="Collapse this lane"
                    onClick={() => setOpenLane(null)}
                  >
                    <ChevronDown className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <label className="tk-row-field">
                    <span className="tk-row-label">Lane name</span>
                    <input
                      type="text"
                      value={lane.name}
                      aria-label={`Lane ${i + 1} name`}
                      onChange={(e) => props.onLaneChange(i, 'name', e.target.value)}
                    />
                  </label>
                </div>
                <label className="tk-row-field">
                  <span className="tk-row-label">Lane description</span>
                  <input
                    type="text"
                    value={lane.blurb ?? ''}
                    aria-label={`Lane ${i + 1} description`}
                    placeholder="Lane description…"
                    onChange={(e) => props.onLaneChange(i, 'blurb', e.target.value)}
                  />
                </label>
                <label className="tk-row-field">
                  <span className="tk-row-label">Lane kind</span>
                  <select
                    value={lane.kind ?? ''}
                    aria-label={`Lane ${i + 1} kind`}
                    onChange={(e) => props.onLaneChange(i, 'kind', e.target.value)}
                  >
                    <option value="">— no kind —</option>
                    {LANE_KINDS.map((k) => (
                      <option key={k} value={k}>{laneKindLabel(k)}</option>
                    ))}
                  </select>
                </label>
                <label className="tk-row-field">
                  <span className="tk-row-label">Separation line</span>
                  <input
                    type="text"
                    value={lane.divider ?? ''}
                    aria-label={`Lane ${i + 1} separation line`}
                    placeholder="Separation line label (e.g. — Line of visibility —)…"
                    onChange={(e) => props.onLaneChange(i, 'divider', e.target.value)}
                  />
                </label>
                {/* Row color — a curated, engine-validated swatch palette instead
                    of a free color picker: only tints that pass AA with the
                    card text are offered, so a failing pair cannot be picked. */}
                <div
                  className="tk-tint-field"
                  role="group"
                  aria-label={`Lane ${i + 1}: card colors that pass AA`}
                >
                  <span className="tk-row-label">Card colors</span>
                  <div className="tk-tint-row">
                  {LANE_TINT_SWATCHES.map((s) => {
                    const verdict = props.swatchVerdicts[s.hex];
                    const pass = verdict?.pass ?? false;
                    const selected = (lane.tint ?? '').toUpperCase() === s.hex.toUpperCase();
                    if (!pass && !selected) return null;
                    return (
                      <button
                        key={s.hex}
                        type="button"
                        className={`tk-swatch ${selected ? 'is-selected' : ''}`}
                        style={{ background: s.hex }}
                        aria-pressed={selected}
                        aria-label={`Card color: ${s.name}${selected ? ' (current)' : ''}`}
                        title={selected ? `${s.name} — current color` : `${s.name} — ${verdict?.ratio.toFixed(2)}:1, passes AA`}
                        onClick={() => props.onLaneChange(i, 'tint', selected ? '' : s.hex)}
                      />
                    );
                  })}
                  <button
                    type="button"
                    className="tk-remove"
                    aria-label={`Clear lane ${i + 1} card color`}
                    disabled={!lane.tint}
                    onClick={() => props.onLaneChange(i, 'tint', '')}
                  >
                    ×
                  </button>
                  </div>
                </div>
                {/* Live AA verdict for this row's color — a warn + fix path, never
                    a dead end: apply the engine's suggested background, or reset
                    to the kind's audited default. The canvas stays live either way. */}
                {props.tintWarnings[lane.id] && (
                  <div className="tk-tint-warning" role="status" data-testid="tint-warning">
                    <span className="tk-tint-warning-text">
                      Card text on this row = {props.tintWarnings[lane.id].ratio.toFixed(2)}:1 —
                      fails WCAG AA (needs 4.5:1)
                    </span>
                    {props.tintWarnings[lane.id].suggestionBg && (
                      <button
                        type="button"
                        className="tk-fix"
                        onClick={() =>
                          props.onLaneChange(
                            i,
                            'tint',
                            props.tintWarnings[lane.id].suggestionBg ?? '',
                          )
                        }
                      >
                        Apply suggested color
                      </button>
                    )}
                    {lane.tint && (
                      <button
                        type="button"
                        className="tk-fix"
                        onClick={() => props.onLaneChange(i, 'tint', '')}
                      >
                        Reset to kind default
                      </button>
                    )}
                  </div>
                )}
                <label className="tk-row-field">
                  <span className="tk-row-label">Lane interpretation</span>
                  <textarea
                    rows={2}
                    value={lane.interpretation ?? ''}
                    aria-label={`Lane ${i + 1} interpretation`}
                    placeholder="What a reader must understand about this lane (shows in the card drawer)…"
                    onChange={(e) => props.onLaneChange(i, 'interpretation', e.target.value)}
                  />
                </label>
              </div>
              <button
                type="button"
                className="tk-remove"
                aria-label={`Remove lane ${lane.name}`}
                disabled={props.lanes.length <= 1}
                onClick={() => props.onLaneRemove(i)}
              >
                ×
              </button>
            </div>
          ) : (
            /* THE COLLAPSED LANE — a one-line summary; the click expands it
               (exactly one open at a time) */
            <div className="tk-row-card tk-lane-collapsed" key={`lane-${i}`}>
              <span className="tk-grab" aria-hidden="true">⋮⋮</span>
              <button
                type="button"
                className="tk-lane-summary"
                aria-expanded="false"
                aria-label={`Expand lane ${i + 1}: ${lane.name}`}
                onClick={() => setOpenLane(i)}
              >
                {/* The caret leads the label, rotated to the closed state —
                    the same one-chevron accordion the contrast terminal uses. */}
                <ChevronDown className="tk-lane-chevron w-3.5 h-3.5" aria-hidden="true" />
                <span className="tk-lane-name">{lane.name || 'Untitled lane'}</span>
                {lane.kind && (
                  <span className="tk-lane-chip">{laneKindLabel(lane.kind)}</span>
                )}
                {lane.tint && (
                  <span className="tk-lane-tint-dot" style={{ background: lane.tint }} aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                className="tk-remove"
                aria-label={`Remove lane ${lane.name}`}
                disabled={props.lanes.length <= 1}
                onClick={() => props.onLaneRemove(i)}
              >
                ×
              </button>
            </div>
          ),
        )}
        <button type="button" className="tk-add" onClick={props.onLaneAdd}>
          + Add swimlane
        </button>
      </section>
    </div>
  );
}