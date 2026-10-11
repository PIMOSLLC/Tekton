/**
 * Blueprint template registry — every "New" journey starts from one of these
 * seed documents. Templates are raw YAML source strings (inlined at build
 * time via ?raw — no fetch, works in the wasm module and offline). They parse
 * through the same engine pipeline as Open, so a broken template is a broken
 * document: loud, not silent.
 *
 *  - `starter` — the commented teaching format (parity-locked YAML↔JSON with
 *    the structured seed by crates/blueprint-core/tests/templates.rs).
 *  - `agentic-ai-ecommerce` — the finished example: the deployed
 *    delminquoelcunningham.com case-study blueprint, a real artifact for new
 *    users to learn from. The fixture file stays the single source; it is also
 *    the engine's golden test document.
 */
import starterYaml from '../../templates/starter.yaml?raw';
import exampleYaml from '../../fixtures/agentic-ai-ecommerce.yaml?raw';

export interface BlueprintTemplate {
  id: string;
  name: string;
  hint: string;
  yaml: string;
}

export const TEMPLATES: BlueprintTemplate[] = [
  {
    id: 'starter',
    name: 'Starter blueprint',
    hint: 'A commented, minimal grid that teaches the format — titles and blurbs are placeholders to replace.',
    yaml: starterYaml,
  },
  {
    id: 'agentic-ai-ecommerce',
    name: 'Example · Agentic AI blueprint',
    hint: 'The full published agentic AI e-commerce blueprint: real lanes, separation lines, evidence note. Read it to see where authoring goes.',
    yaml: exampleYaml,
  },
];

export function findTemplate(id: string): BlueprintTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}