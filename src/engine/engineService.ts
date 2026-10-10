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

export interface EngineFinding {
  element: string;
  fg: string;
  bg: string;
  ratio: number;
  large: boolean;
  aa: boolean;
  aaa: boolean;
  suggestion?: string;
}

export interface EngineIssue {
  severity: 'error' | 'warning';
  message: string;
}

export interface EngineValidation {
  issues: EngineIssue[];
}

export interface EngineReport {
  findings: EngineFinding[];
}

export type OutputFormat = 'standalone' | 'wordpress';

export interface EngineService {
  readonly backend: 'wasm' | 'tauri';
  render(yaml: string, format: OutputFormat): Promise<string>;
  lint(yaml: string): Promise<EngineReport>;
  validate(yaml: string): Promise<EngineValidation>;
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
}

class TauriEngine implements EngineService {
  readonly backend = 'tauri' as const;
  render(): Promise<string> {
    return Promise.reject(
      new Error('Tauri adapter lands with the desktop pass (src-tauri).'),
    );
  }
  lint(): Promise<EngineReport> {
    return Promise.reject(new Error('Tauri adapter lands with the desktop pass.'));
  }
  validate(): Promise<EngineValidation> {
    return Promise.reject(new Error('Tauri adapter lands with the desktop pass.'));
  }
}

export const engine: EngineService = isTauriHost ? new TauriEngine() : new WasmEngine();