/**
 * Test-support engine — a pure-TS stand-in mirroring the wasm contract's
 * behavior (JSON detection by leading `{`, canonical YAML serializer, pretty
 * JSON serializer). The real engine is exercised end-to-end in the browser
 * and via the Rust test suite; these fakes make lifecycle/dirty-state tests
 * deterministic and fast.
 */
import type { BlueprintDocument } from '../types';
import type { EngineReport, EngineValidation, OutputFormat } from '../engine/engineServiceTypes';

export const SAMPLE_DOC: BlueprintDocument = {
  meta: { eyebrow: 'Test suite', title: 'Sample Blueprint', intro: 'For lifecycle tests.' },
  stats: [],
  stages: [{ id: 'signal', name: 'Signal' }],
  lanes: [
    { id: 'customer', name: 'Customer actions', cards: [{ title: 'Hello', blurb: 'World' }] },
  ],
};

export const SAMPLE_JSON = JSON.stringify(SAMPLE_DOC, null, 2);

/** Mutable gates a test file flips to exercise failure paths (reset in beforeEach). */
export const engineControls = {
  renderError: null as string | null,
  /** When set, lint reports exactly these findings (AA-failure scenarios). */
  failFindings: null as EngineReport | null,
  /** When set, validate reports exactly these issues (recovery scenarios). */
  failIssues: null as EngineValidation | null,
};

const SAMPLE_FINDING = {
  element: 'Band title',
  fg: '#141b3d',
  bg: '#f5f7fb',
  ratio: 12.2,
  large: false,
  aa: true,
  aaa: true,
};

export function makeFakeEngine() {
  return {
    backend: 'wasm' as const,
    render: async (_yaml: string, _format: OutputFormat) => {
      if (engineControls.renderError) throw new Error(engineControls.renderError);
      return '<!doctype html><title>fake</title>';
    },
    lint: async (_yaml: string) =>
      (engineControls.failFindings ?? {
        findings: [structuredClone(SAMPLE_FINDING)],
      }) as EngineReport,
    validate: async (_yaml: string) =>
      (engineControls.failIssues ?? { issues: [] }) as EngineValidation,
    parse: async (_yaml: string) => structuredClone(SAMPLE_DOC),
    serialize: async (_doc: BlueprintDocument) => 'canonical yaml',
    loadSource: async (text: string) => {
      if (text.trimStart().startsWith('{')) return JSON.parse(text) as BlueprintDocument;
      return structuredClone(SAMPLE_DOC);
    },
    toJson: async (doc: BlueprintDocument) => JSON.stringify(doc, null, 2),
  };
}

export type FakeEngine = ReturnType<typeof makeFakeEngine>;