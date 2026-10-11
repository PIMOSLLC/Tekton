import type { BlueprintLane, BlueprintStage } from './types';
import { LANE_KINDS, laneKindLabel } from './types';

export interface VisualArchitectProps {
  eyebrow: string;
  title: string;
  intro: string;
  stages: BlueprintStage[];
  lanes: BlueprintLane[];
  onMetaChange(field: 'eyebrow' | 'title' | 'intro', value: string): void;
  onStageChange(index: number, field: 'name' | 'blurb', value: string): void;
  onStageAdd(): void;
  onStageRemove(index: number): void;
  onLaneChange(
    index: number,
    field: 'name' | 'blurb' | 'kind' | 'interpretation',
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
          <span>Eyebrow</span>
          <input
            type="text"
            value={props.eyebrow}
            onChange={(e) => props.onMetaChange('eyebrow', e.target.value)}
          />
        </label>
        <label className="tk-field">
          <span>Blueprint title</span>
          <input
            type="text"
            value={props.title}
            onChange={(e) => props.onMetaChange('title', e.target.value)}
          />
        </label>
        <label className="tk-field">
          <span>Introduction</span>
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
              <textarea
                rows={2}
                value={lane.interpretation ?? ''}
                aria-label={`Lane ${i + 1} interpretation`}
                placeholder="Service design interpretation (drawer text)…"
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