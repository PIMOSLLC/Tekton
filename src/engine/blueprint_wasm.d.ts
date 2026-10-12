/* tslint:disable */
/* eslint-disable */

/**
 * Contrast ratio for one fg/bg pair — the editor's swatch validation runs
 * through the engine's own math (the WCAG 2.x relative-luminance ratio the
 * linter uses); nothing recomputes it client-side.
 */
export function contrast_ratio(fg: string, bg: string): number;

/**
 * Render the editor's canonical JSON state as pretty JSON — the structured
 * file format for Save-as-JSON, and the JSONB payload shape when the future
 * PIN integration stores the blueprint in `toolkit_instances` (`tool=blueprint`).
 */
export function document_to_json(json: string): string;

/**
 * Lint the document's theme. Returns the full report as a JSON string
 * (`{ findings: [...] }` — see `blueprint_core::lint::Report`).
 */
export function lint_blueprint(yaml: string): string;

/**
 * Load a document from YAML *or* JSON source (JSON detected by its leading
 * `{` — the editor's Open path accepts both file formats, and autosave recall
 * ships canonical YAML). Returns the canonical JSON form of `Document`.
 */
export function load_source(text: string): string;

/**
 * Parse a YAML document into the canonical JSON form of `Document` — the
 * editor's state model (single source of truth stays the Rust model; JS holds
 * the parsed shape for structured editing).
 */
export function parse_blueprint(yaml: string): string;

/**
 * Parse + validate + lint + render in one call (same contract as the CLI and
 * the future Tauri command): an invalid or AA-failing document refuses to render,
 * returning the actionable error text.
 *
 * `format`: "standalone" (full page). CMS fragment embedding was removed at
 * the public cut; the parameter is a positional API slot.
 */
export function render_blueprint(yaml: string, format: string): string;

/**
 * Serialize a JSON-form `Document` back to YAML (canonical formatting).
 */
export function serialize_blueprint(json: string): string;

/**
 * Validate document structure. Returns `{ issues: [...] }` as a JSON string
 * (errors block rendering; warnings do not).
 */
export function validate_blueprint(yaml: string): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly contrast_ratio: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly document_to_json: (a: number, b: number, c: number) => void;
    readonly lint_blueprint: (a: number, b: number, c: number) => void;
    readonly load_source: (a: number, b: number, c: number) => void;
    readonly parse_blueprint: (a: number, b: number, c: number) => void;
    readonly render_blueprint: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly serialize_blueprint: (a: number, b: number, c: number) => void;
    readonly validate_blueprint: (a: number, b: number, c: number) => void;
    readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
    readonly __wbindgen_export: (a: number, b: number) => number;
    readonly __wbindgen_export2: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_export3: (a: number, b: number, c: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
