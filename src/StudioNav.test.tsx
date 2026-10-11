import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { StudioNav } from './StudioNav';

function renderNav(expanded: boolean, onToggle: () => void) {
  const view = render(
    <StudioNav
      expanded={expanded}
      onToggleExpanded={onToggle}
      openSection={null}
      terminalOpen={false}
      engineReady
      engineError={false}
      onToggleSection={() => {}}
      onFocusCanvas={() => {}}
      onToggleTerminal={() => {}}
      onNew={() => {}}
      onOpen={() => {}}
      onSave={() => {}}
      onSaveJson={() => {}}
      canSave
      onExport={() => {}}
      canExport
    />,
  );
  return view;
}

describe('StudioNav — the icon-only rail (branding lives in the AppHeader)', () => {
  it('carries no wordmark in either state — one brand bar, one brand mark', () => {
    renderNav(false, () => {});
    expect(screen.queryByText('TEKTON')).toBeNull();
    renderNav(true, () => {});
    expect(screen.queryByText('TEKTON')).toBeNull();
  });

  it('the anchor wears the Tekton mark (an img, not a glyph) in both states', () => {
    const collapsed = renderNav(false, () => {});
    expect(collapsed.container.querySelector('img[src*="tekton-logo"]')).not.toBeNull();
    collapsed.unmount();
    const expanded = renderNav(true, () => {});
    expect(expanded.container.querySelector('img[src*="tekton-logo"]')).not.toBeNull();
    expanded.unmount();
  });

  it('the collapsed anchor expands', () => {
    const toggle = vi.fn();
    renderNav(false, toggle);
    const collapsed = screen.getByLabelText('Expand navigation');
    expect(collapsed.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(collapsed);
    expect(toggle).toHaveBeenCalledOnce();
  });

  it('the expanded rail collapses from the same icon — no duplicate chevron or bottom link', () => {
    const toggle = vi.fn();
    renderNav(true, toggle);
    const expanded = screen.getByLabelText('Collapse navigation');
    expect(expanded.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(expanded);
    expect(toggle).toHaveBeenCalledOnce();
  });
});