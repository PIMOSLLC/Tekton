import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
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
});