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
}

export function ValidationPanel({ issues }: ValidationPanelProps) {
  return (
    <section className="tk-panel" aria-label="Document validation">
      <h3>Validation</h3>
      {issues.length === 0 ? (
        <p className="tk-lint-summary" data-testid="validation-summary">
          Document structure is valid.
        </p>
      ) : (
        <ul className="tk-lint-list">
          {issues.map((i, idx) => (
            <li key={idx} className={`tk-lint-row ${i.severity === 'error' ? 'is-fail' : 'is-warn'}`}>
              <span className="tk-lint-badge">{i.severity}</span>
              <span className="tk-lint-element">{i.message}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}