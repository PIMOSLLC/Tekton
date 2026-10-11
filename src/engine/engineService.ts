/**
 * EngineService — the single seam between the editor and the blueprint engine.
 *
 * Two adapters share this interface (P2 plan):
 *  - WasmEngine: the browser mode (this file's default) — blueprint-core
 *    compiled to wasm32, same engine the future Phoenix Insight Nexus toolkit
 *    module will embed.
 *  - TauriEngine: the desktop shell — the same crate via Tauri `invoke`
 *    commands (src-tauri lands with the desktop pass; until then the adapter
 *    throws with a clear message rather than pretending).
 */

import type { BlueprintDocument } from '../types';
import type {
  EngineReport,
  EngineValidation,
  OutputFormat,
} from './engineServiceTypes';

export type { EngineFinding, EngineIssue, EngineValidation, EngineReport, OutputFormat } from './engineServiceTypes';

export interface EngineService {
  readonly backend: 'wasm' | 'tauri';
  render(yaml: string, format: OutputFormat): Promise<string>;
  lint(yaml: string): Promise<EngineReport>;
  validate(yaml: string): Promise<EngineValidation>;
  parse(yaml: string): Promise<BlueprintDocument>;
  serialize(doc: BlueprintDocument): Promise<string>;
  /** Parse YAML *or* JSON source (auto-detected) into the document model. */
  loadSource(text: string): Promise<BlueprintDocument>;
  /** Pretty JSON of the canonical model — the Save-as-JSON file format and
   * the JSONB payload shape for the future PIN `toolkit_instances` row. */
  toJson(doc: BlueprintDocument): Promise<string>;
}

/** True when running inside the Tauri desktop shell. */
export const isTauriHost: boolean =
  typeof globalThis !== 'undefined' && '__TAURI__' in globalThis;

class WasmEngine implements EngineService {
  readonly backend = 'wasm' as const;
  private init: Promise<unknown> | null = null;

  // Lazily imported so the wasm module (and its binary) loads once, on demand.
  private module: Promise<typeof import('./blueprint_wasm.js')> | null = null;

  private async load() {
    this.module ??= import('./blueprint_wasm.js');
    const m = await this.module;
    this.init ??= m.default();
    await this.init;
    return m;
  }

  async render(yaml: string, format: OutputFormat): Promise<string> {
    const m = await this.load();
    return m.render_blueprint(yaml, format);
  }

  async lint(yaml: string): Promise<EngineReport> {
    const m = await this.load();
    return JSON.parse(await m.lint_blueprint(yaml)) as EngineReport;
  }

  async validate(yaml: string): Promise<EngineValidation> {
    const m = await this.load();
    return JSON.parse(await m.validate_blueprint(yaml)) as EngineValidation;
  }

  async parse(yaml: string): Promise<BlueprintDocument> {
    const m = await this.load();
    return JSON.parse(await m.parse_blueprint(yaml)) as BlueprintDocument;
  }

  async serialize(doc: BlueprintDocument): Promise<string> {
    const m = await this.load();
    return m.serialize_blueprint(JSON.stringify(doc));
  }

  async loadSource(text: string): Promise<BlueprintDocument> {
    const m = await this.load();
    return JSON.parse(await m.load_source(text)) as BlueprintDocument;
  }

  async toJson(doc: BlueprintDocument): Promise<string> {
    const m = await this.load();
    return m.document_to_json(JSON.stringify(doc));
  }
}

class TauriEngine implements EngineService {
  readonly backend = 'tauri' as const;
  private unsupported(): Promise<never> {
    return Promise.reject(new Error('Tauri adapter lands with the desktop pass (src-tauri).'));
  }
  render(): Promise<string> { return this.unsupported(); }
  lint(): Promise<EngineReport> { return this.unsupported(); }
  validate(): Promise<EngineValidation> { return this.unsupported(); }
  parse(): Promise<BlueprintDocument> { return this.unsupported(); }
  serialize(): Promise<string> { return this.unsupported(); }
  loadSource(): Promise<BlueprintDocument> { return this.unsupported(); }
  toJson(): Promise<string> { return this.unsupported(); }
}

export const engine: EngineService = isTauriHost ? new TauriEngine() : new WasmEngine();