import type { EngineFinding, EngineIssue } from './engine/engineServiceTypes';
import { LintPanel, ValidationPanel, lintSummary } from './LintPanel';

export interface LintTerminalProps {
  findings: EngineFinding[];
  issues: EngineIssue[];
  open: boolean;
  onToggle(): void;
  /** Navigates a card-located validation issue to its card (fix flow). */
  onFixIssue?(issue: EngineIssue): void;
}

/**
 * LintTerminal — the lint restyled as a docked terminal (adopted from the Gemini
 * prototype), collapsible like an editor terminal. The target line reads
 * WCAG 2.2 (the prototype said 2.1 — rejected; 2.2 is the product standard).
 */
export function LintTerminal({ findings, issues, open, onToggle, onFixIssue }: LintTerminalProps) {
  const failures = findings.filter((f) => !f.aa).length;
  return (
    <section className="tk-terminal" aria-label="Contrast lint terminal">
      <div className="tk-terminal-head">
        <button
          type="button"
          className="tk-terminal-toggle"
          aria-expanded={open}
          aria-controls="tk-terminal-body"
          onClick={onToggle}
        >
          <span className="tk-terminal-chevron">{open ? '▾' : '▸'}</span>
          Aisthehkne Contrast Lint
        </button>
        <span
          className={`tk-terminal-badge ${failures === 0 ? 'is-pass' : 'is-fail'}`}
          data-testid="terminal-badge"
        >
          {failures === 0
            ? `${findings.length} pairs passed`
            : `${failures} of ${findings.length} FAIL`}
        </span>
        <span className="tk-terminal-target">Target: WCAG 2.2 AA</span>
      </div>
      {open && (
        <div id="tk-terminal-body" className="tk-terminal-body">
          <p className="tk-terminal-summary">{lintSummary(findings)}</p>
          <LintPanel findings={findings} />
          <ValidationPanel issues={issues} onFixIssue={onFixIssue} />
        </div>
      )}
    </section>
  );
}