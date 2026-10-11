import type { LucideIcon } from 'lucide-react';

export type StatusColor = 'success' | 'warning' | 'error' | 'info' | 'neutral';

export interface StatusItem {
  id: string;
  label: string;
  icon: LucideIcon;
  /** LED color; success pulses (the engine-ready state), warning blinks. */
  led: StatusColor;
  ledPulse?: boolean;
  /** Value shown after the label (e.g. "WASM", "Valid", "26 pairs"). */
  value: string;
  /** Tooltip lines (hover or keyboard focus) — the PIN tooltip, above the bar. */
  tooltip: string[];
}

export interface StatusFooterProps {
  items: StatusItem[];
  /** Right-side brand/version zone. */
  brand: string;
  /** Left-side document context line (the active document's eyebrow). */
  context?: string;
}

export function StatusFooter({ items, brand, context }: StatusFooterProps) {
  return (
    <footer
      className="tk-status-footer"
      style={{ height: 44 }}
      aria-label="Studio status"
    >
      <div className="tk-status-brand">
        <span className="font-mono">{brand}</span>
        <span className="tk-status-sep" />
        <span className="tk-status-context">{context ?? '—'}</span>
      </div>

      <div className="tk-status-indicators" role="list">
        {items.map((item, i) => (
          <StatusIndicator
            key={item.id}
            item={item}
            last={i === items.length - 1}
          />
        ))}
      </div>
    </footer>
  );
}

function StatusIndicator({ item: it, last }: { item: StatusItem; last: boolean }) {
  const Icon = it.icon;
  return (
    <div
      className="tk-status-item"
      role="listitem"
      tabIndex={0}
      aria-label={`${it.label}: ${it.value} — status ${it.led}`}
    >
      <span className={`tk-status-led tk-status-led-${it.led} ${it.ledPulse ? 'tk-status-led-pulse' : ''}`} />
      <Icon className="w-3 h-3 text-gray-500 shrink-0" />
      <span className="tk-status-label">
        {it.label} · <strong>{it.value}</strong>
      </span>
      {!last && <span className="tk-status-sep" />}

      <div className="tk-status-tooltip" role="tooltip">
        <div className="tk-status-tooltip-title">{it.label}: {it.value}</div>
        {it.tooltip.map((line, idx) => (
          <div key={idx} className="tk-status-tooltip-line">{line}</div>
        ))}
      </div>
    </div>
  );
}