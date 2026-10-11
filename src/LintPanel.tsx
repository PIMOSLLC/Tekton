import type { EngineFinding, EngineIssue } from './engine/engineService';

/** AA/AAA verdict table — the editor's flagship panel. Named exports only (PIMOS). */
export interface LintPanelProps {
  findings: EngineFinding[];
}

export function lintSummary(findings: EngineFinding[]): string {
  const failures = findings.filter((f) => !f.aa).length;
  return failures === 0
    ? `${findings.length} pairs — theme passes WCAG AA`
    : `${failures} of ${findings.length} pairs FAIL WCAG AA`;
}

export function LintPanel({ findings }: LintPanelProps) {
  return (
    <section className="tk-panel" aria-label="WCAG contrast lint">
      <h3>Contrast lint</h3>
      <p className="tk-lint-summary" data-testid="lint-summary">
        {lintSummary(findings)}
      </p>
      <ul className="tk-lint-list">
        {findings.map((f) => (
          <LintRow key={`${f.element}-${f.bg}`} finding={f} />
        ))}
      </ul>
    </section>
  );
}

function LintRow({ finding: f }: { finding: EngineFinding }) {
  return (
    <li className={`tk-lint-row ${f.aa ? 'is-pass' : 'is-fail'}`}>
      <span className="tk-lint-badge">
        {f.aa ? 'AA ok' : 'AA FAIL'} · {f.aaa ? 'AAA ok' : 'AAA no'}
      </span>
      <span className="tk-lint-element">{f.element}</span>
      <span className="tk-lint-pair">
        {f.fg} on {f.bg} = {f.ratio.toFixed(2)}:1
      </span>
      {f.suggestion && <span className="tk-lint-suggestion">suggest fg: {f.suggestion}</span>}
    </li>
  );
}

export interface ValidationPanelProps {
  issues: EngineIssue[];
  /** Recovery affordance: card-located issues navigate the author to the
   * offending card (inspector opens, focused on the first field). */
  onFixIssue?(issue: EngineIssue): void;
}

export function ValidationPanel({ issues, onFixIssue }: ValidationPanelProps) {
  return (
    <section className="tk-panel" aria-label="Document validation">
      <h3>Validation</h3>
      {issues.length === 0 ? (
        <p className="tk-lint-summary" data-testid="validation-summary">
          Document structure is valid.
        </p>
      ) : (
        <ul className="tk-lint-list">
          {issues.map((i, idx) => {
            const navigable =
              i.lane !== undefined && i.stage !== undefined && onFixIssue !== undefined;
            const content = (
              <>
                <span className="tk-lint-badge">{i.severity}</span>
                <span className="tk-lint-element">{i.message}</span>
                {navigable && <span className="tk-lint-fix-hint">fix →</span>}
              </>
            );
            return (
              <li
                key={idx}
                className={`tk-lint-row ${i.severity === 'error' ? 'is-fail' : 'is-warn'}`}
              >
                {navigable ? (
                  <button
                    type="button"
                    className="tk-lint-fix"
                    data-testid="validation-fix"
                    onClick={() => i.lane !== undefined && i.stage !== undefined && onFixIssue?.(i)}
                    aria-label={`Fix: ${i.message}`}
                  >
                    {content}
                  </button>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}