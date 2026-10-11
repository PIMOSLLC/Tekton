import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeEditor } from './ThemeEditor';
import { THEME_TOKENS } from './types';

const theme = { band_bg: '#060d2f', accent: '#1d4ed8' };

describe('ThemeEditor', () => {
  it('renders every registered token exactly once, grouped', () => {
    render(<ThemeEditor theme={theme} onThemeChange={() => {}} />);
    expect(screen.getAllByTestId('theme-token')).toHaveLength(THEME_TOKENS.length);
    expect(screen.getByRole('heading', { name: 'Band' })).toBeDefined();
    expect(screen.getByRole('heading', { name: 'Accent' })).toBeDefined();
  });

  it('typing a hex commits the token change', () => {
    const onThemeChange = vi.fn();
    render(<ThemeEditor theme={theme} onThemeChange={onThemeChange} />);
    fireEvent.change(screen.getByLabelText('Accent hex'), {
      target: { value: '#123456' },
    });
    expect(onThemeChange).toHaveBeenCalledWith('accent', '#123456');
  });

  it('the color swatch commits the same token', () => {
    const onThemeChange = vi.fn();
    render(<ThemeEditor theme={theme} onThemeChange={onThemeChange} />);
    fireEvent.change(screen.getByLabelText('Band background color'), {
      target: { value: '#101010' },
    });
    expect(onThemeChange).toHaveBeenCalledWith('band_bg', '#101010');
  });

  it('an absent token renders empty (engine defaults live in the model, not here)', () => {
    render(<ThemeEditor theme={theme} onThemeChange={() => {}} />);
    expect((screen.getByLabelText('Legend hex') as HTMLInputElement).value).toBe('');
  });

  it('the presets row offers both whole-theme sets', () => {
    render(<ThemeEditor theme={theme} onThemeChange={() => {}} />);
    expect(screen.getByTestId('preset-dark').textContent).toContain('Match the studio');
    expect(screen.getByTestId('preset-light').textContent).toContain('Published default');
  });

  it('the dark preset applies the studio-matched map (chrome + tints + accent ink)', () => {
    const onThemeChange = vi.fn();
    render(<ThemeEditor theme={theme} onThemeChange={onThemeChange} />);
    fireEvent.click(screen.getByTestId('preset-dark'));
    const calls = Object.fromEntries(
      onThemeChange.mock.calls.map(([k, v]) => [k, v]),
    );
    expect(onThemeChange.mock.calls.length).toBeGreaterThanOrEqual(33);
    expect(calls['canvas']).toBe('#0B121B');
    expect(calls['surface']).toBe('#1F2937');
    expect(calls['tint_agents']).toBe('#2A2140');
    expect(calls['accent_ink']).toBe('#0B0F1A');
  });

  it('the light preset returns to the published defaults', () => {
    const onThemeChange = vi.fn();
    render(<ThemeEditor theme={theme} onThemeChange={onThemeChange} />);
    fireEvent.click(screen.getByTestId('preset-light'));
    const calls = Object.fromEntries(onThemeChange.mock.calls.map(([k, v]) => [k, v]));
    expect(calls['surface']).toBe('#ffffff');
    expect(calls['tint_agents']).toBe('#f3f0ff');
    expect(calls['accent_ink']).toBe('#ffffff');
  });
});