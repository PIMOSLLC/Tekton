import { describe, expect, it, beforeEach } from 'vitest';
import { PROFILE_KEY, loadAppProfile, saveAppProfile, type AppProfile } from './appProfile';

beforeEach(() => {
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem('tekton.panelWidths');
});

describe('appProfile — the standalone settings seam', () => {
  it('defaults to inviting the setup on an untouched profile', () => {
    expect(loadAppProfile()).toEqual({
      showSetupOnStart: true,
      panelWidths: {},
    });
  });

  it('round-trips saved settings', () => {
    const saved: AppProfile = { showSetupOnStart: false, panelWidths: { architect: 520 } };
    saveAppProfile(saved);
    expect(loadAppProfile()).toEqual(saved);
  });

  it('survives corruption and wrong shapes with defaults', () => {
    localStorage.setItem(PROFILE_KEY, '{not json');
    expect(loadAppProfile().showSetupOnStart).toBe(true);
    localStorage.setItem(
      PROFILE_KEY,
      JSON.stringify({ showSetupOnStart: 5, panelWidths: ['bad'] }),
    );
    const profile = loadAppProfile();
    expect(profile.showSetupOnStart).toBe(true);
    expect(profile.panelWidths).toEqual({});
  });

  it('drops panel widths that are not positive numbers', () => {
    saveAppProfile({ showSetupOnStart: true, panelWidths: { yaml: 0, theme: 620 } });
    expect(loadAppProfile().panelWidths).toEqual({ theme: 620 });
  });

  it('migrates the legacy panel-widths key once, then forgets it', () => {
    localStorage.setItem('tekton.panelWidths', JSON.stringify({ architect: 480 }));
    const profile = loadAppProfile();
    expect(profile.panelWidths).toEqual({ architect: 480 });
    expect(localStorage.getItem('tekton.panelWidths')).toBeNull();
  });
});