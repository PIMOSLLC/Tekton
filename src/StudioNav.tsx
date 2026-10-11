import type { ReactNode } from 'react';
import {
  LayoutGrid,
  Frame,
  ShieldCheck,
  FileCode,
  Palette,
  Download,
  FilePlus2,
  FolderOpen,
  Save,
  Braces,
} from 'lucide-react';
// The Tekton mark (a blueprint sheet — navy on paper): mirrored from
// Resources/logo; Vite inlines/copies it, containers never need the folder.
import tektonLogo from './assets/tekton-logo.svg';

export interface StudioNavProps {
  expanded: boolean;
  onToggleExpanded(): void;
  openSection: 'architect' | 'yaml' | 'new' | 'theme' | null;
  terminalOpen: boolean;
  engineReady: boolean;
  engineError: boolean;
  onToggleSection(section: 'architect' | 'yaml' | 'theme'): void;
  onFocusCanvas(): void;
  onToggleTerminal(): void;
  /** Blueprint lifecycle — persisted by the shell's adapters. */
  onNew(): void;
  onOpen(): void;
  onSave(): void;
  onSaveJson(): void;
  /** Save is meaningful only when something is unsaved. */
  canSave: boolean;
  onExport(): void;
  canExport: boolean;
}

/**
 * StudioNav — a collapsible panel menu. Collapsed: 56px icons. Expanded:
 * 240px with inline labels. Branding lives ONLY in the app header — the rail
 * carries a single icon anchor (the mark on its paper tile): collapsed it
 * expands, the wordmark gone it collapses; no wordmark, no duplicate chevron,
 * no second collapse link at the bottom.
 */
export function StudioNav(props: StudioNavProps) {
  const { expanded } = props;
  const width = expanded ? 240 : 56;

  return (
    <nav
      className="flex flex-col h-full pt-2 bg-gray-900 border-r border-gray-700 shrink-0 overflow-hidden transition-[width] duration-300 ease-out motion-reduce:transition-none"
      style={{ width }}
      aria-label="Studio navigation"
    >
      {/* Icon anchor — THE mark on its paper tile (wordmark = AppHeader's job).
          Constant px-2: the tile's x is numerically identical in both states. */}
      <div className="flex items-center shrink-0 px-2 pb-2 justify-start">
        <button
          type="button"
          onClick={props.onToggleExpanded}
          aria-label={expanded ? 'Collapse navigation' : 'Expand navigation'}
          aria-expanded={expanded}
          title={expanded ? 'Collapse navigation' : 'Expand navigation'}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-white shadow-sm hover:shadow-md hover:brightness-105 transition-all duration-300 ease-out motion-reduce:transition-none"
        >
          <img src={tektonLogo} alt="" aria-hidden="true" className="w-7 h-7" />
        </button>
      </div>

      <div className="w-8 h-px bg-gray-700 shrink-0 self-center mb-2" />

      {/* The workflow, grouped: DOCUMENT (lifecycle) → AUTHOR (the build
          surfaces, canvas first) → SHIP (the AA gate before the export).
          Group labels = tiny caps, same language as the toolbar/theme panel. */}
      <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden py-1">
        <NavGroup label="Document" expanded={expanded}>
          <NavItem
            expanded={expanded}
            icon={<FilePlus2 className="w-5 h-5 shrink-0" />}
            label="New Blueprint"
            hint="Pick starter or example"
            active={false}
            onClick={props.onNew}
          />
          <NavItem
            expanded={expanded}
            icon={<FolderOpen className="w-5 h-5 shrink-0" />}
            label="Open Blueprint"
            hint=".yaml or .json file"
            active={false}
            onClick={props.onOpen}
          />
          <NavItem
            expanded={expanded}
            icon={<Save className="w-5 h-5 shrink-0" />}
            label="Save"
            hint="Download current document"
            active={false}
            disabled={!props.canSave}
            onClick={props.onSave}
          />
          <NavItem
            expanded={expanded}
            icon={<Braces className="w-5 h-5 shrink-0" />}
            label="Save JSON"
            hint="Structured format (PIN payload)"
            active={false}
            disabled={!props.canSave}
            onClick={props.onSaveJson}
          />
        </NavGroup>
        <NavGroup label="Author" expanded={expanded}>
          <NavItem
            expanded={expanded}
            icon={<Frame className="w-5 h-5 shrink-0" />}
            label="Blueprint Canvas"
            hint="The workspace — the grid you fill"
            active={props.openSection === null}
            onClick={props.onFocusCanvas}
          />
          <NavItem
            expanded={expanded}
            icon={<LayoutGrid className="w-5 h-5 shrink-0" />}
            label="Visual Architect"
            hint="The model: metadata, stages, lanes"
            active={props.openSection === 'architect'}
            onClick={() => props.onToggleSection('architect')}
          />
          <NavItem
            expanded={expanded}
            icon={<Palette className="w-5 h-5 shrink-0" />}
            label="Theme Colors"
            hint="Live WCAG verdicts"
            active={props.openSection === 'theme'}
            onClick={() => props.onToggleSection('theme')}
          />
          <NavItem
            expanded={expanded}
            icon={<FileCode className="w-5 h-5 shrink-0" />}
            label="YAML Source"
            hint="The headless layer"
            active={props.openSection === 'yaml'}
            onClick={() => props.onToggleSection('yaml')}
          />
        </NavGroup>
        <NavGroup label="Ship" expanded={expanded}>
          <NavItem
            expanded={expanded}
            icon={<ShieldCheck className="w-5 h-5 shrink-0" />}
            label="Contrast Lint"
            hint="The WCAG 2.2 AA gate — check first"
            active={props.terminalOpen}
            onClick={props.onToggleTerminal}
          />
          <NavItem
            expanded={expanded}
            icon={<Download className="w-5 h-5 shrink-0" />}
            label="Export"
            hint="HTML + data layer"
            active={false}
            disabled={!props.canExport}
            onClick={props.onExport}
          />
        </NavGroup>
      </div>
    </nav>
  );
}

/** A workflow group: a labeled zone (role=group) — the label ships only in
 * the expanded rail, so the collapsed rail never reflows. */
function NavGroup({
  label,
  expanded,
  children,
}: {
  label: string;
  expanded: boolean;
  children: ReactNode;
}) {
  return (
    <div role="group" aria-label={label} className="tk-nav-group">
      {expanded && <div className="tk-nav-group-label">{label}</div>}
      {children}
    </div>
  );
}

interface NavItemProps {
  expanded: boolean;
  icon: React.ReactNode;
  label: string;
  hint: string;
  active: boolean;
  disabled?: boolean;
  onClick(): void;
}

function NavItem({ expanded, icon, label, hint, active, disabled, onClick }: NavItemProps) {
  // ONE geometry, all properties numerically interpolable: the button is
  // always `w-full h-10` inside an always-`px-2` row (collapsed: exactly 40px
  // wide — the icon centers by arithmetic, never by discrete justify/margin
  // swaps), so collapse and expand are continuous for icons AND labels.
  const buttonClass = `relative flex items-center rounded-lg h-10 w-full px-2.5 gap-2.5 transition-all duration-300 ease-out motion-reduce:transition-none ${
    active
      ? 'bg-brand-primary/20 text-brand-secondary'
      : disabled
        ? 'text-gray-600 cursor-not-allowed'
        : 'text-gray-500 hover:bg-gray-800 hover:text-gray-200'
  }`;

  const content = (
    <>
      {icon}
      {active && (
        <div className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r bg-brand-secondary" />
      )}
      {/* Labels crossfade + slide with the rail's width — a DEFINITE cap both
          directions (max-width:none is not interpolable → the pop asymmetry),
          so expand and collapse animate identically and smoothly */}
      <span
        className={`overflow-hidden text-left flex-1 min-w-0 transition-all duration-300 ease-out motion-reduce:transition-none ${
          expanded ? 'max-w-44 opacity-100' : 'max-w-0 opacity-0'
        }`}
      >
        <span className="block text-[11px] font-bold uppercase tracking-tight truncate">{label}</span>
        <span className="block text-[9px] text-gray-500 truncate">{hint}</span>
      </span>
    </>
  );

  return (
    <div className="px-2 mb-1">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-expanded={undefined}
        title={expanded ? undefined : label}
        className={buttonClass}
      >
        {content}
      </button>
    </div>
  );
}