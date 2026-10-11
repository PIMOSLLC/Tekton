import { describe, expect, it } from 'vitest';
import {
  AUTOSAVE_KEY,
  browserFileStore,
  localStorageAutosave,
  type WorkspaceSnapshot,
} from './persistence';

describe('localStorageAutosave', () => {
  it('round-trips a snapshot across boots', () => {
    const ws = localStorageAutosave();
    expect(ws.recall()).toBeNull();
    ws.remember({ sourceName: 'My Plan.yaml', yaml: 'meta: …' });
    expect(ws.recall()).toEqual<WorkspaceSnapshot>({
      sourceName: 'My Plan.yaml',
      yaml: 'meta: …',
    });
    ws.forget();
    expect(ws.recall()).toBeNull();
  });

  it('treats corrupted and malformed snapshots as nothing to recover', () => {
    localStorage.setItem(AUTOSAVE_KEY, '{not json');
    expect(localStorageAutosave().recall()).toBeNull();
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ nonsense: true }));
    expect(localStorageAutosave().recall()).toBeNull();
    localStorage.setItem(
      AUTOSAVE_KEY,
      JSON.stringify({ sourceName: 7, yaml: 'meta: …' }),
    );
    expect(localStorageAutosave().recall()).toBeNull();
  });
});

describe('browserFileStore', () => {
  it('opens a YAML file and reports its format', async () => {
    const file = new File(['meta: …'], 'My Plan.yaml');
    const store = browserFileStore(async () => file);
    const opened = await store.openFile();
    expect(opened).toEqual({ name: 'My Plan.yaml', text: 'meta: …', format: 'yaml' });
  });

  it('recognizes .yml and .json by extension', async () => {
    const store = browserFileStore(async () => new File(['{}'], 'Plan.json'));
    expect(await store.openFile()).toMatchObject({ format: 'json' });
    const yml = browserFileStore(async () => new File(['meta: {}'], 'Plan.yml'));
    expect(await yml.openFile()).toMatchObject({ format: 'yaml' });
  });

  it('resolves null when the picker is dismissed', async () => {
    const store = browserFileStore(async () => null);
    await expect(store.openFile()).resolves.toBeNull();
  });

  it('saves by downloading through an anchor named for the file', async () => {
    const revoked: string[] = [];
    const originalCreate = URL.createObjectURL?.bind(URL);
    const originalRevoke = URL.revokeObjectURL?.bind(URL);
    URL.createObjectURL = () => 'blob:tekton-test';
    URL.revokeObjectURL = (url: string) => revoked.push(url);
    try {
      const store = browserFileStore();
      await store.saveFile('My Plan.yaml', 'meta: {eyebrow: e}');
      expect(revoked).toEqual(['blob:tekton-test']);
    } finally {
      if (originalCreate) URL.createObjectURL = originalCreate;
      else delete (URL as { createObjectURL?: unknown }).createObjectURL;
      if (originalRevoke) URL.revokeObjectURL = originalRevoke;
      else delete (URL as { revokeObjectURL?: unknown }).revokeObjectURL;
    }
  });
});