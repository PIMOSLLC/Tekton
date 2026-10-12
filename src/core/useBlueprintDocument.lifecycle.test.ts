import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useBlueprintDocument } from './useBlueprintDocument';
import { DARK_STUDIO_PRESET } from '../types';
import { SAMPLE_DOC, engineControls } from '../test-support/fakeEngine';
import type { BlueprintDocument } from '../types';

vi.mock('../engine/engineService', async () => {
  const { makeFakeEngine } = await import('../test-support/fakeEngine');
  return { engine: makeFakeEngine(), isTauriHost: false };
});

const SEED_YAML = 'meta:\n  eyebrow: boot\n  title: Boot seed\n  intro: i\n';

beforeEach(() => {
  engineControls.renderError = null;
});

async function bootEditor(options?: { bootClean?: boolean }) {
  const rendered = renderHook(() => useBlueprintDocument(SEED_YAML, options));
  await waitFor(() => expect(rendered.result.current.doc).not.toBeNull());
  return rendered;
}

describe('useBlueprintDocument lifecycle', () => {
  it('boots the seed document clean (engine parses through the model)', async () => {
    const { result } = await bootEditor();
    expect(result.current.engineReady).toBe(true);
    expect(result.current.doc?.meta.title).toBe('Sample Blueprint');
    expect(result.current.dirty).toBe(false);
  });

  it('boots dirty when the seed was recalled from autosave (bootClean: false)', async () => {
    const { result } = await bootEditor({ bootClean: false });
    expect(result.current.dirty).toBe(true);
  });

  it('tracks edits as unsaved work and markSaved relines the baseline', async () => {
    const { result } = await bootEditor();
    expect(result.current.dirty).toBe(false);
    act(() => result.current.setMeta('title', 'Renamed'));
    expect(result.current.dirty).toBe(true);
    act(() => result.current.markSaved());
    expect(result.current.dirty).toBe(false);
  });

  it('newDocument swaps in the starter document as a clean slate', async () => {
    const { result } = await bootEditor({ bootClean: false });
    expect(result.current.dirty).toBe(true);
    await act(async () => {
      await result.current.newDocument();
    });
    // The starter template replaces whatever was booted.
    expect(result.current.doc?.meta.title).toBe('Sample Blueprint');
    expect(result.current.dirty).toBe(false);
  });

  it('newDocument accepts a registered template id — the example lands clean too', async () => {
    const { result } = await bootEditor({ bootClean: false });
    await act(async () => {
      const r = await result.current.newDocument('agentic-ai-ecommerce');
      expect(r.ok).toBe(true);
    });
    expect(result.current.dirty).toBe(false);
  });

  it('loadSource accepts JSON source and lands clean', async () => {
    const { result } = await bootEditor();
    const json = JSON.stringify(SAMPLE_DOC, null, 2);
    await act(async () => {
      const r = await result.current.loadSource(json);
      expect(r.ok).toBe(true);
    });
    expect(result.current.doc).toEqual(SAMPLE_DOC);
    expect(result.current.dirty).toBe(false);
  });

  it('loadSource with clean:false leaves recalled work unsaved', async () => {
    const { result } = await bootEditor();
    await act(async () => {
      await result.current.loadSource('anything', { clean: false });
    });
    expect(result.current.dirty).toBe(true);
  });

  it('a failed load keeps the current document and reports the error', async () => {
    const { result } = await bootEditor();
    act(() => result.current.setMeta('title', 'Untouched'));
    await act(async () => {
      const r = await result.current.loadSource('{ not json');
      expect(r.ok).toBe(false);
    });
    expect(result.current.doc?.meta.title).toBe('Untouched');
  });

  it('setLane attaches and clears a separation line (divider)', async () => {
    const { result } = await bootEditor();
    act(() => result.current.setLane(0, 'divider', '— Line of interaction —'));
    expect(result.current.doc?.lanes[0]?.divider).toBe('— Line of interaction —');
    expect(result.current.dirty).toBe(true);
    act(() => result.current.setLane(0, 'divider', ''));
    expect(result.current.doc?.lanes[0]?.divider).toBeUndefined();
  });

  it('setTheme edits a token and setLane(…, tint) overrides the row color', async () => {
    const { result } = await bootEditor();
    act(() => result.current.setTheme('accent', '#ff0000'));
    expect(result.current.doc?.theme?.accent).toBe('#ff0000');
    expect(result.current.dirty).toBe(true);
    act(() => result.current.setLane(0, 'tint', '#eef2ff'));
    expect(result.current.doc?.lanes[0]?.tint).toBe('#eef2ff');
    act(() => result.current.setLane(0, 'tint', ''));
    expect(result.current.doc?.lanes[0]?.tint).toBeUndefined();
  });

  it('a render-gate failure still lands lint + validation results (allSettled contract)', async () => {
    engineControls.renderError =
      'render error: theme fails WCAG AA on 1 pair(s): Card text (customer lane tint)';
    try {
      const { result } = await bootEditor();
      await waitFor(() => expect(result.current.renderError).not.toBeNull());
      expect(result.current.html).toBeNull();
      // The gate never hides the lint/validate verdicts — the terminal and
      // the AA light stay live.
      expect(result.current.findings).toHaveLength(1);
      expect(result.current.issues).toEqual([]);
      expect(result.current.engineReady).toBe(true);
    } finally {
      engineControls.renderError = null;
    }
  });

  it('createFromSetup builds the exact shaped document and lands clean', async () => {
    const { result } = await bootEditor({ bootClean: false });
    const engineMod = await import('../engine/engineService');
    const ser = vi.spyOn(engineMod.engine, 'serialize');
    try {
      await act(async () => {
        const r = await result.current.createFromSetup({
          meta: { eyebrow: 'e', title: 'Wizard Title', intro: 'i' },
          stages: [{ name: 'One' }, { name: 'One' }, { name: 'Two' }],
          lanes: [{ name: 'Customer actions', kind: 'customer' }, { name: 'One' }],
        });
        expect(r.ok).toBe(true);
      });
      const shape = (
        ser.mock.calls.find(
          (c) => (c[0] as BlueprintDocument).meta?.title === 'Wizard Title',
        )?.[0] ?? null
      ) as BlueprintDocument | null;
      expect(shape).not.toBeNull();
      // Duplicate names get deduped ids; every lane matches the stage count.
      expect(shape?.stages.map((s) => s.id)).toEqual(['one', 'one-2', 'two']);
      expect(shape?.lanes).toHaveLength(2);
      expect(shape?.lanes[0]?.kind).toBe('customer');
      expect(shape?.lanes[0]?.cards).toHaveLength(3);
      expect(shape?.lanes[0]?.cards.every((c) => c.title === '')).toBe(true);
      expect(result.current.dirty).toBe(false);
    } finally {
      ser.mockRestore();
    }
  });

  it('getYaml and getJson expose authoritative save payloads', async () => {
    const { result } = await bootEditor();
    await expect(result.current.getYaml()).resolves.toBe('canonical yaml');
    const json = await result.current.getJson();
    expect(JSON.parse(json)).toEqual(SAMPLE_DOC);
  });

  it('a preset apply re-bases a lane tint that cannot hold the new card ink, and announces it', async () => {
    const { result } = await bootEditor();
    await act(async () => {
      result.current.setLane(0, 'tint', '#FFFFFF');
    });
    await act(async () => {
      await result.current.applyThemePreset(DARK_STUDIO_PRESET, 'Match the studio (dark)');
    });
    expect(result.current.doc?.theme?.['ink_strong']).toBe('#F1F5F9');
    expect(result.current.doc?.theme?.['surface']).toBe('#1F2937');
    // The stale light-artifact tint is gone: the lane falls to its kind default.
    expect(result.current.doc?.lanes[0]?.tint).toBeUndefined();
    expect(result.current.presetNotice).toContain("didn't hold AA");
    expect(result.current.presetNotice).toContain('Customer actions');
  });

  it('a preset apply keeps lane tints that hold AA under the new card ink', async () => {
    const { result } = await bootEditor();
    await act(async () => {
      result.current.setLane(0, 'tint', '#1F2937');
    });
    await act(async () => {
      await result.current.applyThemePreset(DARK_STUDIO_PRESET, 'Match the studio (dark)');
    });
    expect(result.current.doc?.lanes[0]?.tint).toBe('#1F2937');
    expect(result.current.presetNotice).toContain('every lane tint holds AA');
  });
});