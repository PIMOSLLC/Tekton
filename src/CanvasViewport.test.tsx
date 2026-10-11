import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CanvasViewport } from './CanvasViewport';

describe('CanvasViewport', () => {
  it('mounts the pan/zoom viewport without crashing (regression: unpopulated instance state on first read)', () => {
    const { container, unmount } = render(
      <CanvasViewport fitKey={1}>
        <div data-testid="canvas-child">canvas content</div>
      </CanvasViewport>,
    );
    expect(container.querySelector('.tk-panzoom')).toBeDefined();
    expect(container.querySelector('[data-testid="canvas-child"]')).toBeDefined();
    unmount();
  });

  it('the grid toggle arms and disarms the dot-grid backdrop', () => {
    render(
      <CanvasViewport fitKey={1}>
        <div data-testid="canvas-child">canvas content</div>
      </CanvasViewport>,
    );
    const grid = screen.getByRole('button', { name: 'Hide grid' });
    expect(grid.getAttribute('aria-pressed')).toBe('true');
    expect(document.querySelector('.tk-canvas-dotgrid')).not.toBeNull();
    fireEvent.click(grid);
    expect(screen.getByRole('button', { name: 'Show grid' }).getAttribute('aria-pressed')).toBe(
      'false',
    );
    expect(document.querySelector('.tk-canvas-dotgrid')).toBeNull();
  });
});