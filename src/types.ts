/**
 * Editor-side mirror of the Rust document model (blueprint-core). The Rust
 * model is the single source of truth — these interfaces describe what
 * `parse_blueprint` returns and what `serialize_blueprint` accepts. Logic
 * (validation, lint, rendering) never duplicates here.
 */

export type LaneKind =
  | 'customer'
  | 'frontstage'
  | 'agents'
  | 'backstage'
  | 'systems'
  | 'data'
  | 'governance'
  | 'outcome';

export const LANE_KINDS: LaneKind[] = [
  'customer',
  'frontstage',
  'agents',
  'backstage',
  'systems',
  'data',
  'governance',
  'outcome',
];

/** Mirrors `LaneKind::default_tint()` — the kind-derived card background. */
export function kindDefaultTint(kind?: LaneKind): string | undefined {
  switch (kind) {
    case 'agents': return '#f3f0ff';
    case 'systems': return '#eff9f8';
    case 'data': return '#f3f8ff';
    case 'governance': return '#fff3e9';
    case 'outcome': return '#f0fbf4';
    default: return undefined;
  }
}

export interface BlueprintMeta {
  eyebrow: string;
  title: string;
  intro: string;
}

export interface BlueprintStat {
  figure: string;
  caption: string;
}

export interface BlueprintStage {
  id: string;
  name: string;
  blurb?: string;
}

export interface BlueprintCard {
  title: string;
  blurb: string;
}

export interface BlueprintLane {
  id: string;
  name: string;
  blurb?: string;
  divider?: string;
  tint?: string;
  kind?: LaneKind;
  interpretation?: string;
  cards: BlueprintCard[];
}

export interface BlueprintNote {
  label: string;
  body: string;
}

/**
 * The theme serializes from Rust with snake_case field names (`band_bg`,
 * `stage_ink`, …) — it is a plain string map on the wire. Theme EDITING ships in
 * a later pass; until then the editor treats it opaquely.
 */
export type BlueprintTheme = Record<string, string>;

/**
 * Note on theme casing: the Rust model serializes snake_case field names
 * (serde has no rename on theme), so the JSON form uses e.g. `band_bg`. The
 * interface below intentionally uses the wire keys so no mapping layer lies.
 */
export interface BlueprintDocument {
  meta: BlueprintMeta;
  stats?: BlueprintStat[];
  stages: BlueprintStage[];
  lanes: BlueprintLane[];
  note?: BlueprintNote;
  theme?: BlueprintTheme;
}

/** Effective card background: explicit tint, else kind default (mirrors Rust). */
export function effectiveTint(lane: BlueprintLane): string | undefined {
  return lane.tint ?? kindDefaultTint(lane.kind);
}

export function laneKindLabel(kind: LaneKind): string {
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}