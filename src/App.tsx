import { useCallback, useEffect, useMemo, useState } from 'react';
import { Cpu, FileOutput, CheckSquare, ShieldCheck, Clock } from 'lucide-react';
import fixtureYaml from '../fixtures/agentic-ai-ecommerce.yaml?raw';
import { useBlueprintDocument, slugifyTitle, type BlueprintSetup, type LoadResult } from './core/useBlueprintDocument';
import { engine } from './engine/engineService';
import type { EngineIssue } from './engine/engineServiceTypes';
import { TEMPLATES } from './core/templates';
import { LANE_TINT_SWATCHES } from './types';
import {
  browserFileStore,
  localStorageAutosave,
} from './platform/persistence';
import { loadAppProfile, saveAppProfile, type AppProfile } from './platform/appProfile';
import { BuildCanvas } from './BuildCanvas';
import { SetupWizardModal } from './SetupWizardModal';
import { WelcomeModal } from './WelcomeModal';
import { AppHeader } from './AppHeader';
import { CanvasViewport } from './CanvasViewport';
import { CardInspector } from './CardInspector';
import { ConfirmationModal } from './ConfirmationModal';
import { ExpandablePanel, clampPanelWidth } from './ExpandablePanel';
import { StudioNav } from './StudioNav';
import { LintTerminal } from './LintTerminal';
import { ThemeEditor } from './ThemeEditor';
import { VisualArchitect } from './VisualArchitect';
import { StatusFooter, type StatusItem } from './StatusFooter';
import './index.css';
import './styles/tekton-theme.css';
import './App.css';

type PanelSection = 'architect' | 'yaml' | 'new' | 'theme' | null;
type ViewMode = 'build' | 'preview';

/** Modal dialogs (PIN-family ConfirmationModal) — replaces window.confirm/alert. */
type PendingDialog =
  | { kind: 'confirm'; title: string; message: string; action: () => void }
  | { kind: 'error'; title: string; message: string };

interface CardPosition {
  lane: number;
  stage: number;
}

// Stateless adapters: one instance per app (stable identities for effects).
const files = browserFileStore();
const workspace = localStorageAutosave();

const stripExtension = (name: string) => name.replace(/\.(ya?ml|json)$/i, '');
const matchesFormat = (name: string, format: 'yaml' | 'json') =>
  format === 'json' ? /\.json$/i.test(name) : /\.ya?ml$/i.test(name);

/** Per-section panel defaults (the profile stores user-resized overrides). */
type NonNullSection = Exclude<PanelSection, null>;
const PANEL_DEFAULTS: Record<NonNullSection, number> = {
  architect: 400,
  yaml: 460,
  new: 400,
  theme: 400,
};

/** File name for a Save: keep the open/save file's name (same format), else
 * re-derive from the title — the name IS the title, slugified. ALWAYS lands
 * with the format's extension: an extensionless text/plain download makes
 * the browser append .txt (the bug the owner caught). */
function saveName(sourceName: string | null, metaTitle: string, format: 'yaml' | 'json'): string {
  const ext = format === 'json' ? '.json' : '.yaml';
  if (sourceName) {
    if (matchesFormat(sourceName, format)) return sourceName;
    return `${stripExtension(sourceName) || slugifyTitle(metaTitle)}${ext}`;
  }
  return `${slugifyTitle(metaTitle) || 'blueprint'}${ext}`;
}

const isTyping = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.matches('input, textarea, select') || target.isContentEditable);

/** PIN-module host detection: PIN's toolkit host sets this global; the
 * standalone web/Tauri shells never do (and their header shows — in PIN,
 * PIN's own Layout owns the top chrome). */
const isPinModuleHost = (): boolean =>
  typeof window !== 'undefined' && '__PIN_HOST__' in window;

/**
 * App shell — thin composition (owner direction: modular for platform
 * scaffolding). All document logic lives in `useBlueprintDocument` (core); all
 * shells — web today, Tauri desktop and the PIN toolkit module later —
 * compose that hook with presentational components. Layout: collapsible
 * StudioNav → pushing ExpandablePanel → workspace column. Nothing overlays;
 * every panel pushes.
 *
 * Blueprint lifecycle: Save/Open/New run through the shell's persistence
 * adapters (`src/platform/persistence.ts`); the naming derives from
 * `meta.title`. A localStorage autosave restores unsaved work across a
 * refresh — a recalled session boots dirty so it prompts for Save.
 */
export function App() {
  // Boot seed: an autosave recall if one exists, else the bundled fixture.
  // Read ONCE — `useBlueprintDocument` treats its seed as boot-only.
  const [boot] = useState<{ sourceName: string | null; yaml: string; recalled: boolean }>(() => {
    const recalled = workspace.recall();
    return recalled ? { ...recalled, recalled: true } : { sourceName: null, yaml: fixtureYaml, recalled: false };
  });
  const bp = useBlueprintDocument(boot.yaml, { bootClean: !boot.recalled });

  // Shell UI state (not document state)
  const [navExpanded, setNavExpanded] = useState(false);
  const [view, setView] = useState<ViewMode>('build');
  const [panelSection, setPanelSection] = useState<PanelSection>('architect');
  const [selectedCard, setSelectedCard] = useState<CardPosition | null>(null);
  // The lint terminal stays DOCKED but closed on boot — the footer's WCAG
  // light is the always-visible verdict; opening the terminal is a choice.
  const [terminalOpen, setTerminalOpen] = useState(false);
  /** The file behind the current work (null = never saved/opened). */
  const [sourceName, setSourceName] = useState<string | null>(boot.sourceName);
  const [dialog, setDialog] = useState<PendingDialog | null>(null);
  /** Data-layer choice for the exported pair (html + `slug.yaml|json`). */
  const [dataFormat, setDataFormat] = useState<'yaml' | 'json'>('yaml');
  /** The app profile — user settings/preferences (boot invitation, panel widths). */
  const [profile, setProfileState] = useState<AppProfile>(() => loadAppProfile());
  const updateProfile = useCallback((patch: Partial<AppProfile>) => {
    setProfileState((prev) => {
      const next: AppProfile = {
        ...prev,
        ...patch,
        panelWidths: { ...prev.panelWidths, ...(patch.panelWidths ?? {}) },
      };
      saveAppProfile(next);
      return next;
    });
  }, []);
  /** The boot-time setup invitation — shown until opted out in the profile. */
  const [inviteOpen, setInviteOpen] = useState(() => profile.showSetupOnStart);
  /** New-panel flow: template picker first, or the guided wizard. */
  const [wizardOpen, setWizardOpen] = useState(false);

  const resizePanel = useCallback((section: NonNullSection, width: number) => {
    // Store through the profile (single home for user prefs); clamp first.
    updateProfile({ panelWidths: { [section]: clampPanelWidth(width) } });
  }, [updateProfile]);

  const toggleSection = useCallback((section: Exclude<PanelSection, null>) => {
    setPanelSection((prev) => (prev === section ? null : section));
  }, []);

  const focusCanvas = useCallback(() => {
    setPanelSection(null);
    setSelectedCard(null);
  }, []);

  /** Card click = toggle: click a card to open its inspector, click the SAME
   * card again to close it — no trip to the drawer's close button. The
   * buttons already carry aria-pressed, so the toggling matches their
   * announced state. */
  const handleSelectCard = useCallback((position: CardPosition) => {
    setSelectedCard((prev) =>
      prev && prev.lane === position.lane && prev.stage === position.stage ? null : position,
    );
  }, []);
  /** Recovery: a card-located validation issue navigates to its card — the
   * inspector opens focused on the first field, the fix is one input away. */
  const fixIssue = useCallback((issue: EngineIssue) => {
    if (issue.lane === undefined || issue.stage === undefined) return;
    setPanelSection(null);
    setSelectedCard({ lane: issue.lane, stage: issue.stage });
  }, []);

  /** The gate banner, editor-side truncated — the full list lives (navigably)
   * in the lint terminal; 15+ messages must not become a wall of red. */
  const lintFailures = bp.findings.filter((f) => !f.aa).length;
  const errorCount = bp.issues.filter((i) => i.severity === 'error').length;
  const warningCount = bp.issues.length - errorCount;

  /** The gate banner, editor-side. A freshly created (or in-progress) blueprint
   * whose ONLY validation problems are empty card titles is not "broken" — it
   * is READY TO FILL: a neutral teal banner + direction, never red. Real
   * structural errors or AA failures keep the red gate with the truncated
   * issue list (full navigable list lives in the lint terminal). */
  const gateInfo = useMemo(() => {
    if (!bp.renderError) return null;
    const errorIssues = bp.issues.filter((i) => i.severity === 'error');
    const slots = errorIssues.filter((i) => i.code === 'card_title_required');
    const structural = errorIssues.filter((i) => i.code !== 'card_title_required');
    const lintGated = bp.findings.some((f) => !f.aa);
    if (errorCount > 0 && structural.length === 0 && !lintGated) {
      return {
        tone: 'ready' as const,
        text: `Preview gated — ${slots.length} card slot${slots.length === 1 ? '' : 's'} ${
          slots.length === 1 ? 'is' : 'are'
        } ready to fill. Click any dashed card (or "fix →" in the lint terminal); the preview unlocks when every slot has a title.`,
      };
    }
    const parts = bp.renderError.split('; ');
    return {
      tone: 'error' as const,
      text:
        parts.length <= 3
          ? bp.renderError
          : `${parts.slice(0, 3).join('; ')} (+${parts.length - 3} more — the lint terminal navigates)`,
    };
  }, [bp.renderError, bp.issues, bp.findings, errorCount]);

  /** Export = the pair: the interactive, self-contained HTML (pre-rendered
   * static DOM — the artifact's accessibility engineering) + the data layer
   * file in the chosen format. Edit the data by hand or via `tekton render`
   * and re-export — the layer is the same file Save writes. */
  const exportBlueprint = useCallback(async () => {
    if (!bp.doc || !bp.html) return;
    const stem = stripExtension(saveName(sourceName, bp.doc.meta.title, dataFormat));
    const htmlName = `${stem}-${bp.format === 'wordpress' ? 'wordpress' : 'standalone'}.html`;
    const dataName = `${stem}.${dataFormat}`;
    const dataText = dataFormat === 'yaml' ? await bp.getYaml() : await bp.getJson();
    await files.saveFile(htmlName, bp.html);
    await files.saveFile(dataName, dataText);
  }, [bp, sourceName, dataFormat]);

  // ── Blueprint lifecycle ────────────────────────────────────────────────
  // New opens the template picker (a pushed panel); the pick (or wizard
  // create) runs the discard confirmation dialog — opening the picker
  // modifies nothing. Load failures surface as modal error dialogs.
  const flowNew = useCallback(() => {
    setWizardOpen(false);
    setPanelSection('new');
  }, []);

  /** Destructive starts (template pick / wizard create / open) share one guard. */
  const withDiscardGuard = useCallback(
    (title: string, action: () => void) => {
      if (bp.dirty) {
        setDialog({
          kind: 'confirm',
          title,
          message:
            'Unsaved changes will be discarded — what you chose replaces your work.',
          action,
        });
      } else {
        action();
      }
    },
    [bp.dirty],
  );

  /** Landing after any successful "start from scratch" — clean, unnamed. */
  const landNew = useCallback(() => {
    setSourceName(null);
    setWizardOpen(false);
    setPanelSection(null);
    setDialog(null);
  }, []);

  const startFromTemplate = useCallback(
    (templateId: string) => {
      void bp.newDocument(templateId).then((result: LoadResult) => {
        if (result.ok) landNew();
        else {
          setDialog({
            kind: 'error',
            title: 'Could not load template',
            message: `Starting from "${templateId}" failed: ${result.error}`,
          });
        }
      });
    },
    [bp, landNew],
  );

  const pickTemplate = useCallback(
    (templateId: string) => {
      withDiscardGuard('Starting a new blueprint', () => startFromTemplate(templateId));
    },
    [withDiscardGuard, startFromTemplate],
  );

  const startFromSetup = useCallback(
    (setup: BlueprintSetup) => {
      void bp.createFromSetup(setup).then((result: LoadResult) => {
        if (result.ok) landNew();
        else {
          setDialog({
            kind: 'error',
            title: 'Could not create the blueprint',
            message: result.error,
          });
        }
      });
    },
    [bp, landNew],
  );

  const createFromWizard = useCallback(
    (setup: BlueprintSetup) => {
      withDiscardGuard('Creating a new blueprint', () => startFromSetup(setup));
    },
    [withDiscardGuard, startFromSetup],
  );

  const flowOpen = useCallback(() => {
    const open = () => {
      void (async () => {
        const opened = await files.openFile();
        if (!opened) return;
        const result = await bp.loadSource(opened.text, { clean: true });
        if (result.ok) setSourceName(opened.name);
        else {
          setDialog({
            kind: 'error',
            title: 'Could not open the file',
            message: `"${opened.name}" did not parse as a blueprint: ${result.error}`,
          });
        }
      })();
    };
    withDiscardGuard('Opening a blueprint', open);
  }, [bp, withDiscardGuard]);

  const saveBlueprint = useCallback(
    async (format: 'yaml' | 'json') => {
      if (!bp.doc) return;
      const text = format === 'yaml' ? await bp.getYaml() : await bp.getJson();
      const name = saveName(sourceName, bp.doc.meta.title, format);
      await files.saveFile(name, text);
      setSourceName(name);
      bp.markSaved();
    },
    [bp, sourceName],
  );

  const flowSave = useCallback(() => void saveBlueprint('yaml'), [saveBlueprint]);
  const flowSaveJson = useCallback(() => void saveBlueprint('json'), [saveBlueprint]);

  // Workspace autosave: the document, debounced; + FLUSHED IMMEDIATELY when
  // the tab is hidden/closing (the debounce's unflushed tail would otherwise
  // die with the tab — the exact work-loss the hardening closes). Recall
  // restores it on the next boot; the PIN phase later writes the same
  // document into its `toolkit_instances` row instead.
  const writeAutosave = useCallback(
    (name: string | null) => {
      void bp.getYaml()
        .then((yaml) => {
          workspace.remember({ sourceName: name, yaml });
          setLastAutosave(new Date());
        })
        .catch(() => {
          /* invalid intermediate state keeps the last good snapshot */
        });
    },
    [bp],
  );

  useEffect(() => {
    if (!bp.engineReady || !bp.doc) return;
    const t = setTimeout(() => writeAutosave(sourceName), 800);
    return () => clearTimeout(t);
  }, [bp.doc, bp.engineReady, bp.getYaml, sourceName, writeAutosave]);

  useEffect(() => {
    const flush = () => writeAutosave(sourceName);
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flush);
    window.addEventListener('blur', flush);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('blur', flush);
    };
  }, [writeAutosave, sourceName]);

  /** Timestamp of the last flushed autosave — surfaced in the footer. */
  const [lastAutosave, setLastAutosave] = useState<Date | null>(null);

  // Keyboard: Cmd/Ctrl+S save (.yaml), +Shift save JSON, O open, N new.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === 's') {
        e.preventDefault();
        void saveBlueprint(e.shiftKey ? 'json' : 'yaml');
      } else if (key === 'o' && !isTyping(e.target)) {
        e.preventDefault();
        flowOpen();
      } else if (key === 'n' && !isTyping(e.target)) {
        e.preventDefault();
        flowNew();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [saveBlueprint, flowOpen, flowNew]);

  // Browser refresh/close guard while unsaved work exists.
  useEffect(() => {
    if (!bp.dirty) return;
    const onLeave = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onLeave);
    return () => window.removeEventListener('beforeunload', onLeave);
  }, [bp.dirty]);

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

  /** Lane-tint AA warnings, keyed by lane id — the lane list's fix path. */
  const tintWarnings = useMemo(() => {
    const byLane: Record<string, { ratio: number; suggestionBg?: string }> = {};
    for (const f of bp.findings) {
      // Both card-text and stage-tag pairs name the lane they fail on; both
      // are tint-locally fixable (the shared ink stays, the tint moves).
      const m = /^(?:Card text|Card stage tag) \((.+) lane tint\)$/.exec(f.element);
      if (m && !f.aa) {
        byLane[m[1]] = { ratio: f.ratio, suggestionBg: f.bg_suggestion };
      }
    }
    return byLane;
  }, [bp.findings]);

  // Ready-to-fill distinction for the Structure light: empty-slot titles are
  // EXPECTED work, not breakage — only structural errors read as an error LED.
  const slotCount = useMemo(
    () => bp.issues.filter((i) => i.severity === 'error' && i.code === 'card_title_required').length,
    [bp.issues],
  );
  const structuralCount = errorCount - slotCount;

  // AA-validated swatches: each curated tint is checked LIVE against the
  // theme's card text through the engine's contrast math — only passing
  // colors render as pickable, so tint selection can never produce a failing
  // pair. The verdicts ride to the panel as data (presentational purity).
  const inkStrong = bp.doc?.theme?.['ink_strong'] ?? '#131b45';
  const [tintVerdicts, setTintVerdicts] = useState<Record<string, { pass: boolean; ratio: number }>>({});
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const entries = await Promise.all(
        LANE_TINT_SWATCHES.map(async (s) => {
          try {
            const ratio = await engine.contrast(inkStrong, s.hex);
            return [s.hex, { pass: ratio >= 4.5, ratio: Math.round(ratio * 100) / 100 }] as const;
          } catch {
            return [s.hex, { pass: false, ratio: 0 }] as const;
          }
        }),
      );
      if (!cancelled) setTintVerdicts(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, [inkStrong]);

  const statusItems: StatusItem[] = useMemo(() => {
    const engineReady = bp.engineReady && !bp.renderError;
    return [
      {
        id: 'autosave',
        label: 'Autosave',
        icon: Clock,
        led: lastAutosave ? 'success' : 'neutral',
        value: lastAutosave
          ? lastAutosave.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          : 'Pending',
        tooltip: [
          lastAutosave
            ? `last flushed ${lastAutosave.toLocaleTimeString()} — restored on reload`
            : 'waiting for the first change',
          'kept in this browser; a Save writes the real file',
        ],
      },
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
        tooltip:
          bp.format === 'wordpress'
            ? [
                'wordpress: embed fragment (h2, no shell)',
                'built for a Custom HTML block — paste where the blueprint belongs',
                'the fragment self-styles; your site\'s theme supplies the page chrome',
                'no custom plugin needed',
              ]
            : [
                'standalone: full document (h1)',
                'fully self-contained — publish or share the file as-is',
              ],
      },
      {
        id: 'validation',
        label: 'Structure',
        icon: CheckSquare,
        led: bp.issues.length === 0 ? 'success' : structuralCount > 0 ? 'error' : 'warning',
        value:
          bp.issues.length === 0
            ? 'Valid'
            : structuralCount > 0
              ? `${errorCount}E ${warningCount}W`
              : slotCount > 0
                ? `${slotCount} to fill`
                : `${warningCount}W`,
        tooltip:
          bp.issues.length === 0
            ? ['document shape complete', 'every lane has one card per stage']
            : structuralCount > 0
              ? bp.issues.slice(0, 3).map((i) => `${i.severity === 'error' ? 'E' : 'W'} ${i.message}`)
              : [
                  `${slotCount} card slot${slotCount === 1 ? '' : 's'} await${slotCount === 1 ? 's' : ''} a title`,
                  'click a dashed card on the canvas to fill it',
                  'the preview unlocks when every slot has a title',
                ],
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
  }, [bp.engineReady, bp.renderError, bp.issues, bp.findings, bp.format, errorCount, warningCount, lintFailures, structuralCount, slotCount, lastAutosave]);

  // The chip dot's state (owner semantics): GREEN = the work is covered —
  // either by a file Save or by the autosave's flush; AMBER = genuinely
  // unprotected (the pre-flush window / a failed flush). 'File pending' is
  // still true (Save stays enabled) and lives in the tooltip — it no longer
  // wears the dot.
  const dotState: 'covered' | 'unprotected' = !bp.dirty ? 'covered' : lastAutosave ? 'covered' : 'unprotected';

  const docStem = sourceName
    ? stripExtension(sourceName)
    : bp.doc
      ? slugifyTitle(bp.doc.meta.title)
      : null;

  return (
    <div
      className="dark flex flex-col h-screen bg-midnight text-gray-200 font-sans overflow-hidden"
      data-phoenix-theme="tekton-dark"
    >
      {/* Standalone brand bar — PIN hosts replace it with their own chrome */}
      {!isPinModuleHost() && (
        <AppHeader docName={docStem} dirty={bp.dirty} format={bp.format} lastAutosave={lastAutosave} dotState={dotState} />
      )}

      <div className="flex-1 flex min-h-0">
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
        onNew={flowNew}
        onOpen={flowOpen}
        onSave={flowSave}
        onSaveJson={flowSaveJson}
        canSave={bp.dirty && bp.doc !== null}
        onExport={() => void exportBlueprint()}
        canExport={bp.html !== null}
      />


      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar (PIN-style slim header): OUTPUT controls only — document
            identity moved to the app header (standalone) */}
        <div className="h-12 flex items-center gap-3 px-4 border-b border-gray-700 bg-gray-900 shrink-0">
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
          <div className="flex bg-gray-800 rounded-md border border-gray-700 overflow-hidden" role="group" aria-label="Data layer">
            <button
              type="button"
              className={`px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                dataFormat === 'yaml' ? 'bg-brand-secondary text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
              onClick={() => setDataFormat('yaml')}
            >
              Data: YAML
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 text-[11px] font-semibold transition-colors border-l border-gray-700 ${
                dataFormat === 'json' ? 'bg-brand-secondary text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
              onClick={() => setDataFormat('json')}
            >
              JSON
            </button>
          </div>
          <span className="ml-auto text-[10px] text-gray-500 font-mono">
            {view === 'build' ? 'click a card to edit · Esc closes' : 'live engine render'}
          </span>
        </div>

        {/* Workspace — the AA render gate blocks the PREVIEW (and Export) only:
            the build canvas stays up so the offending color stays editable */}
        {/* Content band — the slide-in panel and the canvas are SIBLINGS of
            one height: the panel is CONTAINED between the toolbar above and
            the terminal/footer below; it never spans them. `relative` makes
            the band the positioning context for the card inspector drawer
            (Penpot spec: the drawer shares the band's exact height). */}
        <div className="flex-1 flex min-h-0 relative">
          <ExpandablePanel
            section={panelSection}
            width={
              panelSection
                ? clampPanelWidth(profile.panelWidths[panelSection] ?? PANEL_DEFAULTS[panelSection])
                : PANEL_DEFAULTS.architect
            }
            defaultWidth={panelSection ? PANEL_DEFAULTS[panelSection] : PANEL_DEFAULTS.architect}
            onWidthResize={(w) => panelSection && resizePanel(panelSection, w)}
            title={
              panelSection === 'yaml'
                ? 'YAML Source'
                : panelSection === 'new'
                  ? 'New Blueprint'
                  : panelSection === 'theme'
                    ? 'Theme Colors'
                    : 'Visual Architect'
            }
            blurb={
              panelSection === 'yaml'
                ? 'The headless format — author the blueprint without the visual editor; this document IS the blueprint.'
                : panelSection === 'new'
                  ? 'Begin from a template, a worked example, or shape your own.'
                  : panelSection === 'theme'
                    ? 'Every color the rendered blueprint emits — edits re-lint the WCAG gate live.'
                    : 'Structure the blueprint: metadata, stages, and lanes.'
            }
            onClose={() => setPanelSection(null)}
          >
            {panelSection === 'theme' && (
              <>
                <ThemeEditor
                  theme={bp.doc?.theme ?? {}}
                  onThemeChange={bp.setTheme}
                  onApplyPreset={bp.applyThemePreset}
                />
                {bp.presetNotice && (
                  <p className="tk-preset-note" role="status" data-testid="preset-notice">
                    {bp.presetNotice}
                  </p>
                )}
              </>
            )}

            {panelSection === 'architect' && bp.doc && (
              <VisualArchitect
                eyebrow={bp.doc.meta.eyebrow}
                title={bp.doc.meta.title}
                intro={bp.doc.meta.intro}
                stages={bp.doc.stages}
                lanes={bp.doc.lanes}
                tintWarnings={tintWarnings}
            swatchVerdicts={tintVerdicts}
                onMetaChange={bp.setMeta}
                onStageChange={bp.setStage}
                onStageAdd={bp.addStage}
                onStageRemove={bp.removeStage}
                onLaneChange={bp.setLane}
                onLaneAdd={bp.addLane}
                onLaneRemove={bp.removeLane}
              />
            )}
            {panelSection === 'new' && (
              <div className="tk-new-picker">
                {TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    className="tk-template-card"
                    onClick={() => pickTemplate(template.id)}
                  >
                    <span className="tk-template-name">{template.name}</span>
                    <span className="tk-template-hint">{template.hint}</span>
                  </button>
                ))}
                <button
                  type="button"
                  className="tk-template-card"
                  onClick={() => {
                    setPanelSection(null);
                    setWizardOpen(true);
                  }}
                >
                  <span className="tk-template-name">From scratch</span>
                  <span className="tk-template-hint">
                    A setup wizard: name it, choose the stages and lanes — card slots stay for you to fill.
                  </span>
                </button>
              </div>
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
        <main className="flex-1 flex flex-col min-h-0 relative">
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {view === 'build' ? (
              bp.doc ? (
                <>
                  {gateInfo && (
                    gateInfo.tone === 'ready' ? (
                      <div className="tk-info m-5 mb-0" role="status" data-testid="fill-banner">
                        {gateInfo.text}
                      </div>
                    ) : (
                      <div className="tk-error m-5 mb-0" role="alert" data-testid="render-error">
                        <strong>Preview gated:</strong> {gateInfo.text}
                      </div>
                    )
                  )}
                  <CanvasViewport
                    fitKey={`${bp.doc.stages.length}x${bp.doc.lanes.length}`}
                  >
                    <BuildCanvas
                      doc={bp.doc}
                      selectedCard={selectedCard}
                      onSelectCard={handleSelectCard}
                    />
                  </CanvasViewport>
                </>
              ) : (
                <p className="tk-loading">loading…</p>
              )
            ) : gateInfo ? (
              gateInfo.tone === 'ready' ? (
                <div className="tk-info m-5" role="status" data-testid="fill-banner">
                  {gateInfo.text}
                </div>
              ) : (
                <div className="tk-error m-5" role="alert" data-testid="render-error">
                  <strong>Preview gated:</strong> {gateInfo.text}
                </div>
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

        </main>
        {/* Card inspector — a child of the band: shares its exact height
            (below the toolbar, above the terminal/footer — the Penpot spec) */}
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

        {/* Docked lint terminal — below the band: full-width, and the
            panel’s bottom edge stops exactly at its top */}

          <LintTerminal
            findings={bp.findings}
            issues={bp.issues}
            open={terminalOpen}
            onToggle={() => setTerminalOpen((v) => !v)}
            onFixIssue={fixIssue}
          />

        {/* status footer — the PIN pattern, taller (44px): ALL status lights live
            here, including the engine connection light (moved out of the nav) */}
        <StatusFooter
          brand="Phoenix Tekton · 2026 · Build 0.1.0"
          context={bp.doc?.meta.eyebrow ?? '—'}
          items={statusItems}
        />
      </div>
      </div>

      {/* Modal dialogs — the PIN-family pattern, never native confirm/alert.
          The boot invitation sits ABOVE the app chrome; opening the wizard
          replaces it. */}
      <WelcomeModal
        isOpen={inviteOpen}
        onStartWizard={() => {
          setInviteOpen(false);
          setWizardOpen(true);
        }}
        onStartWithTemplate={(templateId) => {
          setInviteOpen(false);
          startFromTemplate(templateId);
        }}
        onDismiss={(neverAgain) => {
          setInviteOpen(false);
          if (neverAgain) updateProfile({ showSetupOnStart: false });
        }}
      />
      <SetupWizardModal
        isOpen={wizardOpen}
        onCreate={createFromWizard}
        onCancel={() => setWizardOpen(false)}
      />
      <ConfirmationModal
        isOpen={dialog !== null}
        title={dialog?.title ?? ''}
        message={dialog?.message ?? ''}
        variant={dialog?.kind === 'confirm' ? 'danger' : 'warning'}
        okOnly={dialog?.kind === 'error'}
        confirmText={dialog?.kind === 'confirm' ? 'Discard' : 'OK'}
        cancelText="Keep editing"
        onConfirm={() => {
          const d = dialog;
          setDialog(null);
          if (d?.kind === 'confirm') d.action();
        }}
        onCancel={() => setDialog(null)}
      />
    </div>
  );
}