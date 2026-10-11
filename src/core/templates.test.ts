import { describe, expect, it } from 'vitest';
import { TEMPLATES, findTemplate } from './templates';

describe('template registry', () => {
  it('registers unique ids, and every seed is a document (has meta:)', () => {
    const ids = TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const template of TEMPLATES) {
      expect(template.yaml).toContain('meta:');
      expect(template.hint.length).toBeGreaterThan(0);
    }
  });

  it('the starter teaches — its seed carries explanatory comments', () => {
    expect(findTemplate('starter')?.yaml).toContain('#');
  });

  it('the example ships the published agentic AI blueprint, not placeholders', () => {
    const example = findTemplate('agentic-ai-ecommerce');
    expect(example?.yaml).toContain('AI Agentic Workflows in E-Commerce');
    expect(example?.yaml).toContain('Mandatory approval gate');
  });

  it('unknown ids resolve to nothing', () => {
    expect(findTemplate('nope')).toBeUndefined();
  });
});