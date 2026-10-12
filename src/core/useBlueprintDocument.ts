import { useCallback, useEffect, useRef, useState } from 'react';
import { engine, type OutputFormat } from '../engine/engineService';
import type { EngineFinding, EngineIssue } from '../engine/engineServiceTypes';
import type { BlueprintDocument } from '../types';
import { findTemplate } from './templates';

const DEBOUNCE_MS = 150;
const YAML_COMMIT_MS = 500;

/** Title → file-safe base name (Save/Open naming derives from `meta.title`. */
export function slugifyTitle(s: string): string {
  return (
    s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'blueprint'
  );
}

/** Result of document-level loads (Open / New) — the shell surfaces the error. */
export type LoadResult = { ok: true } | { ok: false; error: string };

/** The setup wizard's shape: meta + counts. Cards are NOT authored here — a
 * wizard can't invent them; they land as empty slots the canvas highlights
 * (dashed amber) and the inspector fills one by one. */
export interface BlueprintSetup {
  meta: { eyebrow: string; title: string; intro: string };
  stages: { name: string; blurb?: string }[];
  lanes: { name: string; kind?: BlueprintDocument['lanes'][number]['kind'] }[];
}

/** Dedupe slugs with a numeric suffix (the addLane discipline, generalized). */
function uniqueIds(raw: string[]): string[] {
  const seen = new Set<string>();
  return raw.map((id) => {
    let final = id;
    let n = 2;
    while (seen.has(final)) final = `${id}-${n++}`;
    seen.add(final);
    return final;
  });
}

export interface UseBlueprintDocumentOptions {
  /**
   * Whether a successfully parsed boot document counts as saved. True for the
   * bundled fixture; false when the shell boots from a recalled autosave —
   * restored work IS unsaved work, so the editor starts dirty and prompts
   * for Save.
   */
  bootClean?: boolean;
}

/**
 * useBlueprintDocument — the platform-agnostic editor CORE.
 *
 * Everything a shell needs to author a blueprint lives here: document state
 * (single source of truth = the Rust model via wasm), the engine pipeline
 * (serialize → render/lint/validate, debounced), structured edit operations,
 * document lifecycle (New / Open / Save snapshots + dirty tracking), and the
 * YAML buffer (the headless authoring format — a blueprint can be written
 * entirely without the visual editor, by hand or with the `tekton` CLI; the
 * visual editor is a view of this same document).
 *
 * Platform shells (web today, Tauri desktop and the Phoenix Insight Nexus
 * toolkit module later) compose this hook plus presentational components —
 * nothing in this file may import platform APIs. Persisting (files, storage,
 * PIN's toolkit_instances row) is the shell's job via its own adapters.
 */
export function useBlueprintDocument(initialYaml: string, options?: UseBlueprintDocumentOptions) {
  const [doc, setDoc] = useState<BlueprintDocument | null>(null);
  const [format, setFormat] = useState<OutputFormat>('standalone');
  const [yamlText, setYamlText] = useState<string>(initialYaml);
  const yamlFocused = useRef(false);

  const [html, setHtml] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [findings, setFindings] = useState<EngineFinding[]>([]);
  const [issues, setIssues] = useState<EngineIssue[]>([]);
  const [engineReady, setEngineReady] = useState(false);

  // Dirty tracking: every edit bumps `rev`; the shell snapshots `savedRev` on
  // a successful Save (or lifecycle op that establishes a new baseline).
  const [rev, setRev] = useState(0);
  const [savedRev, setSavedRev] = useState(0);
  const revRef = useRef(0);
  const savedRevRef = useRef(0);
  const dirty = rev !== savedRev;

  const bump = useCallback(() => {
    revRef.current += 1;
    setRev(revRef.current);
  }, []);

  /** Establishes the current document state as the saved baseline. */
  const markSaved = useCallback(() => {
    savedRevRef.current = revRef.current;
    setSavedRev(revRef.current);
  }, []);

  // Mirror for async reads (Save/Open flows run outside the render cycle).
  const docRef = useRef<BlueprintDocument | null>(null);
  const bootCleanRef = useRef(options?.bootClean ?? true);

  // Boot: parse the seed document (fixture, or an autosave recall — YAML or
  // JSON) through the Rust model. `initialYaml` is a boot seed: changing it
  // reboots the document, so callers keep it stable.
  useEffect(() => {
    let cancelled = false;
    engine
      .loadSource(initialYaml)
      .then((parsed) => {
        if (cancelled) return;
        docRef.current = parsed;
        setDoc(parsed);
        setEngineReady(true);
        if (!bootCleanRef.current) bump(); // restored autosave = unsaved work
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setRenderError(e instanceof Error ? e.message : String(e));
          setEngineReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [initialYaml, bump]);

  /**
   * Structured edits — clone, mutate, replace. Mutates the docRef mirror
   * synchronously (dirty tracking must flip immediately; React's deferred
   * setDoc updater would hide it until the next render) and pushes the new
   * document into state.
   */
  const updateDoc = useCallback((mutate: (draft: BlueprintDocument) => void) => {
    const prev = docRef.current;
    if (!prev) return;
    const next = structuredClone(prev);
    mutate(next);
    docRef.current = next;
    setDoc(next);
    revRef.current += 1;
    setRev(revRef.current);
  }, []);

  // Structured edits refresh the YAML buffer unless the author is editing it.
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

  const commitYaml = useCallback(
    (text: string) => {
      engine
        .loadSource(text)
        .then((parsed) => {
          docRef.current = parsed;
          setDoc(parsed);
          bump();
        })
        .catch(() => {
          /* keep editing; the render gate reports the error */
        });
    },
    [bump],
  );

  /** YAML buffer editing (debounced commit back into the document). */
  useEffect(() => {
    if (!yamlFocused.current) return;
    const t = setTimeout(() => commitYaml(yamlText), YAML_COMMIT_MS);
    return () => clearTimeout(t);
  }, [yamlText, commitYaml]);

  // Engine pipeline: doc → serialize → render + lint + validate (debounced).
  // allSettled, not all: when the render gate blocks (AA failure), the lint
  // and validation results must STILL land — the terminal and status lights
  // are how the author sees (and fixes) the failing pair.
  useEffect(() => {
    if (!doc) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      const results = await Promise.allSettled([
        (async () => engine.render(await engine.serialize(doc), format))(),
        (async () => engine.lint(await engine.serialize(doc)))(),
        (async () => engine.validate(await engine.serialize(doc)))(),
      ]);
      if (cancelled) return;
      const [rendered, lintResult, validation] = results;
      if (lintResult.status === 'fulfilled') setFindings(lintResult.value.findings);
      if (validation.status === 'fulfilled') setIssues(validation.value.issues);
      const rejected = results.find((r) => r.status === 'rejected');
      if (!rejected) {
        setHtml((rendered as PromiseFulfilledResult<string>).value);
        setRenderError(null);
      } else {
        setHtml(null);
        const reason = (rejected as PromiseRejectedResult).reason;
        setRenderError(reason instanceof Error ? reason.message : String(reason));
      }
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [doc, format]);

  // ── Document lifecycle (New / Open / Save) ────────────────────────────────

  /**
   * Replace the whole document from source text (YAML or JSON). Used by Open
   * and by autosave recall. A successful load establishes the new baseline —
   * `clean: false` (recall) leaves the editor dirty instead.
   */
  const loadSource = useCallback(
    async (text: string, opts?: { clean?: boolean }): Promise<LoadResult> => {
      const clean = opts?.clean ?? true;
      try {
        const parsed = await engine.loadSource(text);
        docRef.current = parsed;
        setDoc(parsed);
        revRef.current += 1;
        setRev(revRef.current);
        if (clean) {
          savedRevRef.current = revRef.current;
          setSavedRev(revRef.current);
        }
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
      }
    },
    [],
  );

  /**
   * New: start a fresh doc from a registered template (default: the starter).
   * A successful load establishes the new baseline — clean slate.
   */
  const newDocument = useCallback(
    async (templateId: string = 'starter'): Promise<LoadResult> => {
      const template = findTemplate(templateId) ?? findTemplate('starter');
      if (!template) return { ok: false, error: `No template "${templateId}" is registered.` };
      return loadSource(template.yaml);
    },
    [loadSource],
  );

  /**
   * New from the setup wizard: build the document EXACTLY as shaped — authored
   * names, chosen stage count, chosen lanes with kinds — and load it clean.
   * Card titles are empty on purpose: the grid contract's empty slots are the
   * visible work list (canvas marks them, the terminal's fix buttons land on
   * them); never silently fill content the author did not write.
   */
  const createFromSetup = useCallback(
    async (setup: BlueprintSetup): Promise<LoadResult> => {
      const stageIds = uniqueIds(setup.stages.map((s) => slugifyTitle(s.name) || 'stage'));
      const laneIds = uniqueIds(setup.lanes.map((l) => slugifyTitle(l.name) || 'lane'));
      const doc: BlueprintDocument = {
        meta: setup.meta,
        stats: [],
        stages: setup.stages.map((s, i) => ({ id: stageIds[i], name: s.name, blurb: s.blurb ?? '' })),
        lanes: setup.lanes.map((l, i) => ({
          id: laneIds[i],
          name: l.name,
          kind: l.kind,
          interpretation: '',
          cards: setup.stages.map(() => ({ title: '', blurb: '' })),
        })),
      };
      try {
        const yaml = await engine.serialize(doc);
        return await loadSource(yaml);
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
      }
    },
    [loadSource],
  );

  /** The authoritative YAML for Save (the doc, canonicalized — not the buffer). */
  const getYaml = useCallback(async (): Promise<string> => {
    if (!docRef.current) throw new Error('No blueprint is loaded yet.');
    return engine.serialize(docRef.current);
  }, []);

  /** The structured JSON for Save-as-JSON (and the future PIN JSONB payload). */
  const getJson = useCallback(async (): Promise<string> => {
    if (!docRef.current) throw new Error('No blueprint is loaded yet.');
    return engine.toJson(docRef.current);
  }, []);

  // ── Structured edit operations ─────────────────────────────────────────
  const setMeta = useCallback(
    (field: 'eyebrow' | 'title' | 'intro', value: string) =>
      updateDoc((d) => {
        d.meta[field] = value;
      }),
    [updateDoc],
  );

  const setStage = useCallback(
    (index: number, field: 'name' | 'blurb', value: string) =>
      updateDoc((d) => {
        d.stages[index][field] = value;
      }),
    [updateDoc],
  );

  const addStage = useCallback(
    () =>
      updateDoc((d) => {
        const name = `Stage ${d.stages.length + 1}`;
        d.stages.push({ id: slugifyTitle(name), name, blurb: '' });
        for (const lane of d.lanes) lane.cards.push({ title: '', blurb: '' });
      }),
    [updateDoc],
  );

  const removeStage = useCallback(
    (index: number) =>
      updateDoc((d) => {
        if (d.stages.length <= 1) return;
        d.stages.splice(index, 1);
        for (const lane of d.lanes) lane.cards.splice(index, 1);
      }),
    [updateDoc],
  );

  const setLane = useCallback(
    (
      index: number,
      field: 'name' | 'blurb' | 'kind' | 'tint' | 'divider' | 'interpretation',
      value: string,
    ) =>
      updateDoc((d) => {
        const lane = d.lanes[index];
        if (field === 'kind') {
          lane.kind = value === '' ? undefined : (value as BlueprintDocument['lanes'][number]['kind']);
        } else if (field === 'divider') {
          // Separation line label attached to this lane; empty clears it.
          lane.divider = value === '' ? undefined : value;
        } else if (field === 'tint') {
          // Row color override; empty restores the kind's default tint.
          lane.tint = value === '' ? undefined : value;
        } else {
          lane[field] = value;
        }
      }),
    [updateDoc],
  );

  /** Theme tokens (wire keys, e.g. `band_bg`) — editing live-lints the WCAG gate. */
  const setTheme = useCallback(
    (key: string, value: string) =>
      updateDoc((d) => {
        d.theme = { ...(d.theme ?? {}), [key]: value };
      }),
    [updateDoc],
  );

  /** Status line from the last preset transaction (null until one runs). */
  const [presetNotice, setPresetNotice] = useState<string | null>(null);

  /**
   * Apply a shipped theme preset as ONE guarded transaction: the preset map
   * and the re-basing of stale lane-tint overrides land in the same commit —
   * no intermediate state where the old tints meet the new ink. An explicit
   * `lane.tint` is document data authored under the old theme; if it cannot
   * hold AA against the preset's card ink it would strand the document at
   * the render gate (warn + fix never ends in a dead end), so the override
   * reverts to the lane-kind default and the notice names what moved. Tints
   * that still pass are kept — user choices are never discarded blindly.
   */
  const applyThemePreset = useCallback(
    async (preset: Record<string, string>, label: string) => {
      const prev = docRef.current;
      if (!prev) return;
      // The card-text pair IS the render gate's pair; 4.5 = AA normal text.
      const ink = preset['ink_strong'] ?? prev.theme?.['ink_strong'] ?? '';
      const verdicts = prev.lanes.map((lane) => {
        if (!lane.tint || !ink) return Promise.resolve(false);
        return engine
          .contrast(ink, lane.tint)
          .then((ratio) => ratio < 4.5)
          .catch(() => true); // unparsable hex would fail the gate — re-base
      });
      const failing = await Promise.all(verdicts);
      const stale = prev.lanes
        .map((lane, i) => (failing[i] ? lane.name || lane.id : null))
        .filter((n): n is string => n !== null);
      updateDoc((draft) => {
        draft.theme = { ...(draft.theme ?? {}), ...preset };
        draft.lanes.forEach((lane, i) => {
          if (failing[i]) lane.tint = undefined;
        });
      });
      setPresetNotice(
        stale.length === 0
          ? `${label} applied — every lane tint holds AA.`
          : `${label} applied — ${stale.length} lane tint${stale.length === 1 ? '' : 's'} didn't hold AA against the new card ink and went back to the theme default (${stale.join(', ')}).`,
      );
    },
    [updateDoc],
  );

  const addLane = useCallback(
    () =>
      updateDoc((d) => {
        const name = `Lane ${d.lanes.length + 1}`;
        const id = slugifyTitle(name);
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

  const removeLane = useCallback(
    (index: number) =>
      updateDoc((d) => {
        if (d.lanes.length <= 1) return;
        d.lanes.splice(index, 1);
      }),
    [updateDoc],
  );

  const setCard = useCallback(
    (lane: number, stage: number, field: 'title' | 'blurb', value: string) =>
      updateDoc((d) => {
        d.lanes[lane].cards[stage][field] = value;
      }),
    [updateDoc],
  );

  const setInterpretation = useCallback(
    (lane: number, value: string) =>
      updateDoc((d) => {
        d.lanes[lane].interpretation = value;
      }),
    [updateDoc],
  );

  // ── YAML buffer controls (the headless format's editing surface) ───────
  const onYamlFocus = useCallback(() => {
    yamlFocused.current = true;
  }, []);
  const onYamlBlur = useCallback(() => {
    yamlFocused.current = false;
    commitYaml(yamlText);
  }, [commitYaml, yamlText]);
  const onYamlChange = useCallback((text: string) => setYamlText(text), []);

  return {
    // document + outputs
    doc,
    html,
    renderError,
    findings,
    issues,
    engineReady,
    format,
    setFormat,
    // lifecycle + dirty tracking (the shell's Save/Open/New wiring)
    dirty,
    markSaved,
    loadSource,
    newDocument,
    createFromSetup,
    getYaml,
    getJson,
    // structured edits
    setMeta,
    setStage,
    addStage,
    removeStage,
    setLane,
    addLane,
    removeLane,
    setCard,
    setInterpretation,
    setTheme,
    // guarded preset transaction (stale lane tints re-base, announced)
    presetNotice,
    applyThemePreset,
    // YAML buffer
    yamlText,
    onYamlChange,
    onYamlFocus,
    onYamlBlur,
  };
}