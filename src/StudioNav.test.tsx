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
      onSaveAs={() => {}}
      canSave
      onExport={() => {}}
      canExport
    />,
  );
  return view;
}

describe('StudioNav — the icon-only rail (branding lives in the AppHeader)', () => {
  it('groups the workflow into labeled zones in workflow order', () => {
    renderNav(true, () => {});
    expect(screen.getByRole('group', { name: 'Document' })).toBeDefined();
    expect(screen.getByRole('group', { name: 'Author' })).toBeDefined();
    expect(screen.getByRole('group', { name: 'Ship' })).toBeDefined();
    // the workflow order: Canvas leads Author; Lint leads Ship
    const nav = screen.getByRole('navigation', { name: 'Studio navigation' });
    const labels = [...nav.querySelectorAll('.tk-nav-group')].map((g) => {
      return ([...g.querySelectorAll('button')].map((b) => b.textContent) || []).join('|');
    });
    expect(labels[0]).toContain('New Blueprint');
    expect(labels[1]).toContain('Blueprint Canvas');
    expect(labels[1].indexOf('Blueprint Canvas')).toBeLessThan(labels[1].indexOf('Visual Architect'));
    expect(labels[2]).toContain('Contrast Lint');
    expect(labels[2].indexOf('Contrast Lint')).toBeLessThan(labels[2].indexOf('Export'));
  });

  it('group labels hide in the collapsed rail (no reflow)', () => {
    const { container } = renderNav(false, () => {});
    expect(container.querySelectorAll('.tk-nav-group-label').length).toBe(0);
  });

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