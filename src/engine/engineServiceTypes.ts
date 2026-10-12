/** Shared engine result types (kept separate so engineService can re-export). */

export interface EngineFinding {
  element: string;
  fg: string;
  bg: string;
  ratio: number;
  large: boolean;
  aa: boolean;
  aaa: boolean;
  suggestion?: string;
  /** Background fix for lane-tint pairs — the shared card text stays, the
   * tint moves (wire key mirrors the Rust `bg_suggestion`). */
  bg_suggestion?: string;
}

export interface EngineIssue {
  severity: 'error' | 'warning';
  /** Stable machine code (e.g. `card_title_required`) — editors branch on
   * this, never on parsing the prose message. */
  code?: string;
  message: string;
  /** Card location (lane/stage indexes) when the issue pinpoints a card —
   * the editor's recovery affordances navigate straight to it. */
  lane?: number;
  stage?: number;
}

export interface EngineValidation {
  issues: EngineIssue[];
}

export interface EngineReport {
  findings: EngineFinding[];
}

/** The export shape. CMS fragment embedding was removed at the public cut;
 * the lone variant keeps the axis open for future output shapes. */
export type OutputFormat = 'standalone';