import { useCallback, useEffect, useMemo, useState } from 'react';
import fixtureYaml from '../fixtures/serta-simmons.yaml?raw';
import { engine, type OutputFormat } from './engine/engineService';
import { LintPanel, ValidationPanel, lintSummary } from './LintPanel';
import type { EngineFinding, EngineIssue } from './engine/engineService';
import './styles/tekton-theme.css';
import './App.css';

const DEBOUNCE_MS = 150;

export function App() {
  const [yaml, setYaml] = useState(fixtureYaml);
  const [format, setFormat] = useState<OutputFormat>('standalone');
  const [debounced, setDebounced] = useState(fixtureYaml);
  const [html, setHtml] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [findings, setFindings] = useState<EngineFinding[]>([]);
  const [issues, setIssues] = useState<EngineIssue[]>([]);
  const [engineReady, setEngineReady] = useState(false);

  // Debounce keystrokes — the wasm render is fast, but this keeps typing smooth.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(yaml), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [yaml]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [rendered, lint, validation] = await Promise.all([
          engine.render(debounced, format),
          engine.lint(debounced),
          engine.validate(debounced),
        ]);
        if (cancelled) return;
        setHtml(rendered);
        setRenderError(null);
        setFindings(lint.findings);
        setIssues(validation.issues);
        setEngineReady(true);
      } catch (e) {
        if (cancelled) return;
        setHtml(null);
        setRenderError(e instanceof Error ? e.message : String(e));
        setEngineReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debounced, format]);

  const download = useCallback(() => {
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = format === 'standalone' ? 'blueprint-standalone.html' : 'blueprint-wordpress.html';
    a.click();
    URL.revokeObjectURL(url);
  }, [html, format]);

  const openStandalone = useCallback(() => {
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    window.open(URL.createObjectURL(blob), '_blank');
  }, [html]);

  const backendLabel = useMemo(() => `engine: ${engine.backend} (wasm32)`, []);

  return (
    <div className="tk-root" data-phoenix-theme="tekton-dark">
      <header className="tk-header">
        <h1>phoenix-Tekton</h1>
        <p className="tk-tagline">Service Blueprint Studio</p>
        <span className="tk-status" data-testid="engine-status">
          {engineReady ? backendLabel : 'loading engine…'}
        </span>
      </header>

      <main className="tk-layout">
        <section className="tk-source" aria-label="Blueprint source (YAML)">
          <label htmlFor="tk-yaml">Blueprint source (YAML)</label>
          <textarea
            id="tk-yaml"
            value={yaml}
            spellCheck={false}
            onChange={(e) => setYaml(e.target.value)}
          />
        </section>

        <section className="tk-side" aria-label="Preview and lint">
          <div className="tk-preview-toolbar">
            <button
              type="button"
              className={format === 'standalone' ? 'is-active' : ''}
              onClick={() => setFormat('standalone')}
            >
              standalone
            </button>
            <button
              type="button"
              className={format === 'wordpress' ? 'is-active' : ''}
              onClick={() => setFormat('wordpress')}
            >
              wordpress
            </button>
            <button type="button" onClick={download} disabled={!html}>
              download HTML
            </button>
            <button type="button" onClick={openStandalone} disabled={!html}>
              open in tab
            </button>
          </div>

          {renderError ? (
            <div className="tk-error" role="alert" data-testid="render-error">
              <strong>Render blocked:</strong> {renderError}
            </div>
          ) : html ? (
            <iframe
              title="Blueprint preview"
              className="tk-preview"
              sandbox="allow-scripts allow-modals"
              srcDoc={html}
            />
          ) : (
            <div className="tk-error">Rendering…</div>
          )}

          <p className="tk-lint-summary" data-testid="lint-flash">
            {engineReady ? lintSummary(findings) : '…'}
          </p>
          <LintPanel findings={findings} />
          <ValidationPanel issues={issues} />
        </section>
      </main>
    </div>
  );
}