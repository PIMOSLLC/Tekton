import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearPreview, exportsPreviewHtml, pushPreview } from './previewSource';

describe('previewSource seam', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
  });

  it('a browser host carries no bridge — the srcDoc preview path stays intact', async () => {
    expect(exportsPreviewHtml()).toBe(false);
    expect(await pushPreview('<html>artifact</html>')).toBeNull();
    await expect(clearPreview()).resolves.toBeUndefined();
  });

  it('the desktop shell hands the artifact over IPC and answers with the no-CSP scheme route', async () => {
    const invoke = vi.fn().mockResolvedValue(undefined);
    const convertFileSrc = vi.fn(
      (filePath: string, protocol: string) => `${protocol}://localhost/${filePath}`,
    );
    (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = { invoke, convertFileSrc };

    expect(exportsPreviewHtml()).toBe(true);

    const url = await pushPreview('<html>artifact</html>');
    expect(invoke).toHaveBeenCalledWith('set_preview_html', { html: '<html>artifact</html>' });
    expect(url).toMatch(/^blueprint-preview:\/\/localhost\/\?rev=\d+$/);

    await clearPreview();
    expect(invoke).toHaveBeenCalledWith('clear_preview_html');
  });

  it('the handover happens BEFORE the URL is returned — the route never serves a stale render', async () => {
    const order: string[] = [];
    const invoke = vi.fn(async () => {
      order.push('ipc');
    });
    (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {
      invoke,
      convertFileSrc: () => 'blueprint-preview://localhost/',
    };
    await pushPreview('<html>artifact</html>');
    expect(order).toEqual(['ipc']);
  });
});