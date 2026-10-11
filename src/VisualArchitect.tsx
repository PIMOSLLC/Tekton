import type { BlueprintLane, BlueprintStage } from './types';
import { LANE_TINT_SWATCHES, LANE_KINDS, laneKindLabel } from './types';

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
  /** AA verdicts for lane tints (live from the engine lint). */
  tintWarnings: Record<string, TintWarning>;
  /** Engine-computed swatch verdicts — only passing swatches are pickable. */
  swatchVerdicts: SwatchVerdicts;
  onMetaChange(field: 'eyebrow' | 'title' | 'intro', value: string): void;
  onStageChange(index: number, field: 'name' | 'blurb', value: string): void;
  onStageAdd(): void;
  onStageRemove(index: number): void;
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
  return (
    <div className="tk-architect">
      <section className="tk-arch-section">
        <h3>Document metadata</h3>
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
        <h3>
          Chronological stages
          <span className="tk-count-pill">{props.stages.length} stages</span>
        </h3>
        {props.stages.map((stage, i) => (
          <div className="tk-row-card" key={`stage-${i}`}>
            <span className="tk-grab" aria-hidden="true">⋮⋮</span>
            <div className="tk-row-card-main">
              <input
                type="text"
                value={stage.name}
                aria-label={`Stage ${i + 1} name`}
                onChange={(e) => props.onStageChange(i, 'name', e.target.value)}
              />
              <input
                type="text"
                value={stage.blurb ?? ''}
                aria-label={`Stage ${i + 1} description`}
                placeholder="Stage description…"
                onChange={(e) => props.onStageChange(i, 'blurb', e.target.value)}
              />
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
        <h3>
          Operational lanes
          <span className="tk-count-pill">{props.lanes.length} lanes</span>
        </h3>
        {props.lanes.map((lane, i) => (
          <div className="tk-row-card" key={`lane-${i}`}>
            <span className="tk-grab" aria-hidden="true">⋮⋮</span>
            <div className="tk-row-card-main">
              <input
                type="text"
                value={lane.name}
                aria-label={`Lane ${i + 1} name`}
                onChange={(e) => props.onLaneChange(i, 'name', e.target.value)}
              />
              <input
                type="text"
                value={lane.blurb ?? ''}
                aria-label={`Lane ${i + 1} description`}
                placeholder="Lane description…"
                onChange={(e) => props.onLaneChange(i, 'blurb', e.target.value)}
              />
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
              <input
                type="text"
                value={lane.divider ?? ''}
                aria-label={`Lane ${i + 1} separation line`}
                placeholder="Separation line label (e.g. — Line of visibility —)…"
                onChange={(e) => props.onLaneChange(i, 'divider', e.target.value)}
              />
              {/* Row color — a curated, engine-validated swatch palette instead
                  of a free color picker: only tints that pass AA with the
                  card text are offered, so a failing pair cannot be picked. */}
              <div
                className="tk-tint-field"
                role="group"
                aria-label={`Lane ${i + 1}: card colors that pass AA`}
              >
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
              <textarea
                rows={2}
                value={lane.interpretation ?? ''}
                aria-label={`Lane ${i + 1} interpretation`}
                placeholder="What a reader must understand about this lane (shows in the card drawer)…"
                onChange={(e) => props.onLaneChange(i, 'interpretation', e.target.value)}
              />
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
        ))}
        <button type="button" className="tk-add" onClick={props.onLaneAdd}>
          + Add swimlane
        </button>
      </section>
    </div>
  );
}