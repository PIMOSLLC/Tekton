import type { BlueprintTheme } from './types';
import { THEME_GROUPS, THEME_PRESETS, THEME_TOKENS } from './types';

export interface ThemeEditorProps {
  /** The document's theme map (wire keys; engine guarantees every token). */
  theme: BlueprintTheme;
  onThemeChange(key: string, value: string): void;
  /** Preset apply is the app's guarded transaction — stale lane tints that
   * cannot hold the preset's card ink re-base to the kind defaults and the
   * result is announced. The engine's Rust suite audits the map (the wasm
   * engine can't be reached from Rust tests, hence the seam). */
  onApplyPreset(preset: Record<string, string>, label: string): void;
}

/**
 * ThemeEditor — every color the rendered blueprint emits, grouped by the part
 * of the artifact it paints. Editing re-runs the engine pipeline (render +
 * WCAG 2.2 lint + validate live — the footer's contrast light is the verdict).
 *
 * Two controls per token: a native color swatch (fast, always-legal hex) and
 * a raw hex text field (exact values, accepts what the YAML would). A theme
 * with an unparsable hex fails *validate* as an error (render gate) — never
 * silently.
 *
 * PRESETS live in one registry (`THEME_PRESETS`) that the panel's picker
 * maps 1:1 — apply is the app's guarded transaction, re-basing lane tints
 * the new ink cannot carry and announcing the verdict. The AA sets are
 * audited by the Rust suite; the high-contrast sets carry the AAA tier.
 * The lane-kind tints and the accent ink ride along, so dark themes keep
 * the tinted lanes and the active buttons legible.
 */
export function ThemeEditor({ theme, onThemeChange, onApplyPreset }: ThemeEditorProps) {
  return (
    <div className="tk-theme-editor">
      <div className="tk-preset-row" data-testid="theme-presets">
        <label className="tk-preset-caption" htmlFor="tk-theme-preset">
          Theme presets
        </label>
        <select
          id="tk-theme-preset"
          className="tk-preset-select"
          data-testid="preset-select"
          aria-label="Pick a theme preset to apply"
          title="Whole-theme sets, AA-audited by the engine's test suite"
          value=""
          onChange={(e) => {
            const pick = THEME_PRESETS[Number(e.target.value)];
            if (pick) onApplyPreset(pick.map, pick.label);
            e.target.value = '';
          }}
        >
          <option value="" disabled>
            Pick a theme…
          </option>
          {THEME_PRESETS.map((p, i) => (
            <option key={p.id} value={String(i)}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      {THEME_GROUPS.map((group) => (
        <section className="tk-arch-section" key={group}>
          <h3>{group}</h3>
          {THEME_TOKENS.filter((t) => t.group === group).map((token) => {
            const value = theme[token.key] ?? '';
            return (
              <div className="tk-theme-row" key={token.key} data-testid="theme-token">
                <span className="tk-theme-info">
                  <span className="tk-theme-label">{token.label}</span>
                  <span className="tk-theme-about">{token.about}</span>
                </span>
                <input
                  type="color"
                  className="tk-theme-swatch"
                  aria-label={`${token.label} color`}
                  value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000'}
                  onChange={(e) => onThemeChange(token.key, e.target.value)}
                />
                <input
                  type="text"
                  className="tk-theme-hex"
                  aria-label={`${token.label} hex`}
                  spellCheck={false}
                  value={value}
                  placeholder="#rrggbb"
                  onChange={(e) => onThemeChange(token.key, e.target.value)}
                />
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}