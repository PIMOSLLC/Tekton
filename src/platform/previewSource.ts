/**
 * Preview source — the ONLY place the editor learns how the preview reaches
 * the screen on each host. The rendered artifact ships its interaction layer
 * as a per-document inline script, so its CSP hash can never be pinned; an
 * srcdoc iframe INHERITS the host document's CSP, which leaves the desktop
 * shells (the exe, the appimage/rpm) refusing that script — a dead-static
 * preview that still works everywhere else (the CSP-free dev server, the
 * browser, the exported file).
 *
 * This seam hands the rendered HTML to the desktop shell over IPC
 * (`set_preview_html`) and answers with the shell's `blueprint-preview://`
 * route — a custom-protocol response carries no CSP and inherits nothing,
 * so the artifact keeps its interactions in every desktop bundle. The
 * browser host has no bridge and keeps the srcDoc path.
 *
 * Detection is scoped to `__TAURI_INTERNALS__` (present in every Tauri
 * webview) — deliberately NOT `isTauriHost`, so the engine service keeps its
 * wasm path in both hosts. On Windows the shell serves the scheme as
 * `http://blueprint-preview.localhost`, elsewhere as
 * `blueprint-preview://localhost` — `convertFileSrc` inside the internals is
 * the platform's own normalizer, borrowed rather than re-derived.
 */

type TauriInternals = {
  invoke(cmd: string, args?: Record<string, unknown>): Promise<unknown>;
  convertFileSrc(filePath: string, protocol: string): string;
};

const internals = (): TauriInternals | null =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
    ? ((window as unknown as { __TAURI_INTERNALS__: TauriInternals }).__TAURI_INTERNALS__)
    : null;

/** True when this host serves the preview through the desktop shell's
 * protocol route (the srcDoc path would be CSP-dead there). */
export const exportsPreviewHtml = (): boolean => internals() !== null;

/** Strictly monotonic frame-buster: each pushed render must actually
 * navigate, even two pushes within the same millisecond. */
let revision = 0;

/** Push the rendered HTML into the shell and return the no-CSP preview URL
 * for an iframe `src`. Null = browser host with no bridge; the caller keeps
 * the srcDoc iframe. */
export async function pushPreview(html: string): Promise<string | null> {
  const tauri = internals();
  if (!tauri) return null;
  await tauri.invoke('set_preview_html', { html });
  revision += 1;
  return `${tauri.convertFileSrc('', 'blueprint-preview')}?rev=${revision}`;
}

/** Empty the shell's preview slot — the gate holds nothing renderable. */
export async function clearPreview(): Promise<void> {
  const tauri = internals();
  if (!tauri) return;
  await tauri.invoke('clear_preview_html');
}