import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeEditor } from './ThemeEditor';
import { THEME_PRESETS, THEME_TOKENS } from './types';

const theme = { band_bg: '#060d2f', accent: '#1d4ed8' };

describe('ThemeEditor', () => {
  it('renders every registered token exactly once, grouped', () => {
    render(<ThemeEditor theme={theme} onThemeChange={() => {}} onApplyPreset={() => {}} />);
    expect(screen.getAllByTestId('theme-token')).toHaveLength(THEME_TOKENS.length);
    expect(screen.getByRole('heading', { name: 'Band' })).toBeDefined();
    expect(screen.getByRole('heading', { name: 'Accent' })).toBeDefined();
  });

  it('typing a hex commits the token change', () => {
    const onThemeChange = vi.fn();
    render(<ThemeEditor theme={theme} onThemeChange={onThemeChange} onApplyPreset={() => {}} />);
    fireEvent.change(screen.getByLabelText('Accent hex'), {
      target: { value: '#123456' },
    });
    expect(onThemeChange).toHaveBeenCalledWith('accent', '#123456');
  });

  it('the color swatch commits the same token', () => {
    const onThemeChange = vi.fn();
    render(<ThemeEditor theme={theme} onThemeChange={onThemeChange} onApplyPreset={() => {}} />);
    fireEvent.change(screen.getByLabelText('Band background color'), {
      target: { value: '#101010' },
    });
    expect(onThemeChange).toHaveBeenCalledWith('band_bg', '#101010');
  });

  it('an absent token renders empty (engine defaults live in the model, not here)', () => {
    render(<ThemeEditor theme={theme} onThemeChange={() => {}} onApplyPreset={() => {}} />);
    expect((screen.getByLabelText('Legend hex') as HTMLInputElement).value).toBe('');
  });

  it('the presets picker offers every registered whole-theme set', () => {
    render(<ThemeEditor theme={theme} onThemeChange={() => {}} onApplyPreset={() => {}} />);
    const options = (screen.getByTestId('preset-select') as HTMLSelectElement).options;
    expect(options).toHaveLength(THEME_PRESETS.length + 1); // + the placeholder
    for (const p of THEME_PRESETS) {
      expect([...options].some((o) => o.textContent === p.label)).toBe(true);
    }
  });

  it('picking the dark preset hands the app the studio-matched map as one guarded transaction', () => {
    const onApplyPreset = vi.fn();
    render(<ThemeEditor theme={theme} onThemeChange={() => {}} onApplyPreset={onApplyPreset} />);
    fireEvent.change(screen.getByTestId('preset-select'), { target: { value: '0' } });
    expect(onApplyPreset).toHaveBeenCalledOnce();
    const [preset, label] = onApplyPreset.mock.calls[0];
    expect(label).toBe('Match the studio (dark)');
    expect(preset['canvas']).toBe('#0B121B');
    expect(preset['surface']).toBe('#1F2937');
    expect(preset['tint_agents']).toBe('#2A2140');
    expect(preset['accent_ink']).toBe('#0B0F1A');
  });

  it('picking a high-contrast preset hands the app its AAA map with its label', () => {
    const onApplyPreset = vi.fn();
    render(<ThemeEditor theme={theme} onThemeChange={() => {}} onApplyPreset={onApplyPreset} />);
    fireEvent.change(screen.getByTestId('preset-select'), { target: { value: '2' } });
    const [lightPreset, lightLabel] = onApplyPreset.mock.calls[0];
    expect(lightLabel).toBe('High contrast (light · AAA)');
    expect(lightPreset['canvas']).toBe('#ffffff');
    expect(lightPreset['ink_strong']).toBe('#0b0f1a');

    fireEvent.change(screen.getByTestId('preset-select'), { target: { value: '3' } });
    const [darkPreset, darkLabel] = onApplyPreset.mock.calls[1];
    expect(darkLabel).toBe('High contrast (dark · AAA)');
    expect(darkPreset['canvas']).toBe('#000000');
    expect(darkPreset['ink_strong']).toBe('#ffffff');
  });

  it('after an apply the picker returns to its placeholder, so themes can be re-picked', () => {
    render(<ThemeEditor theme={theme} onThemeChange={() => {}} onApplyPreset={() => {}} />);
    const picker = screen.getByTestId('preset-select') as HTMLSelectElement;
    fireEvent.change(picker, { target: { value: '1' } });
    expect(picker.value).toBe('');
  });
});