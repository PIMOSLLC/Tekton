/**
 * The standalone web shell's bootstrap: mount <App /> over index.html's #root.
 * Every other host composes its own entrance — PIN's toolkit host mounts its
 * own Layout with the editor inside, and Tauri's desktop webview loads this
 * exact page (the desktop exe embeds the built frontend behind a custom
 * protocol). Keep this file trivial: anything clever belongs in the shell layers.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const container = document.getElementById('root');
if (!container) {
  throw new Error('#root missing from index.html');
}
createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);