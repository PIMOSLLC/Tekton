import { Flame, LayoutGrid, Frame, ShieldCheck, FileCode, Download, ChevronLeft, ChevronRight } from 'lucide-react';

export interface StudioNavProps {
  expanded: boolean;
  onToggleExpanded(): void;
  openSection: 'architect' | 'yaml' | null;
  terminalOpen: boolean;
  engineReady: boolean;
  engineError: boolean;
  onToggleSection(section: 'architect' | 'yaml'): void;
  onFocusCanvas(): void;
  onToggleTerminal(): void;
  onExport(): void;
  canExport: boolean;
}

/**
 * StudioNav — a collapsible panel menu (owner direction: "not a static thin
 * rail"). Collapsed: 56px icons. Expanded: 240px with inline labels. Everything
 * is in-flow — expanding and the content panels PUSH the canvas; nothing
 * overlays, so nothing inside the nav ever needs to overflow horizontally
 * (no horizontal scrollbar, by construction). Native `title` tooltips only in
 * collapsed mode; the custom tooltip pills are gone — they were what clipped
 * into a scrollbar.
 */
export function StudioNav(props: StudioNavProps) {
  const { expanded } = props;
  const width = expanded ? 240 : 56;

  return (
    <nav
      className="flex flex-col h-full bg-gray-900 border-r border-gray-700 shrink-0 overflow-hidden transition-[width] duration-200 motion-reduce:transition-none"
      style={{ width }}
      aria-label="Studio navigation"
    >
      {/* Brand row */}
      <div className={`flex items-center shrink-0 px-2 pt-2 pb-1 ${expanded ? 'justify-between' : 'justify-center'}`}>
        {expanded ? (
          <>
            <div className="flex items-center gap-2 px-1">
              <Flame className="w-5 h-5 text-brand-secondary" />
              <span className="text-xs font-bold tracking-widest text-white">TEKTON</span>
            </div>
            <button
              type="button"
              onClick={props.onToggleExpanded}
              aria-label="Collapse navigation"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={props.onToggleExpanded}
            aria-label="Expand navigation"
            aria-expanded={expanded}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-brand-secondary text-white hover:bg-brand-secondary/90 transition-colors"
          >
            <Flame className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="w-8 h-px bg-gray-700 shrink-0 self-center mb-2" />

      {/* Menu items */}
      <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden py-1">
        <NavItem
          expanded={expanded}
          icon={<LayoutGrid className="w-5 h-5 shrink-0" />}
          label="Visual Architect"
          hint="Structured editor"
          active={props.openSection === 'architect'}
          onClick={() => props.onToggleSection('architect')}
        />
        <NavItem
          expanded={expanded}
          icon={<Frame className="w-5 h-5 shrink-0" />}
          label="Canvas"
          hint="Blueprint workspace"
          active={props.openSection === null}
          onClick={props.onFocusCanvas}
        />
        <NavItem
          expanded={expanded}
          icon={<ShieldCheck className="w-5 h-5 shrink-0" />}
          label="Contrast Lint"
          hint="WCAG 2.2 AA gate"
          active={props.terminalOpen}
          onClick={props.onToggleTerminal}
        />
        <NavItem
          expanded={expanded}
          icon={<FileCode className="w-5 h-5 shrink-0" />}
          label="YAML Source"
          hint="The headless format"
          active={props.openSection === 'yaml'}
          onClick={() => props.onToggleSection('yaml')}
        />
        <NavItem
          expanded={expanded}
          icon={<Download className="w-5 h-5 shrink-0" />}
          label="Export HTML"
          hint="Self-contained file"
          active={false}
          disabled={!props.canExport}
          onClick={props.onExport}
        />
      </div>

      {/* Collapse affordance (expanded mode) — status lights live in the footer now */}
      <div
        className={`pb-3 shrink-0 ${expanded ? 'flex justify-center border-t border-gray-700 pt-2' : ''}`}
      >
        {expanded && (
          <button
            type="button"
            onClick={props.onToggleExpanded}
            className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-gray-500 hover:text-gray-200 transition-colors px-2 py-1"
          >
            <ChevronRight className="w-3.5 h-3.5" />
            Collapse
          </button>
        )}
      </div>
    </nav>
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
  const buttonClass = `relative flex items-center rounded-lg transition-colors ${
    expanded ? 'w-full gap-3 px-3 py-2.5' : 'w-10 h-10 justify-center mx-auto'
  } ${
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
      {expanded && (
        <span className="flex-1 text-left min-w-0">
          <span className="block text-[11px] font-bold uppercase tracking-tight truncate">{label}</span>
          <span className="block text-[9px] text-gray-500 truncate">{hint}</span>
        </span>
      )}
    </>
  );

  return (
    <div className={expanded ? 'px-2 mb-1' : 'mb-1'}>
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