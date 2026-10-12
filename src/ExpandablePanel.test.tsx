import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ExpandablePanel } from './ExpandablePanel';

const renderPanel = (width = 400) => {
  const onWidthResize = vi.fn();
  render(
    <ExpandablePanel
      section="architect"
      title="Visual Architect"
      width={width}
      defaultWidth={400}
      onWidthResize={onWidthResize}
      onClose={() => {}}
    >
      <p>panel body</p>
    </ExpandablePanel>,
  );
  return { onWidthResize };
};

describe('ExpandablePanel', () => {
  it('the grip is a row-lane sibling: the panel lays content LEFT of the grip (regression: flex-col collapsed the grip to a zero-height strip below the content)', () => {
    renderPanel();
    const panel = screen.getByRole('complementary', { name: 'Visual Architect panel' });
    expect(panel.className).toContain('flex-row');
    expect(panel.className).not.toContain('flex-col');
    expect(screen.getByTestId('panel-resizer').parentElement).toBe(panel);
  });

  it('the sash sits in a gap: the root is transparent air, the content owns the panel paint', () => {
    renderPanel();
    const panel = screen.getByRole('complementary', { name: 'Visual Architect panel' });
    expect(panel.className).not.toContain('bg-gray-800');
    const content = panel.firstElementChild as HTMLElement;
    expect(content.className).toContain('bg-gray-800');
    expect(content.className).toContain('border-r');
    const grip = screen.getByTestId('panel-resizer');
    expect(grip.className).not.toContain('bg-gray-800');
  });

  it('the grip is an ARIA separator carrying the live width', () => {
    renderPanel(460);
    const grip = screen.getByRole('separator', { name: 'Resize Visual Architect width' });
    expect(grip.getAttribute('aria-orientation')).toBe('vertical');
    expect(grip.getAttribute('aria-valuenow')).toBe('460');
    expect(grip.getAttribute('aria-valuemin')).toBe('280');
    expect(grip.getAttribute('aria-valuemax')).toBe('760');
  });

  it('a pointer drag sizes the panel to pointer-distance from its left edge, and ends on release', () => {
    const { onWidthResize } = renderPanel(400);
    const grip = screen.getByTestId('panel-resizer');
    fireEvent.pointerDown(grip, { pointerId: 1 });
    fireEvent.pointerMove(grip, { pointerId: 1, clientX: 520 });
    expect(onWidthResize).toHaveBeenLastCalledWith(520);
    fireEvent.pointerUp(grip, { pointerId: 1 });
    fireEvent.pointerMove(grip, { pointerId: 1, clientX: 200 });
    // The drag ended — a stray move must not resize.
    expect(onWidthResize).toHaveBeenLastCalledWith(520);
  });

  it('drags clamp to the 280–760 band', () => {
    const { onWidthResize } = renderPanel(700);
    const grip = screen.getByTestId('panel-resizer');
    fireEvent.pointerDown(grip, { pointerId: 1 });
    fireEvent.pointerMove(grip, { pointerId: 1, clientX: 50 });
    expect(onWidthResize).toHaveBeenLastCalledWith(280);
    fireEvent.pointerMove(grip, { pointerId: 1, clientX: 20000 });
    expect(onWidthResize).toHaveBeenLastCalledWith(760);
  });

  it('ArrowRight widens by 24px, ArrowLeft narrows, Home resets to the panel default', () => {
    const { onWidthResize } = renderPanel(400);
    const grip = screen.getByTestId('panel-resizer');
    fireEvent.keyDown(grip, { key: 'ArrowRight' });
    expect(onWidthResize).toHaveBeenLastCalledWith(424);
    fireEvent.keyDown(grip, { key: 'ArrowLeft' });
    expect(onWidthResize).toHaveBeenLastCalledWith(376);
    fireEvent.keyDown(grip, { key: 'Home' });
    expect(onWidthResize).toHaveBeenLastCalledWith(400);
  });

  it('double-clicking the grip resets to the default width', () => {
    const { onWidthResize } = renderPanel(600);
    fireEvent.dblClick(screen.getByTestId('panel-resizer'));
    expect(onWidthResize).toHaveBeenCalledWith(400);
  });

  it('a closed panel is inert: the grip is unfocusable and undraggable', () => {
    const { container } = render(
      <ExpandablePanel
        section={null}
        title="Visual Architect"
        width={400}
        defaultWidth={400}
        onWidthResize={() => {}}
        onClose={() => {}}
      >
        <p>panel body</p>
      </ExpandablePanel>,
    );
    const grip = container.querySelector('[data-testid="panel-resizer"]');
    expect(grip).not.toBeNull();
    expect(grip?.hasAttribute('inert')).toBe(true);
    expect(grip?.getAttribute('tabindex')).toBe('-1');
  });
});