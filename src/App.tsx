import { useCallback, useMemo, useState } from 'react';
import { Cpu, FileOutput, CheckSquare, ShieldCheck } from 'lucide-react';
import fixtureYaml from '../fixtures/serta-simmons.yaml?raw';
import { useBlueprintDocument } from './core/useBlueprintDocument';
import { BuildCanvas } from './BuildCanvas';
import { CanvasViewport } from './CanvasViewport';
import { CardInspector } from './CardInspector';
import { ExpandablePanel } from './ExpandablePanel';
import { StudioNav } from './StudioNav';
import { LintTerminal } from './LintTerminal';
import { VisualArchitect } from './VisualArchitect';
import { StatusFooter, type StatusItem } from './StatusFooter';
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
  const warningCount = bp.issues.length - errorCount;

  const statusItems: StatusItem[] = useMemo(() => {
    const engineReady = bp.engineReady && !bp.renderError;
    return [
      {
        id: 'engine',
        label: 'Engine',
        icon: Cpu,
        led: engineReady ? 'success' : bp.renderError ? 'error' : 'warning',
        // The ready state pulses exactly like PIN's connected LED.
        ledPulse: engineReady,
        value: engineReady ? 'WASM' : bp.renderError ? 'Error' : 'Loading',
        tooltip: [
          'blueprint-core v0.1.0 · wasm32 · in-browser',
          'render + lint + validate, single 4.4KB module',
          bp.renderError ? 'render gate blocked — see the canvas' : 'pipeline: serialize → render/lint/validate',
        ],
      },
      {
        id: 'format',
        label: 'Format',
        icon: FileOutput,
        led: 'neutral',
        value: bp.format === 'standalone' ? 'Standalone' : 'WordPress',
        tooltip: [
          'standalone: full document (h1)',
          'wordpress: embed fragment (h2, no shell)',
        ],
      },
      {
        id: 'validation',
        label: 'Structure',
        icon: CheckSquare,
        led: bp.issues.length === 0 ? 'success' : errorCount > 0 ? 'error' : 'warning',
        value: errorCount === 0 && warningCount === 0 ? 'Valid' : `${errorCount}E ${warningCount}W`,
        tooltip:
          bp.issues.length === 0
            ? ['document shape complete', 'every lane has one card per stage']
            : bp.issues.slice(0, 3).map((i) => `${i.severity === 'error' ? 'E' : 'W'} ${i.message}`),
      },
      {
        id: 'contrast',
        label: 'WCAG AA',
        icon: ShieldCheck,
        led: bp.findings.length === 0 ? 'warning' : lintFailures === 0 ? 'success' : 'error',
        ledPulse: bp.findings.length > 0 && lintFailures === 0,
        value: bp.findings.length === 0 ? 'Checking' : lintFailures === 0 ? 'Pass' : `${lintFailures}/${bp.findings.length}`,
        tooltip:
          bp.findings.length === 0
            ? ['linting…']
            : [
                `${bp.findings.length} contrast pairs checked`,
                lintFailures === 0
                  ? 'all pairs pass AA'
                  : `${lintFailures} pair(s) fail — fix in the YAML or canvas`,
              ],
      },
    ];
  }, [bp.engineReady, bp.renderError, bp.issues, bp.findings, bp.format, errorCount, warningCount, lintFailures]);

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
                <CanvasViewport
                  fitKey={`${bp.doc.stages.length}x${bp.doc.lanes.length}`}
                >
                  <BuildCanvas
                    doc={bp.doc}
                    selectedCard={selectedCard}
                    onSelectCard={setSelectedCard}
                  />
                </CanvasViewport>
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

        {/* status footer — the PIN pattern, taller (44px): ALL status lights live
            here, including the engine connection light (moved out of the nav) */}
        <StatusFooter
          brand="Phoenix Tekton · 2026 · Build 0.1.0"
          context={bp.doc?.meta.eyebrow ?? '—'}
          items={statusItems}
        />
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