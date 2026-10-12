import { Flame } from 'lucide-react';
import type { OutputFormat } from './engine/engineServiceTypes';

export interface AppHeaderProps {
  /** Document identity: the file stem, or the slugified title while unsaved. */
  docName: string | null;
  dirty: boolean;
  /** The live export format — mirrored in the header's right tag. */
  format: OutputFormat;
  /** When the workspace autosave last flushed (null = nothing yet). */
  lastAutosave: Date | null;
  /** covered = the work is protected (a file or the autosave); unprotected = amber. */
  dotState: 'covered' | 'unprotected';
}

/**
 * AppHeader — the standalone app's brand bar (owner direction: PIN embeds
 * Tekton as a toolkit module under PIN's own header; the standalone web +
 * desktop experiences need a full identity header of their own). It carries
 * ONLY brand + document identity — controls keep their homes (nav = document
 * lifecycle, toolbar = output format, footer = status lights) so no control
 * ever has two canonical locations. The App shell does not render it in
 * PIN-host mode (`__PIN_HOST__`), where PIN's chrome already sits on top.
 */
export function AppHeader({ docName, dirty, format, lastAutosave, dotState }: AppHeaderProps) {
  return (
    <header
      className="h-11 flex items-center gap-3 px-4 bg-gray-900 border-b border-gray-700 shrink-0"
      data-testid="app-header"
    >
      <div className="flex items-center gap-2 shrink-0">
        {/* Brand icon: flame until the PIN-branded application icon lands —
            the blueprint mark has its home in the rail only for now */}
        <Flame className="w-5 h-5 text-brand-secondary" aria-hidden="true" />
        <span className="text-xs font-bold tracking-widest text-white">PHOENIX TEKTON</span>
        <span className="hidden sm:block text-[9px] uppercase tracking-widest text-gray-500">
          Service Blueprint Studio
        </span>
      </div>
      <div className="w-px h-5 bg-gray-700" aria-hidden="true" />
      <span
        className="flex items-center gap-1.5 min-w-0 font-mono text-[10px] text-gray-400 bg-gray-800 px-2 py-1 rounded border border-gray-700"
        title={
          dirty
            ? `${docName ?? '…'} — a file copy is pending (Save downloads it)${lastAutosave ? ` · autosave kept this browser at ${lastAutosave.toLocaleTimeString()}` : ''}`
            : `${docName ?? '…'} — saved`
        }
      >
        <span className="truncate max-w-[26ch]" data-testid="doc-name">
          {docName ?? '…'}
        </span>
        {dirty ? (
          <>
            <span className="sr-only">
              {dotState === 'covered'
                ? 'Unsaved to a file — protected by autosave'
                : 'Unsaved — not yet protected'}
            </span>
            <span className="hidden sm:inline text-[8px] uppercase tracking-wider text-emerald-300 shrink-0" data-testid="autosave-tag">
              {lastAutosave ? `auto ${lastAutosave.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'auto-pending'}
            </span>
            <span
              aria-hidden="true"
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotState === 'covered' ? 'bg-emerald-400' : 'bg-amber-400'}`}
              data-testid="dirty-dot"
            />
          </>
        ) : (
          <span className="sr-only">Saved</span>
        )}
      </span>
      <span
        className="ml-auto text-[9px] font-mono text-gray-500 uppercase tracking-widest"
        data-testid="format-tag"
        title={
          format === 'wordpress'
            ? 'WordPress export: an embed fragment (h2, no shell) built for a Custom HTML block — your site\'s theme supplies the page chrome. No custom plugin needed.'
            : 'Standalone export: the complete self-contained document (h1) — publish or share it as-is.'
        }
      >
        {format === 'wordpress' ? 'WordPress' : 'Standalone'}
      </span>
    </header>
  );
}