import { useEffect, useRef, useState } from 'react';
import { ModalCard } from './ModalCard';

export type SaveFormat = 'yaml' | 'json';

export interface SaveAsDialogProps {
  open: boolean;
  /** The offered name — the blueprint's slug (one keystroke from "save"). */
  initialName: string;
  /** The offered format — the format the workspace last targeted. */
  initialFormat: SaveFormat;
  onSave(name: string, format: SaveFormat): void;
  onCancel(): void;
}

/** The extension is ALWAYS appended from the chosen format: an extensionless
 * download once made the browser append .txt (the bug the naming rule
 * exists for). A typed ".yaml"/".json" is replaced, never doubled. */
export function withFormatExtension(stem: string, format: SaveFormat): string {
  const clean = stem.replace(/\.(ya?ml|json)$/i, '').trim();
  return `${clean || 'blueprint'}${format === 'json' ? '.json' : '.yaml'}`;
}

/**
 * SaveAsDialog — the deliberate copy: a name + format of the author's choice,
 * on the shared ModalCard frame (scrim, Esc-cancel, focus trap, topmost-key
 * rules). Copy semantics are stated in the dialog: the blueprint's own name
 * stays its title; later saves keep following the title.
 */
export function SaveAsDialog({ open, initialName, initialFormat, onSave, onCancel }: SaveAsDialogProps) {
  const [name, setName] = useState(initialName);
  const [format, setFormat] = useState<SaveFormat>(initialFormat);
  const input = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Re-offer the current slug + format each time the dialog OPENS — a
    // stale draft must not survive its cancel. The focus lands as a task:
    // the ModalCard's mount-focus (card first) runs before this child
    // effect completes, so the input is claimed after it settles.
    if (!open) return;
    setName(initialName);
    setFormat(initialFormat);
    const t = setTimeout(() => {
      input.current?.focus({ preventScroll: true });
      input.current?.select();
    }, 0);
    return () => clearTimeout(t);
  }, [open, initialName, initialFormat]);

  if (!open) return null;
  const valid = name.trim().length > 0;

  return (
    <ModalCard labelledBy="save-as-title" onEscape={onCancel}>
      <div className="p-6">
        <h2 id="save-as-title" className="text-sm font-bold text-gray-200 mb-1">
          Save a copy as…
        </h2>
        <p className="text-[11px] text-gray-500 mb-5">
          A copy under a name of your choice — the blueprint&apos;s own name stays
          its title, and later saves keep following the title.
        </p>
        <label className="tk-field">
          <span>File name</span>
          <span className="tk-field-help">Saved in the chosen data format.</span>
          <input
            ref={input}
            type="text"
            value={name}
            data-testid="save-as-name"
            aria-label="Save-as file name"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && valid) onSave(withFormatExtension(name, format), format);
            }}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <div className="flex bg-gray-900 rounded-md border border-gray-700 overflow-hidden w-fit my-4" role="group" aria-label="Copy format">
          {(['yaml', 'json'] as const).map((f, i) => (
            <button
              key={f}
              type="button"
              className={`px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                i > 0 ? 'border-l border-gray-700' : ''
              } ${format === f ? 'bg-brand-secondary text-white' : 'text-gray-400 hover:text-gray-200'}`}
              aria-pressed={format === f}
              onClick={() => setFormat(f)}
            >
              {f === 'yaml' ? 'YAML' : 'JSON'}
            </button>
          ))}
        </div>
        <p className="font-mono text-[10px] text-gray-500 mb-5" aria-live="polite">
          {withFormatExtension(name || '…', format)}
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="py-2.5 px-4 border border-gray-600 text-gray-300 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-gray-700 transition-all motion-reduce:transition-none"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!valid}
            className="py-2.5 px-4 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg bg-brand-secondary hover:brightness-110 transition-all active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100 disabled:opacity-45 disabled:cursor-not-allowed"
            onClick={() => onSave(withFormatExtension(name, format), format)}
          >
            Save the copy
          </button>
        </div>
      </div>
    </ModalCard>
  );
}