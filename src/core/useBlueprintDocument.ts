import { useCallback, useEffect, useRef, useState } from 'react';
import { engine, type OutputFormat } from '../engine/engineService';
import type { EngineFinding, EngineIssue } from '../engine/engineServiceTypes';
import type { BlueprintDocument } from '../types';

const DEBOUNCE_MS = 150;
const YAML_COMMIT_MS = 500;

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'stage';

/**
 * useBlueprintDocument — the platform-agnostic editor CORE.
 *
 * Everything a shell needs to author a blueprint lives here: document state
 * (single source of truth = the Rust model via wasm), the engine pipeline
 * (serialize → render/lint/validate, debounced), structured edit operations,
 * and the YAML buffer (the headless authoring format — a blueprint can be
 * written entirely without the visual editor, by hand or with the `tekton`
 * CLI; the visual editor is a view of this same document).
 *
 * Platform shells (web today, Tauri desktop and the Phoenix Insight Nexus
 * toolkit module later) compose this hook plus presentational components —
 * nothing in this file may import platform APIs.
 */
export function useBlueprintDocument(initialYaml: string) {
  const [doc, setDoc] = useState<BlueprintDocument | null>(null);
  const [format, setFormat] = useState<OutputFormat>('standalone');
  const [yamlText, setYamlText] = useState<string>(initialYaml);
  const yamlFocused = useRef(false);

  const [html, setHtml] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [findings, setFindings] = useState<EngineFinding[]>([]);
  const [issues, setIssues] = useState<EngineIssue[]>([]);
  const [engineReady, setEngineReady] = useState(false);

  // Boot: parse the initial document through the Rust model.
  useEffect(() => {
    let cancelled = false;
    engine
      .parse(initialYaml)
      .then((parsed) => {
        if (!cancelled) {
          setDoc(parsed);
          setEngineReady(true);
        }
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
  }, [initialYaml]);

  /** Structured edits — clone, mutate, replace. */
  const updateDoc = useCallback((mutate: (draft: BlueprintDocument) => void) => {
    setDoc((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      mutate(next);
      return next;
    });
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

  const commitYaml = useCallback((text: string) => {
    engine
      .parse(text)
      .then(setDoc)
      .catch(() => {
        /* keep editing; the render gate reports the error */
      });
  }, []);

  /** YAML buffer editing (debounced commit back into the document). */
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
        d.stages.push({ id: slugify(name), name, blurb: '' });
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

  const addLane = useCallback(
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
    // YAML buffer
    yamlText,
    onYamlChange,
    onYamlFocus,
    onYamlBlur,
  };
}