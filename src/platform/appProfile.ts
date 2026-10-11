/**
 * App profile — the standalone app's single home for USER SETTINGS AND
 * PREFERENCES (deliberately distinct from blueprint documents, which live in
 * `persistence.ts`). When Tekton embeds as a Phoenix Insight Nexus module,
 * the PIN platform provides unified settings storage; this file is the seam
 * that swaps: `loadAppProfile`/`saveAppProfile` stay the interface, PIN's
 * storage becomes the implementation, and nothing else in the editor changes.
 *
 * Today (standalone web/Tauri): localStorage under one versioned key.
 */

export const PROFILE_KEY = 'tekton.appProfile';

/** The migrating legacy key — panel widths used to live here alone (1 boot). */
const LEGACY_PANEL_WIDTHS_KEY = 'tekton.panelWidths';

export interface AppProfile {
  /** Show the setup invitation on boot until the user opts out. */
  showSetupOnStart: boolean;
  /** Editor per-section panel widths in px (clamped by the panel's bounds). */
  panelWidths: Record<string, number>;
}

const DEFAULTS: AppProfile = {
  showSetupOnStart: true,
  panelWidths: {},
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Validating read: defaults win over corruption; adopts the legacy key once. */
export function loadAppProfile(): AppProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    const legacy = localStorage.getItem(LEGACY_PANEL_WIDTHS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : {};
    const profile: AppProfile = isRecord(parsed)
      ? {
          showSetupOnStart:
            typeof parsed['showSetupOnStart'] === 'boolean'
              ? (parsed['showSetupOnStart'] as boolean)
              : DEFAULTS.showSetupOnStart,
          panelWidths: isRecord(parsed['panelWidths'])
            ? (Object.fromEntries(
                Object.entries(parsed['panelWidths']).filter(
                  ([, w]) => typeof w === 'number' && w > 0,
                ),
              ) as Record<string, number>)
            : {},
        }
      : { ...DEFAULTS };
    if (legacy && Object.keys(profile.panelWidths).length === 0) {
      profile.panelWidths = JSON.parse(legacy) as Record<string, number>;
      localStorage.removeItem(LEGACY_PANEL_WIDTHS_KEY);
    }
    return profile;
  } catch {
    return { ...DEFAULTS };
  }
}

/** Best-effort write (private mode etc. must not crash the editor). */
export function saveAppProfile(profile: AppProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* prefs are best-effort */
  }
}