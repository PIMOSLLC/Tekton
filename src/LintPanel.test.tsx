import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LintPanel, lintSummary } from './LintPanel';
import type { EngineFinding } from './engine/engineService';

function finding(over: Partial<EngineFinding> = {}): EngineFinding {
  return {
    element: 'Band eyebrow',
    fg: '#9fc4ff',
    bg: '#060d2f',
    ratio: 10.68,
    large: false,
    aa: true,
    aaa: true,
    ...over,
  };
}

describe('lintSummary', () => {
  it('reports a clean theme when every pair passes AA', () => {
    expect(lintSummary([finding(), finding({ element: 'Pill text' })])).toBe(
      '2 pairs — theme passes WCAG AA',
    );
  });

  it('calls out AA failures with counts', () => {
    expect(lintSummary([finding(), finding({ element: 'Active button text', aa: false })])).toBe(
      '1 of 2 pairs FAIL WCAG AA',
    );
  });
});

describe('LintPanel', () => {
  it('renders findings with AA/AAA verdicts and suggestions', () => {
    render(
      <LintPanel
        findings={[
          finding(),
          finding({
            element: 'Active button text',
            fg: '#ffffff',
            bg: '#03a9f4',
            ratio: 2.63,
            aa: false,
            aaa: false,
            suggestion: '#333333',
          }),
        ]}
      />,
    );
    expect(screen.getByTestId('lint-summary').textContent).toContain('1 of 2 pairs FAIL');
    expect(screen.getByText(/Active button text/)).toBeDefined();
    expect(screen.getByText(/suggest fg: #333333/)).toBeDefined();
  });
});