import { Flame, LayoutGrid, Frame, ShieldCheck, FileCode, Download } from 'lucide-react';

export interface IconRailProps {
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
 * IconRail — the 56px PIM-family rail (adapted from Phoenix Insight Nexus):
 * brand button, 40×40 icon buttons with the 3px left active bar, uppercase
 * tooltip pills, and the engine status dot where PIN shows Live/Local.
 */
export function IconRail(props: IconRailProps) {
  return (
    <nav className="flex flex-col h-full w-14 bg-gray-900 border-r border-gray-700 shrink-0">
      <div className="flex-1 flex flex-col items-center pt-2 pb-2 overflow-y-auto">
        <button
          type="button"
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-brand-secondary text-white hover:bg-brand-secondary/90 transition-colors mb-3"
          onClick={props.onFocusCanvas}
          title="phoenix-Tekton"
        >
          <Flame className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => props.onToggleSection('architect')}
          className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-black transition-colors mb-4 ${
            props.openSection === 'architect'
              ? 'bg-brand-primary/20 text-brand-secondary'
              : 'text-gray-500 hover:bg-gray-800 hover:text-gray-200'
          }`}
          title="Blueprint — Visual Architect"
        >
          S
        </button>

        <div className="w-8 h-px bg-gray-700 mb-3" />

        <RailItem
          label="Visual Architect"
          active={props.openSection === 'architect'}
          onClick={() => props.onToggleSection('architect')}
          icon={<LayoutGrid className="w-5 h-5" />}
        />
        <RailItem
          label="Canvas"
          active={props.openSection === null}
          onClick={props.onFocusCanvas}
          icon={<Frame className="w-5 h-5" />}
        />
        <RailItem
          label="Contrast Lint"
          active={props.terminalOpen}
          onClick={props.onToggleTerminal}
          icon={<ShieldCheck className="w-5 h-5" />}
        />
        <RailItem
          label="YAML Source"
          active={props.openSection === 'yaml'}
          onClick={() => props.onToggleSection('yaml')}
          icon={<FileCode className="w-5 h-5" />}
        />
        <RailItem
          label="Export HTML"
          active={false}
          disabled={!props.canExport}
          onClick={props.onExport}
          icon={<Download className="w-5 h-5" />}
        />
      </div>

      <div className="flex flex-col items-center pb-3 space-y-1">
        <div className="w-8 h-px bg-gray-700 mb-2" />
        <div className="flex items-center gap-1.5">
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              props.engineError ? 'bg-amber-500' : 'bg-emerald-500'
            } ${props.engineReady && !props.engineError ? 'animate-pulse' : ''}`}
          />
          <span className="text-[7px] font-black uppercase tracking-widest text-gray-500">
            {props.engineError ? 'Err' : props.engineReady ? 'WASM' : '…'}
          </span>
        </div>
      </div>
    </nav>
  );
}

interface RailItemProps {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  disabled?: boolean;
  onClick(): void;
}

function RailItem({ label, icon, active, disabled, onClick }: RailItemProps) {
  return (
    <div className="relative group mb-1">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
          active
            ? 'bg-brand-primary/20 text-brand-secondary'
            : disabled
              ? 'text-gray-600 cursor-not-allowed'
              : 'text-gray-500 hover:bg-gray-800 hover:text-gray-200'
        }`}
        title={label}
      >
        {icon}
        {active && (
          <div className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r bg-brand-secondary" />
        )}
      </button>
      <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-gray-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[60] shadow-lg">
        {label}
        <svg
          className="w-3 h-3 absolute -left-1.5 top-1/2 -translate-y-1/2 text-gray-700"
          fill="currentColor"
          viewBox="0 0 6 10"
        >
          <path d="M0 5l6-5v10z" />
        </svg>
      </div>
    </div>
  );
}