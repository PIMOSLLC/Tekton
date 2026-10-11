import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import fixtureYaml from '../fixtures/serta-simmons.yaml?raw';
import { engine, type OutputFormat } from './engine/engineService';
import type { EngineFinding, EngineIssue } from './engine/engineServiceTypes';
import { BuildCanvas } from './BuildCanvas';
import { CardInspector } from './CardInspector';
import { LintTerminal } from './LintTerminal';
import { VisualArchitect } from './VisualArchitect';
import type { BlueprintDocument } from './types';
import './styles/tekton-theme.css';
import './App.css';

const DEBOUNCE_MS = 150;
const YAML_COMMIT_MS = 500;

type SourceTab = 'visual' | 'yaml';
type ViewMode = 'build' | 'preview';

interface CardPosition {
  lane: number;
  stage: number;
}

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'stage';

export function App() {
  // Document-as-state (adopted architecture): the parsed model is the single
  // source of truth; YAML is a derived serialization view.
  const [doc, setDoc] = useState<BlueprintDocument | null>(null);
  const [view, setView] = useState<ViewMode>('build');
  const [sourceTab, setSourceTab] = useState<SourceTab>('visual');
  const [format, setFormat] = useState<OutputFormat>('standalone');
  const [yamlText, setYamlText] = useState<string>(fixtureYaml);
  const yamlFocused = useRef(false);
  const [selectedCard, setSelectedCard] = useState<CardPosition | null>(null);
  const [terminalOpen, setTerminalOpen] = useState(true);

  // Engine outputs
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
    return () => { cancelled = true; };
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
      .then((yaml) => { if (!cancelled) setYamlText(yaml); })
      .catch(() => { /* invalid intermediate edits keep the last good YAML */ });
    return () => { cancelled = true; };
  }, [doc]);

  // YAML edits commit back into the document (debounced).
  const commitYaml = useCallback((text: string) => {
    engine
      .parse(text)
      .then(setDoc)
      .catch(() => { /* keep editing; render gate reports the error */ });
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
    return () => { cancelled = true; clearTimeout(t); };
  }, [doc, format]);

  // ── Edit handlers ──────────────────────────────────────────────────────
  const onMetaChange = useCallback(
    (field: 'eyebrow' | 'title' | 'intro', value: string) =>
      updateDoc((d) => { d.meta[field] = value; }),
    [updateDoc],
  );

  const onStageChange = useCallback(
    (index: number, field: 'name' | 'blurb', value: string) =>
      updateDoc((d) => { d.stages[index][field] = value; }),
    [updateDoc],
  );

  const onStageAdd = useCallback(
    () => updateDoc((d) => {
      const name = `Stage ${d.stages.length + 1}`;
      d.stages.push({ id: slugify(name), name, blurb: '' });
      for (const lane of d.lanes) lane.cards.push({ title: '', blurb: '' });
    }),
    [updateDoc],
  );

  const onStageRemove = useCallback(
    (index: number) => updateDoc((d) => {
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
    () => updateDoc((d) => {
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
    (index: number) => updateDoc((d) => {
      if (d.lanes.length <= 1) return;
      d.lanes.splice(index, 1);
    }),
    [updateDoc],
  );

  const onCardChange = useCallback(
    (field: 'title' | 'blurb', value: string) => {
      if (!selectedCard) return;
      const { lane, stage } = selectedCard;
      updateDoc((d) => { d.lanes[lane].cards[stage][field] = value; });
    },
    [selectedCard, updateDoc],
  );

  const onInterpretationChange = useCallback(
    (value: string) => {
      if (!selectedCard) return;
      const { lane } = selectedCard;
      updateDoc((d) => { d.lanes[lane].interpretation = value; });
    },
    [selectedCard, updateDoc],
  );

  // ── Export ─────────────────────────────────────────────────────────────
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
    () =>
      selectedCard && doc
        ? (doc.stages[selectedCard.stage]?.name ?? '')
        : '',
    [selectedCard, doc],
  );

  return (
    <div className="tk-root" data-phoenix-theme="tekton-dark">
      <header className="tk-header">
        <div className="tk-header-brand">
          <h1>PHOENIX TEKTON</h1>
          <span className="tk-tagline">Service Blueprint Studio</span>
        </div>
        <span className="tk-project-pill">Serta Simmons Pilot</span>
        <div className="tk-header-actions">
          <div className="tk-segmented" role="group" aria-label="Output format">
            <button
              type="button"
              className={format === 'standalone' ? 'is-active' : ''}
              onClick={() => setFormat('standalone')}
            >
              Standalone
            </button>
            <button
              type="button"
              className={format === 'wordpress' ? 'is-active' : ''}
              onClick={() => setFormat('wordpress')}
            >
              WordPress
            </button>
          </div>
          <button type="button" className="tk-btn" onClick={download} disabled={!html}>
            Export HTML
          </button>
          <span className="tk-status" data-testid="engine-status">
            {engineReady ? `engine: ${engine.backend} (wasm32)` : 'loading engine…'}
          </span>
        </div>
      </header>

      <main className="tk-layout">
        <section className="tk-left" aria-label="Visual Architect">
          <div className="tk-left-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={sourceTab === 'visual'}
              className={sourceTab === 'visual' ? 'is-active' : ''}
              onClick={() => setSourceTab('visual')}
            >
              Visual Architect
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={sourceTab === 'yaml'}
              className={sourceTab === 'yaml' ? 'is-active' : ''}
              onClick={() => setSourceTab('yaml')}
            >
              YAML Source
            </button>
          </div>
          {sourceTab === 'visual' ? (
            doc ? (
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
            ) : (
              <p className="tk-loading">loading engine…</p>
            )
          ) : (
            <textarea
              className="tk-yaml-source"
              aria-label="Blueprint source (YAML)"
              spellCheck={false}
              value={yamlText}
              onFocus={() => { yamlFocused.current = true; }}
              onBlur={() => { yamlFocused.current = false; commitYaml(yamlText); }}
              onChange={(e) => setYamlText(e.target.value)}
            />
          )}
        </section>

        <section className="tk-center" aria-label="Canvas">
          <div className="tk-canvas-toolbar">
            <div className="tk-segmented" role="group" aria-label="View mode">
              <button
                type="button"
                className={view === 'build' ? 'is-active' : ''}
                onClick={() => setView('build')}
              >
                Build
              </button>
              <button
                type="button"
                className={view === 'preview' ? 'is-active' : ''}
                onClick={() => setView('preview')}
              >
                Preview
              </button>
            </div>
            <span className="tk-canvas-hint">
              {view === 'build'
                ? 'Click a card to edit it in the inspector'
                : 'Live engine render — interactions enabled'}
            </span>
          </div>

          <div className="tk-canvas-viewport">
            {renderError ? (
              <div className="tk-error" role="alert" data-testid="render-error">
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
        </section>
      </main>

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