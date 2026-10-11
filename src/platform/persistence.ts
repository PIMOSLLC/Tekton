/**
 * Platform persistence adapters — the ONLY place the editor learns how
 * documents are stored. The shell composes these with the core hook; the hook
 * itself never touches a file, a dialog, or a database. Later phases swap
 * these implementations behind the same interfaces:
 *
 *  - Tauri desktop: native Save/Open via tauri-plugin-dialog + fs.
 *  - Phoenix Insight Nexus: the document is written INTO the existing
 *    `toolkit_instances` JSONB row (`tool = 'blueprint'`) through the generic
 *    `/toolkit/:projectId/toolkit/:tool` endpoint — no new tables, no new
 *    per-module routes (the PIN contract). `toolkit_snapshots` doubles as
 *    version history. The structured JSON (`getJson()` output) is the row's
 *    payload shape.
 *
 * This file is the browser-mode stand-in: file download/upload plus a
 * localStorage workspace autosave.
 */

export type BlueprintFileFormat = 'yaml' | 'json';

export interface OpenedBlueprintFile {
  /** File name as chosen by the user (e.g. "My Plan.yaml"). */
  name: string;
  /** Raw file text; YAML and JSON both parse through the engine. */
  text: string;
  format: BlueprintFileFormat;
}

export interface BlueprintFileStore {
  /** Write the document text out under the given file name. */
  saveFile(name: string, text: string): Promise<void>;
  /** Pick + read a .yaml/.yml/.json file. Resolves null when cancelled. */
  openFile(): Promise<OpenedBlueprintFile | null>;
}

export interface WorkspaceSnapshot {
  /** The file name behind the current work (null = not yet saved/opened). */
  sourceName: string | null;
  /** Canonical YAML of the work — the recall seed for the next boot. */
  yaml: string;
}

export interface WorkspaceAutosave {
  remember(snapshot: WorkspaceSnapshot): void;
  /** The last remembered snapshot, or null when nothing is stored. */
  recall(): WorkspaceSnapshot | null;
  forget(): void;
}

/**
 * Browser-only workspace key. Deliberately distinct from the future PIN
 * storage key (`blueprint`): recall here restores local unsaved work across a
 * refresh, while PIN persistence writes the document into Postgres.
 * (Tauri's localStorage keeps working, so this survives there too.)
 */
export const AUTOSAVE_KEY = 'tekton.workspace';

export type FilePicker = (accept: string) => Promise<File | null>;

const YAML_NAME = /\.ya?ml$/i;

const extensionFormat = (name: string): BlueprintFileFormat =>
  YAML_NAME.test(name) ? 'yaml' : 'json';

const defaultFilePicker: FilePicker = (accept) =>
  new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.addEventListener('change', () => resolve(input.files?.[0] ?? null));
    input.click();
  });

/** Browser file store: Save = download; Open = native file picker. */
export function browserFileStore(pick: FilePicker = defaultFilePicker): BlueprintFileStore {
  return {
    async saveFile(name, text) {
      // Download via object URL — the same pattern the editor's Export HTML
      // uses. (Native dialog save arrives with the Tauri shell.) MIME matches
      // the extension so text/plain never mints a .txt-named artifact.
      const mime = /\.json$/i.test(name)
        ? 'application/json'
        : 'text/yaml;charset=utf-8';
      const blob = new Blob([text], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    },
    async openFile() {
      const file = await pick('.yaml,.yml,.json');
      if (!file) return null;
      return {
        name: file.name,
        text: await file.text(),
        format: extensionFormat(file.name),
      };
    },
  };
}

/** localStorage workspace autosave (guarded — private mode must not crash). */
export function localStorageAutosave(): WorkspaceAutosave {
  return {
    remember(snapshot) {
      try {
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(snapshot));
      } catch {
        /* storage unavailable — autosave is best-effort */
      }
    },
    recall() {
      try {
        const raw = localStorage.getItem(AUTOSAVE_KEY);
        if (!raw) return null;
        const parsed: unknown = JSON.parse(raw);
        if (
          parsed &&
          typeof parsed === 'object' &&
          'yaml' in parsed &&
          typeof (parsed as { yaml: unknown }).yaml === 'string' &&
          'sourceName' in parsed &&
          ((parsed as { sourceName: unknown }).sourceName === null ||
            typeof (parsed as { sourceName: unknown }).sourceName === 'string')
        ) {
          return parsed as WorkspaceSnapshot;
        }
        return null;
      } catch {
        return null;
      }
    },
    forget() {
      try {
        localStorage.removeItem(AUTOSAVE_KEY);
      } catch {
        /* harmless */
      }
    },
  };
}