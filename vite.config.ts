/// <reference types="vitest" />
import { defineConfig, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

// Host + port: the dev server binds 0.0.0.0 so a desktop browser on the same
// network reaches it at http://<this-host>:6041 — 6041 is the editor's fixed
// dev port.

// ALPHA logging contract (owner direction): runtime errors from editor sessions
// land in logs/runtime.log. index.html's beacon posts here; Vite's dev log is
// mirrored to logs/dev-server.log by scripts/dev-server.sh. Headless build
// hosts have no console to read — these files are how agent sessions "see" the browser.
function runtimeErrorCollector(): { name: string; configureServer(server: ViteDevServer): void } {
  const logDir = join(__dirname, 'logs');
  const logFile = join(logDir, 'runtime.log');
  return {
    name: 'tekton-runtime-error-collector',
    configureServer(server) {
      mkdirSync(logDir, { recursive: true });
      server.middlewares.use('/__tekton-error', (req, res) => {
        let body = '';
        req.on('data', (chunk: Buffer) => (body += chunk));
        req.on('end', () => {
          const line = `[${new Date().toISOString()}] ${body || '(empty error beacon)'}\n`;
          try {
            appendFileSync(logFile, line);
          } catch {
            /* logging must never break the dev server */
          }
          res.statusCode = 204;
          res.end();
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), runtimeErrorCollector()],
  server: {
    host: '0.0.0.0',
    port: 6041,
    strictPort: true,
  },
  test: {
    environment: 'happy-dom',
    globals: true,
  },
});