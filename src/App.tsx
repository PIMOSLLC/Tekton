import { useCallback, useMemo, useState } from 'react';
import fixtureYaml from '../fixtures/serta-simmons.yaml?raw';
import { useBlueprintDocument } from './core/useBlueprintDocument';
import { BuildCanvas } from './BuildCanvas';
import { CardInspector } from './CardInspector';
import { ExpandablePanel } from './ExpandablePanel';
import { StudioNav } from './StudioNav';
import { LintTerminal } from './LintTerminal';
import { VisualArchitect } from './VisualArchitect';
import './index.css';
import './styles/tekton-theme.css';
import './App.css';

type PanelSection = 'architect' | 'yaml' | null;
type ViewMode = 'build' | 'preview';

interface CardPosition {
  lane: number;
  stage: number;
}

/**
 * App shell — thin composition (owner direction: modular for platform
 * scaffolding). All document logic lives in `useBlueprintDocument` (core); all
 * shells — web today, Tauri desktop and the PIN toolkit module later —
 * compose that hook with presentational components. Layout: collapsible
 * StudioNav → pushing ExpandablePanel → workspace column. Nothing overlays;
 * every panel pushes.
 */
export function App() {
  const bp = useBlueprintDocument(fixtureYaml);

  // Shell UI state (not document state)
  const [navExpanded, setNavExpanded] = useState(false);
  const [view, setView] = useState<ViewMode>('build');
  const [panelSection, setPanelSection] = useState<PanelSection>('architect');
  const [selectedCard, setSelectedCard] = useState<CardPosition | null>(null);
  const [terminalOpen, setTerminalOpen] = useState(true);

  const toggleSection = useCallback((section: Exclude<PanelSection, null>) => {
    setPanelSection((prev) => (prev === section ? null : section));
  }, []);

  const focusCanvas = useCallback(() => {
    setPanelSection(null);
    setSelectedCard(null);
  }, []);

  const download = useCallback(() => {
    if (!bp.html) return;
    const blob = new Blob([bp.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download =
      bp.format === 'standalone' ? 'blueprint-standalone.html' : 'blueprint-wordpress.html';
    a.click();
    URL.revokeObjectURL(url);
  }, [bp.html, bp.format]);

  const selectedLane = useMemo(
    () => (selectedCard && bp.doc ? bp.doc.lanes[selectedCard.lane] : null),
    [selectedCard, bp.doc],
  );
  const selectedCardData = useMemo(
    () =>
      selectedCard && bp.doc && bp.doc.lanes[selectedCard.lane]
        ? bp.doc.lanes[selectedCard.lane].cards[selectedCard.stage] ?? null
        : null,
    [selectedCard, bp.doc],
  );
  const stageName = useMemo(
    () => (selectedCard && bp.doc ? (bp.doc.stages[selectedCard.stage]?.name ?? '') : ''),
    [selectedCard, bp.doc],
  );

  const lintFailures = bp.findings.filter((f) => !f.aa).length;
  const errorCount = bp.issues.filter((i) => i.severity === 'error').length;

  return (
    <div
      className="dark flex h-screen bg-midnight text-gray-200 font-sans overflow-hidden"
      data-phoenix-theme="tekton-dark"
    >
      <StudioNav
        expanded={navExpanded}
        onToggleExpanded={() => setNavExpanded((v) => !v)}
        openSection={panelSection}
        terminalOpen={terminalOpen}
        engineReady={bp.engineReady}
        engineError={bp.renderError !== null}
        onToggleSection={toggleSection}
        onFocusCanvas={focusCanvas}
        onToggleTerminal={() => setTerminalOpen((v) => !v)}
        onExport={download}
        canExport={bp.html !== null}
      />

      <ExpandablePanel
        section={panelSection}
        title={panelSection === 'yaml' ? 'YAML Source' : 'Visual Architect'}
        blurb={
          panelSection === 'yaml'
            ? 'The headless format — author the blueprint without the visual editor; this document IS the blueprint.'
            : 'Structure the blueprint: metadata, stages, and lanes.'
        }
        onClose={() => setPanelSection(null)}
      >
        {panelSection === 'architect' && bp.doc && (
          <VisualArchitect
            eyebrow={bp.doc.meta.eyebrow}
            title={bp.doc.meta.title}
            intro={bp.doc.meta.intro}
            stages={bp.doc.stages}
            lanes={bp.doc.lanes}
            onMetaChange={bp.setMeta}
            onStageChange={bp.setStage}
            onStageAdd={bp.addStage}
            onStageRemove={bp.removeStage}
            onLaneChange={bp.setLane}
            onLaneAdd={bp.addLane}
            onLaneRemove={bp.removeLane}
          />
        )}
        {panelSection === 'yaml' && (
          <textarea
            className="tk-yaml-source"
            aria-label="Blueprint source (YAML)"
            spellCheck={false}
            value={bp.yamlText}
            onFocus={bp.onYamlFocus}
            onBlur={bp.onYamlBlur}
            onChange={(e) => bp.onYamlChange(e.target.value)}
          />
        )}
      </ExpandablePanel>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar (PIN-style slim header) */}
        <div className="h-12 flex items-center gap-3 px-4 border-b border-gray-700 bg-gray-900 shrink-0">
          <span className="font-mono text-[10px] text-gray-400 bg-gray-800 px-2 py-1 rounded border border-gray-700">
            {bp.doc?.meta.title ?? '…'}
          </span>
          <div className="flex bg-gray-800 rounded-md border border-gray-700 overflow-hidden" role="group" aria-label="Output format">
            <button
              type="button"
              className={`px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                bp.format === 'standalone' ? 'bg-brand-secondary text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
              onClick={() => bp.setFormat('standalone')}
            >
              Standalone
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 text-[11px] font-semibold transition-colors border-l border-gray-700 ${
                bp.format === 'wordpress' ? 'bg-brand-secondary text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
              onClick={() => bp.setFormat('wordpress')}
            >
              WordPress
            </button>
          </div>
          <div className="flex bg-gray-800 rounded-md border border-gray-700 overflow-hidden" role="group" aria-label="View mode">
            <button
              type="button"
              className={`px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                view === 'build' ? 'bg-brand-secondary text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
              onClick={() => setView('build')}
            >
              Build
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 text-[11px] font-semibold transition-colors border-l border-gray-700 ${
                view === 'preview' ? 'bg-brand-secondary text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
              onClick={() => setView('preview')}
            >
              Preview
            </button>
          </div>
          <span className="ml-auto text-[10px] text-gray-500 font-mono">
            {view === 'build' ? 'click a card to edit · Esc closes' : 'live engine render'}
          </span>
        </div>

        {/* Workspace */}
        <main className="flex-1 flex flex-col min-h-0 relative">
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {bp.renderError ? (
              <div className="tk-error m-5" role="alert" data-testid="render-error">
                <strong>Render blocked:</strong> {bp.renderError}
              </div>
            ) : view === 'build' ? (
              bp.doc ? (
                <BuildCanvas
                  doc={bp.doc}
                  selectedCard={selectedCard}
                  onSelectCard={setSelectedCard}
                />
              ) : (
                <p className="tk-loading">loading…</p>
              )
            ) : bp.html ? (
              <iframe
                title="Blueprint preview"
                className="tk-preview"
                sandbox="allow-scripts allow-modals"
                srcDoc={bp.html}
              />
            ) : (
              <p className="tk-loading">Rendering…</p>
            )}
          </div>

          <LintTerminal
            findings={bp.findings}
            issues={bp.issues}
            open={terminalOpen}
            onToggle={() => setTerminalOpen((v) => !v)}
          />
        </main>

        {/* Status footer (PIN family language) */}
        <footer className="h-7 flex items-center gap-5 px-4 border-t border-gray-700 bg-gray-900 text-[9px] font-mono uppercase tracking-widest text-gray-500 shrink-0">
          <span>{bp.doc?.meta.eyebrow ?? '—'}</span>
          <span>{bp.format}</span>
          <span>{bp.engineReady ? 'engine: wasm' : 'engine: loading'}</span>
          <span className={errorCount === 0 ? 'text-emerald-400' : 'text-amber-400'}>
            {errorCount === 0 ? 'valid ✓' : `${errorCount} error(s)`}
          </span>
          <span className={lintFailures === 0 ? 'text-emerald-400' : 'text-amber-400'}>
            {bp.findings.length > 0
              ? lintFailures === 0
                ? `wcag aa ✓ (${bp.findings.length})`
                : `wcag aa ✗ ${lintFailures}/${bp.findings.length}`
              : 'wcag aa —'}
          </span>
        </footer>
      </div>

      <CardInspector
        open={selectedCard !== null}
        lane={selectedLane}
        stageName={stageName}
        card={selectedCardData}
        onCardChange={(field, value) => {
          if (selectedCard) bp.setCard(selectedCard.lane, selectedCard.stage, field, value);
        }}
        onInterpretationChange={(value) => {
          if (selectedCard) bp.setInterpretation(selectedCard.lane, value);
        }}
        onClose={() => setSelectedCard(null)}
      />
    </div>
  );
}