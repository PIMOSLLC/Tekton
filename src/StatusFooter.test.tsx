import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusFooter, type StatusItem } from './StatusFooter';
import { Clock } from 'lucide-react';

const item = (id: string, value: string): StatusItem => ({
  id,
  label: id,
  icon: Clock,
  led: 'success',
  value,
  tooltip: [`line for ${id}`],
});

describe('StatusFooter', () => {
  it('the footer carries the class hooks of the stacking contract — brand, context, and the lights pill', () => {
    render(
      <StatusFooter
        items={[item('autosave', '09:18:36 AM'), item('engine', 'WASM')]}
        brand="Phoenix Tekton · 2026 · Build 0.2.0"
        context="Portfolio case study · Future-state service design"
      />,
    );
    // The structure the stacking CSS anchors on: no inline height that could
    // clip a wrapped second row, the brand zone and its nowrap line, and the
    // content-hugging capsule right-anchored by the stylesheet (App.css).
    const footer = document.querySelector('.tk-status-footer') as HTMLElement;
    expect(footer).not.toBeNull();
    expect(footer.style.height).toBe(''); // no inline height — stacking stays possible
    expect(footer.querySelector('.tk-status-brand')).not.toBeNull();
    expect(footer.querySelector('.tk-status-brand > span')).not.toBeNull();
    expect(footer.querySelector('.tk-status-context')).not.toBeNull();
    const pill = footer.querySelector('.tk-status-indicators') as HTMLElement;
    expect(pill.querySelectorAll('.tk-status-item')).toHaveLength(2);
    // The wrap-safe divider: no separator spans inside the lights (a stacked
    // row never ends with a hanging "|"); the CSS hairline owns the rail.
    expect(pill.querySelector('.tk-status-sep')).toBeNull();
    // Every light is reachable and labelled (hover or keyboard focus).
    expect(screen.getByLabelText('autosave: 09:18:36 AM — status success')).toBeDefined();
    expect(screen.getByLabelText('engine: WASM — status success')).toBeDefined();
  });
});