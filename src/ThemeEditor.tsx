import type { BlueprintTheme } from './types';
import { DARK_STUDIO_PRESET, LIGHT_DEFAULT_PRESET, THEME_GROUPS, THEME_TOKENS } from './types';

export interface ThemeEditorProps {
  /** The document's theme map (wire keys; engine guarantees every token). */
  theme: BlueprintTheme;
  onThemeChange(key: string, value: string): void;
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
 * PRESETS apply whole themes at once (dark = the studio-matched PIN-family
 * palette, light = the published default). The lane-kind tints and the accent
 * ink ride along, so dark themes keep the tinted lanes and the active
 * buttons legible — the Rust side guards the map's AA conformance by test.
 */
export function ThemeEditor({ theme, onThemeChange }: ThemeEditorProps) {
  const applyPreset = (preset: Record<string, string>) => {
    for (const [key, value] of Object.entries(preset)) {
      onThemeChange(key, value);
    }
  };
  return (
    <div className="tk-theme-editor">
      <div className="tk-preset-row" data-testid="theme-presets">
        <span className="tk-preset-caption">Theme presets</span>
        <button
          type="button"
          className="tk-preset-btn"
          data-testid="preset-dark"
          title="The PIN-family dark palette, AA-audited by the engine's test suite"
          onClick={() => applyPreset(DARK_STUDIO_PRESET)}
        >
          Match the studio (dark)
        </button>
        <button
          type="button"
          className="tk-preset-btn"
          data-testid="preset-light"
          title="The published artifact's default palette"
          onClick={() => applyPreset(LIGHT_DEFAULT_PRESET)}
        >
          Published default (light)
        </button>
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