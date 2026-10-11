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

/** Editor-facing description of one theme token (wire key = Rust field name). */
export interface ThemeTokenDef {
  key: string;
  label: string;
  group: string;
  about: string;
}

/**
 * The full theme inventory, mirroring `blueprint-core`'s `Theme` struct
 * (mirrors, not lies: these ARE the wire keys — a new Rust token must be
 * registered here to become editable).
 */
export const THEME_TOKENS: ThemeTokenDef[] = [
  { key: 'band_bg', label: 'Band background', group: 'Band', about: 'The title band behind eyebrow + title' },
  { key: 'band_border', label: 'Band border', group: 'Band', about: 'Bottom edge of the band' },
  { key: 'band_eyebrow', label: 'Band eyebrow', group: 'Band', about: 'Small-caps line above the title' },
  { key: 'band_text', label: 'Band intro text', group: 'Band', about: 'Framing sentence inside the band' },
  { key: 'canvas', label: 'Page canvas', group: 'Grid & lanes', about: 'Page behind the grid' },
  { key: 'grid_head', label: 'Grid corner', group: 'Grid & lanes', about: 'Top-left corner cell' },
  { key: 'divider_bg', label: 'Separation line', group: 'Grid & lanes', about: 'Shaded full-width line band' },
  { key: 'row_head_bg', label: 'Lane label background', group: 'Grid & lanes', about: 'Lane header cell' },
  { key: 'row_blurb', label: 'Lane label blurb', group: 'Grid & lanes', about: 'Description under lane names' },
  { key: 'stage_bg', label: 'Stage header text panel', group: 'Stage headers', about: 'Stage columns' },
  { key: 'stage_ink', label: 'Stage header ink', group: 'Stage headers', about: 'Stage titles' },
  { key: 'stage_blurb', label: 'Stage blurb ink', group: 'Stage headers', about: 'Stage descriptions' },
  { key: 'surface', label: 'Card surface', group: 'Cards & interaction', about: 'Card and panel fill' },
  { key: 'ink', label: 'Primary text', group: 'Cards & interaction', about: 'Main reading text' },
  { key: 'ink_strong', label: 'Strong text', group: 'Cards & interaction', about: 'Cell and control text' },
  { key: 'item_border', label: 'Card border', group: 'Cards & interaction', about: 'Card outline' },
  { key: 'item_type', label: 'Card stage tag', group: 'Cards & interaction', about: 'Small stage tag on cards' },
  { key: 'hover_soft', label: 'Hover wash', group: 'Cards & interaction', about: 'Control hover background' },
  { key: 'focus_outline', label: 'Focus outline', group: 'Cards & interaction', about: 'Keyboard focus ring' },
  { key: 'selected_outline', label: 'Selected outline', group: 'Cards & interaction', about: 'Selected card ring' },
  { key: 'accent', label: 'Accent', group: 'Accent', about: 'Buttons, stats, selection' },
  { key: 'accent_ink', label: 'Accent ink', group: 'Accent', about: 'Text on accent surfaces (the active button)' },
  { key: 'accent_soft_bg', label: 'Pill background', group: 'Accent', about: 'Soft pill fill' },
  { key: 'accent_soft_ink', label: 'Pill text', group: 'Accent', about: 'Pill + drawer sub-head text' },
  { key: 'tint_agents', label: 'Tint · AI agents', group: 'Lane tints', about: 'Kind default card color for agent lanes' },
  { key: 'tint_systems', label: 'Tint · Systems', group: 'Lane tints', about: 'Kind default card color for system lanes' },
  { key: 'tint_data', label: 'Tint · Data', group: 'Lane tints', about: 'Kind default card color for data lanes' },
  { key: 'tint_governance', label: 'Tint · Governance', group: 'Lane tints', about: 'Kind default card color for governance lanes' },
  { key: 'tint_outcome', label: 'Tint · Outcome', group: 'Lane tints', about: 'Kind default card color for outcome lanes' },
  { key: 'border_soft', label: 'Panel borders', group: 'Secondary text', about: 'Grid and panel borders' },
  { key: 'legend', label: 'Legend', group: 'Secondary text', about: 'Toolbar hint text' },
  { key: 'stat_caption', label: 'Stat captions', group: 'Secondary text', about: 'At-a-glance figure captions' },
  { key: 'note_ink', label: 'Evidence note text', group: 'Secondary text', about: 'Scope & evidence note' },
  { key: 'drawer_ink', label: 'Drawer body text', group: 'Secondary text', about: 'Card detail drawer' },
];

export const THEME_GROUPS = [
  'Band',
  'Grid & lanes',
  'Stage headers',
  'Cards & interaction',
  'Accent',
  'Lane tints',
  'Secondary text',
];

/**
 * THEME PRESETS — full-map themes the Theme panel offers as one-click sets.
 *
 * `DARK_STUDIO_PRESET` — the PIN-family palette matched to the editor chrome,
 * AA-audited by `crates/blueprint-core/tests/dark_preset.rs` (a deliberate
 * parity copy: the wasm engine runs in the browser where Rust tests can't
 * reach — keep the two maps in sync).
 * `LIGHT_DEFAULT_PRESET` — the published artifact's defaults (Theme::default
 * in blueprint-core), for returning a doc to its shipped look.
 */
export const DARK_STUDIO_PRESET: Record<string, string> = {
  band_bg: '#0B0F1A',
  band_border: '#1E40AF',
  band_eyebrow: '#93C5FD',
  band_text: '#CBD5E1',
  canvas: '#0B121B',
  surface: '#1F2937',
  ink: '#E2E8F0',
  ink_strong: '#F1F5F9',
  grid_head: '#111827',
  divider_bg: '#182150',
  row_head_bg: '#111827',
  row_blurb: '#94A3B8',
  stage_bg: '#0F172A',
  stage_ink: '#E2E8F0',
  stage_blurb: '#94A3B8',
  accent: '#60A5FA',
  accent_ink: '#0B0F1A',
  accent_soft_bg: '#172554',
  accent_soft_ink: '#93C5FD',
  item_border: '#374151',
  item_type: '#94A3B8',
  border_soft: '#374151',
  legend: '#94A3B8',
  stat_caption: '#94A3B8',
  note_ink: '#94A3B8',
  drawer_ink: '#CBD5E1',
  focus_outline: '#60A5FA',
  selected_outline: '#60A5FA',
  hover_soft: '#1F2937',
  tint_agents: '#2A2140',
  tint_systems: '#0E3034',
  tint_data: '#0F2740',
  tint_governance: '#33261A',
  tint_outcome: '#10352A',
};

export const LIGHT_DEFAULT_PRESET: Record<string, string> = {
  band_bg: '#060d2f',
  band_border: '#27539c',
  band_eyebrow: '#9fc4ff',
  band_text: '#cbd7f1',
  canvas: '#f5f7fb',
  surface: '#ffffff',
  ink: '#141b3d',
  ink_strong: '#131b45',
  grid_head: '#161f4c',
  divider_bg: '#182150',
  row_head_bg: '#f0f4fa',
  row_blurb: '#5e6d83',
  stage_bg: '#eaf1ff',
  stage_ink: '#17256d',
  stage_blurb: '#566b8e',
  accent: '#1d4ed8',
  accent_ink: '#ffffff',
  accent_soft_bg: '#e9efff',
  accent_soft_ink: '#2147a5',
  item_border: '#d8e1ef',
  item_type: '#64748b',
  border_soft: '#e3e8f1',
  legend: '#566783',
  stat_caption: '#53647c',
  note_ink: '#59677d',
  drawer_ink: '#455670',
  focus_outline: '#3169e8',
  selected_outline: '#2563eb',
  hover_soft: '#e9f0ff',
  tint_agents: '#f3f0ff',
  tint_systems: '#eff9f8',
  tint_data: '#f3f8ff',
  tint_governance: '#fff3e9',
  tint_outcome: '#f0fbf4',
};

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

/** Effective card background: explicit tint, then the THEME's kind tints (the
 * Rust model's chain: `lane.tint ?? theme.kind_tint(kind)`), then the legacy
 * static pastel map as the last resort. Mirrors `Lane::effective_tint`. */
export function effectiveTint(lane: BlueprintLane, theme?: BlueprintTheme): string | undefined {
  return (
    lane.tint ??
    (lane.kind && theme?.[`tint_${lane.kind}`]) ??
    kindDefaultTint(lane.kind)
  );
}

export function laneKindLabel(kind: LaneKind): string {
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}