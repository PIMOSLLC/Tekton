import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import fixtureYaml from '../fixtures/serta-simmons.yaml?raw';
import { engine, type OutputFormat } from './engine/engineService';
import type { EngineFinding, EngineIssue } from './engine/engineServiceTypes';
import { BuildCanvas } from './BuildCanvas';
import { CardInspector } from './CardInspector';
import { ExpandablePanel } from './ExpandablePanel';
import { IconRail } from './IconRail';
import { LintTerminal } from './LintTerminal';
import { VisualArchitect } from './VisualArchitect';
import type { BlueprintDocument } from './types';
import './index.css';
import './styles/tekton-theme.css';
import './App.css';

const DEBOUNCE_MS = 150;
const YAML_COMMIT_MS = 500;

type PanelSection = 'architect' | 'yaml' | null;
type ViewMode = 'build' | 'preview';

interface CardPosition {
  lane: number;
  stage: number;
}

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'stage';

/**
 * App shell — the PIM family standard (adopted from Phoenix Insight Nexus):
 * IconRail (56px) → ExpandablePanel (260px) → content column with a slim
 * toolbar, the workspace (Build canvas / engine preview), the docked lint
 * terminal, and a StatusFooter bar. The document pipeline, CardInspector, and
 * all engine bindings are unchanged from the previous iteration.
 */
export function App() {
  const [doc, setDoc] = useState<BlueprintDocument | null>(null);
  const [view, setView] = useState<ViewMode>('build');
  const [panelSection, setPanelSection] = useState<PanelSection>('architect');
  const [format, setFormat] = useState<OutputFormat>('standalone');
  const [yamlText, setYamlText] = useState<string>(fixtureYaml);
  const yamlFocused = useRef(false);
  const [selectedCard, setSelectedCard] = useState<CardPosition | null>(null);
  const [terminalOpen, setTerminalOpen] = useState(true);

  const [html, setHtml] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [findings, setFindings] = useState<EngineFinding[]>([]);
  const [issues, setIssues] = useState<EngineIssue[]>([]);
  const [engineReady, setEngineReady] = useState(false);

  // Boot: parse the fixture through the Rust model.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const parsed = await engine.parse(fixtureYaml);
      if (!cancelled) {
        setDoc(parsed);
        setEngineReady(true);
      }
    })().catch((e: unknown) => {
      if (!cancelled) {
        setRenderError(e instanceof Error ? e.message : String(e));
        setEngineReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateDoc = useCallback((mutate: (draft: BlueprintDocument) => void) => {
    setDoc((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      mutate(next);
      return next;
    });
  }, []);

  // Visual edits refresh the YAML view unless the author is typing in it.
  useEffect(() => {
    if (!doc || yamlFocused.current) return;
    let cancelled = false;
    engine
      .serialize(doc)
      .then((yaml) => {
        if (!cancelled) setYamlText(yaml);
      })
      .catch(() => {
        /* invalid intermediate edits keep the last good YAML */
      });
    return () => {
      cancelled = true;
    };
  }, [doc]);

  const commitYaml = useCallback((text: string) => {
    engine
      .parse(text)
      .then(setDoc)
      .catch(() => {
        /* keep editing; render gate reports the error */
      });
  }, []);
  useEffect(() => {
    if (!yamlFocused.current) return;
    const t = setTimeout(() => commitYaml(yamlText), YAML_COMMIT_MS);
    return () => clearTimeout(t);
  }, [yamlText, commitYaml]);

  // Engine pipeline: doc → serialize → render + lint + validate (debounced).
  useEffect(() => {
    if (!doc) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const yaml = await engine.serialize(doc);
        const [rendered, lint, validation] = await Promise.all([
          engine.render(yaml, format),
          engine.lint(yaml),
          engine.validate(yaml),
        ]);
        if (cancelled) return;
        setHtml(rendered);
        setRenderError(null);
        setFindings(lint.findings);
        setIssues(validation.issues);
      } catch (e) {
        if (cancelled) return;
        setHtml(null);
        setRenderError(e instanceof Error ? e.message : String(e));
      }
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [doc, format]);

  // ── Edit handlers ──────────────────────────────────────────────────────
  const onMetaChange = useCallback(
    (field: 'eyebrow' | 'title' | 'intro', value: string) =>
      updateDoc((d) => {
        d.meta[field] = value;
      }),
    [updateDoc],
  );

  const onStageChange = useCallback(
    (index: number, field: 'name' | 'blurb', value: string) =>
      updateDoc((d) => {
        d.stages[index][field] = value;
      }),
    [updateDoc],
  );

  const onStageAdd = useCallback(
    () =>
      updateDoc((d) => {
        const name = `Stage ${d.stages.length + 1}`;
        d.stages.push({ id: slugify(name), name, blurb: '' });
        for (const lane of d.lanes) lane.cards.push({ title: '', blurb: '' });
      }),
    [updateDoc],
  );

  const onStageRemove = useCallback(
    (index: number) =>
      updateDoc((d) => {
        if (d.stages.length <= 1) return;
        d.stages.splice(index, 1);
        for (const lane of d.lanes) lane.cards.splice(index, 1);
      }),
    [updateDoc],
  );

  const onLaneChange = useCallback(
    (index: number, field: 'name' | 'blurb' | 'kind' | 'interpretation', value: string) =>
      updateDoc((d) => {
        const lane = d.lanes[index];
        if (field === 'kind') {
          lane.kind = value === '' ? undefined : (value as BlueprintDocument['lanes'][number]['kind']);
        } else {
          lane[field] = value;
        }
      }),
    [updateDoc],
  );

  const onLaneAdd = useCallback(
    () =>
      updateDoc((d) => {
        const name = `Lane ${d.lanes.length + 1}`;
        const id = slugify(name);
        d.lanes.push({
          id: d.lanes.some((l) => l.id === id) ? `${id}-${d.lanes.length}` : id,
          name,
          kind: 'backstage',
          interpretation: '',
          cards: d.stages.map(() => ({ title: '', blurb: '' })),
        });
      }),
    [updateDoc],
  );

  const onLaneRemove = useCallback(
    (index: number) =>
      updateDoc((d) => {
        if (d.lanes.length <= 1) return;
        d.lanes.splice(index, 1);
      }),
    [updateDoc],
  );

  const onCardChange = useCallback(
    (field: 'title' | 'blurb', value: string) => {
      if (!selectedCard) return;
      const { lane, stage } = selectedCard;
      updateDoc((d) => {
        d.lanes[lane].cards[stage][field] = value;
      });
    },
    [selectedCard, updateDoc],
  );

  const onInterpretationChange = useCallback(
    (value: string) => {
      if (!selectedCard) return;
      const { lane } = selectedCard;
      updateDoc((d) => {
        d.lanes[lane].interpretation = value;
      });
    },
    [selectedCard, updateDoc],
  );

  // ── Shell actions ───────────────────────────────────────────────────────
  const toggleSection = useCallback((section: Exclude<PanelSection, null>) => {
    setPanelSection((prev) => (prev === section ? null : section));
  }, []);

  const focusCanvas = useCallback(() => {
    setPanelSection(null);
    setSelectedCard(null);
  }, []);

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

  const selectedLane = useMemo(
    () => (selectedCard && doc ? doc.lanes[selectedCard.lane] : null),
    [selectedCard, doc],
  );
  const selectedCardData = useMemo(
    () =>
      selectedCard && doc && doc.lanes[selectedCard.lane]
        ? doc.lanes[selectedCard.lane].cards[selectedCard.stage] ?? null
        : null,
    [selectedCard, doc],
  );
  const stageName = useMemo(
    () => (selectedCard && doc ? (doc.stages[selectedCard.stage]?.name ?? '') : ''),
    [selectedCard, doc],
  );

  const lintFailures = findings.filter((f) => !f.aa).length;
  const errorCount = issues.filter((i) => i.severity === 'error').length;

  return (
    <div
      className="dark flex h-screen bg-midnight text-gray-200 font-sans overflow-hidden"
      data-phoenix-theme="tekton-dark"
    >
      <IconRail
        openSection={panelSection}
        terminalOpen={terminalOpen}
        engineReady={engineReady}
        engineError={renderError !== null}
        onToggleSection={toggleSection}
        onFocusCanvas={focusCanvas}
        onToggleTerminal={() => setTerminalOpen((v) => !v)}
        onExport={download}
        canExport={html !== null}
      />

      <ExpandablePanel
        section={panelSection}
        title={panelSection === 'yaml' ? 'YAML Source' : 'Visual Architect'}
        onClose={() => setPanelSection(null)}
      >
        {panelSection === 'architect' && doc && (
          <VisualArchitect
            eyebrow={doc.meta.eyebrow}
            title={doc.meta.title}
            intro={doc.meta.intro}
            stages={doc.stages}
            lanes={doc.lanes}
            onMetaChange={onMetaChange}
            onStageChange={onStageChange}
            onStageAdd={onStageAdd}
            onStageRemove={onStageRemove}
            onLaneChange={onLaneChange}
            onLaneAdd={onLaneAdd}
            onLaneRemove={onLaneRemove}
          />
        )}
        {panelSection === 'yaml' && (
          <textarea
            className="tk-yaml-source"
            aria-label="Blueprint source (YAML)"
            spellCheck={false}
            value={yamlText}
            onFocus={() => {
              yamlFocused.current = true;
            }}
            onBlur={() => {
              yamlFocused.current = false;
              commitYaml(yamlText);
            }}
            onChange={(e) => setYamlText(e.target.value)}
          />
        )}
      </ExpandablePanel>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar (PIN-style slim header) */}
        <div className="h-12 flex items-center gap-3 px-4 border-b border-gray-700 bg-gray-900 shrink-0">
          <span className="font-mono text-[10px] text-gray-400 bg-gray-800 px-2 py-1 rounded border border-gray-700">
            {doc?.meta.title ?? '…'}
          </span>
          <div className="flex bg-gray-800 rounded-md border border-gray-700 overflow-hidden" role="group" aria-label="Output format">
            <button
              type="button"
              className={`px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                format === 'standalone' ? 'bg-brand-secondary text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
              onClick={() => setFormat('standalone')}
            >
              Standalone
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 text-[11px] font-semibold transition-colors border-l border-gray-700 ${
                format === 'wordpress' ? 'bg-brand-secondary text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
              onClick={() => setFormat('wordpress')}
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
            {renderError ? (
              <div className="tk-error m-5" role="alert" data-testid="render-error">
                <strong>Render blocked:</strong> {renderError}
              </div>
            ) : view === 'build' ? (
              doc ? (
                <BuildCanvas
                  doc={doc}
                  selectedCard={selectedCard}
                  onSelectCard={setSelectedCard}
                />
              ) : (
                <p className="tk-loading">loading…</p>
              )
            ) : html ? (
              <iframe
                title="Blueprint preview"
                className="tk-preview"
                sandbox="allow-scripts allow-modals"
                srcDoc={html}
              />
            ) : (
              <p className="tk-loading">Rendering…</p>
            )}
          </div>

          <LintTerminal
            findings={findings}
            issues={issues}
            open={terminalOpen}
            onToggle={() => setTerminalOpen((v) => !v)}
          />
        </main>

        {/* Status footer (PIN family language) */}
        <footer className="h-7 flex items-center gap-5 px-4 border-t border-gray-700 bg-gray-900 text-[9px] font-mono uppercase tracking-widest text-gray-500 shrink-0">
          <span>{doc?.meta.eyebrow ?? '—'}</span>
          <span>{format}</span>
          <span>{engineReady ? `engine: ${engine.backend}` : 'engine: loading'}</span>
          <span className={errorCount === 0 ? 'text-emerald-400' : 'text-amber-400'}>
            {errorCount === 0 ? 'valid ✓' : `${errorCount} error(s)`}
          </span>
          <span className={lintFailures === 0 ? 'text-emerald-400' : 'text-amber-400'}>
            {findings.length > 0
              ? lintFailures === 0
                ? `wcag aa ✓ (${findings.length})`
                : `wcag aa ✗ ${lintFailures}/${findings.length}`
              : 'wcag aa —'}
          </span>
        </footer>
      </div>

      <CardInspector
        open={selectedCard !== null}
        lane={selectedLane}
        stageName={stageName}
        card={selectedCardData}
        onCardChange={onCardChange}
        onInterpretationChange={onInterpretationChange}
        onClose={() => setSelectedCard(null)}
      />
    </div>
  );
}