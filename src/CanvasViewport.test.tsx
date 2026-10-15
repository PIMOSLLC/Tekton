import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CanvasViewport, LINE_PX } from './CanvasViewport';

/**
 * The viewport's pan/zoom library measures the wrapper (clientWidth/Height)
 * and the content (offsetWidth/Height) for its bounds and anchor math;
 * happy-dom lays out nothing, so every wheel spec pins the measurements
 * explicitly.
 */
const sizeViewport = (wrapperPx = 1000, contentPx = 2000) => {
  for (const sel of ['.react-transform-wrapper', '.react-transform-component']) {
    const el = document.querySelector(sel) as HTMLElement | null;
    expect(el, `a ${sel} exists to measure`).not.toBeNull();
    Object.defineProperty(el, 'clientWidth', { value: wrapperPx, configurable: true });
    Object.defineProperty(el, 'clientHeight', { value: wrapperPx, configurable: true });
    Object.defineProperty(el, 'offsetWidth', { value: contentPx, configurable: true });
    Object.defineProperty(el, 'offsetHeight', { value: contentPx, configurable: true });
  }
};

const wheel = (target: HTMLElement, deltaY: number, deltaMode = 0, clientX = 500, clientY = 400) =>
  fireEvent.wheel(target, { deltaY, deltaMode, clientX, clientY, cancelable: true, bubbles: true });

const settle = () => new Promise((r) => setTimeout(r, 30));

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

  describe('the deterministic wheel zoom', () => {
    const booted = () => {
      const { container } = render(
        <CanvasViewport fitKey={1}>
          <div data-testid="canvas-child">canvas content</div>
        </CanvasViewport>,
      );
      sizeViewport();
      return container.querySelector('.tk-panzoom') as HTMLElement;
    };
    const readout = () => screen.getByText(/\d+%/).textContent ?? '';

    it('one wheel notch moves the zoom exactly one deliberate step, whatever the notch reports', async () => {
      const root = booted();
      // A Chrome-class notch (±100px) is one event here: one multiplier,
      // magnitude-independent — never the raw delta's rocket.
      wheel(root, -100);
      await waitFor(() => expect(readout()).toBe('107%'), { timeout: 1000 });
    });

    it('micro-ripples bank into the residue — nothing zooms until one notch accrues', async () => {
      const root = booted();
      wheel(root, -40, 0);
      await settle();
      expect(readout()).toBe('100%');
      wheel(root, -40, 0);
      await settle();
      expect(readout()).toBe('100%');
      wheel(root, -25, 0);
      // 40 + 40 + 25 = 105 ≥ one notch: exactly one step, 5px carried over.
      await waitFor(() => expect(readout()).toBe('107%'), { timeout: 1000 });
    });

    it('Firefox line-mode deltas convert at the line height — three lines bank, the fourth lands a notch', async () => {
      const root = booted();
      expect(LINE_PX * 3).toBe(99); // one short of a notch
      wheel(root, -3, 1);
      await settle();
      expect(readout()).toBe('100%');
      wheel(root, -4, 1); // 99 + 132 = 231 → two whole notches (1.07² ≈ 1.14)
      await waitFor(() => expect(readout()).toBe('114%'), { timeout: 1000 });
    });

    it('rapid fling notches chain from the SETTLED target — ×1.07, then ×1.1449, no drift', async () => {
      const root = booted();
      wheel(root, -100);
      wheel(root, -100); // the second notch compounds from the requested 1.07
      await waitFor(() => expect(readout()).toBe('114%'), { timeout: 1000 });
    });

    it('scrolling the other way steps down symmetrically (×1/1.07 ≈ 0.93)', async () => {
      const root = booted();
      wheel(root, 100);
      await waitFor(() => expect(readout()).toBe('93%'), { timeout: 1000 });
      wheel(root, -100);
      await waitFor(() => expect(readout()).toBe('100%'), { timeout: 1000 });
    });

    it('a horizontal-dominant wheel never masquerades as zoom (Magic Mouse swipe)', async () => {
      const root = booted();
      fireEvent.wheel(root, { deltaX: -900, deltaY: -100, deltaMode: 0, cancelable: true, bubbles: true });
      await settle();
      expect(readout()).toBe('100%');
    });
  });
});