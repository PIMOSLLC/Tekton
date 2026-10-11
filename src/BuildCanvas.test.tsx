import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { BuildCanvas } from './BuildCanvas';
import type { BlueprintDocument } from './types';

const doc: BlueprintDocument = {
  meta: { eyebrow: 'e', title: 't', intro: 'i' },
  stages: [
    { id: 's1', name: 'One' },
    { id: 's2', name: 'Two' },
  ],
  lanes: [
    {
      id: 'customer',
      kind: 'customer',
      name: 'Customer actions',
      cards: [
        { title: 'Arrive', blurb: '' },
        { title: 'Weigh', blurb: '' },
      ],
    },
    {
      id: 'backstage',
      kind: 'backstage',
      name: 'Backstage',
      divider: '— Line of visibility —',
      cards: [
        { title: 'Review', blurb: '' },
        { title: 'Approve', blurb: '' },
      ],
    },
  ],
};

function renderCanvas() {
  return render(<BuildCanvas doc={doc} selectedCard={null} onSelectCard={() => {}} />);
}

describe('BuildCanvas separation lines', () => {
  it('renders the divider as a shaded band in the document theme, not a bare label', () => {
    renderCanvas();
    const band = screen.getByText('— Line of visibility —');
    // The artifact's shaded row: theme divider-bg wins, artifact navy is the
    // fallback — the composer shading shows the band belongs to its row.
    expect(band.getAttribute('aria-pressed')).toBe('false');
    expect((band as HTMLElement).style.background).toMatch(/18,\s*33,\s*80|#182150/i);
  });

  it('clicking a line shades (and unshades) the governed row — keyboard operable', () => {
    renderCanvas();
    const band = screen.getByText('— Line of visibility —');
    fireEvent.click(band);
    expect(band.getAttribute('aria-pressed')).toBe('true');
    expect(band.className).toContain('is-active');
    expect(screen.getByText('Backstage').closest('div')?.className).toContain('is-associated');
    expect(screen.getByText('Review').closest('button')?.className).toContain('is-associated');
    // The row the line does NOT govern stays untouched.
    expect(screen.getByText('Arrive').closest('button')?.className).not.toContain('is-associated');
    fireEvent.click(band);
    expect(band.getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByText('Review').closest('button')?.className).not.toContain(
      'is-associated',
    );
  });

  it('moving to another line moves the shading — one association at a time', () => {
    const withTwoLines: BlueprintDocument = {
      ...doc,
      lanes: [
        { ...doc.lanes[0], divider: '— Line of interaction —' },
        doc.lanes[1],
      ],
    };
    render(<BuildCanvas doc={withTwoLines} selectedCard={null} onSelectCard={() => {}} />);
    const first = screen.getByText('— Line of interaction —');
    const second = screen.getByText('— Line of visibility —');
    fireEvent.click(first);
    fireEvent.click(second);
    expect(second.className).toContain('is-active');
    expect(first.className).not.toContain('is-active');
  });

  it('an empty-title card wears the needs-a-title marker; titled cards do not', () => {
    const withGap: typeof doc = {
      ...doc,
      lanes: [
        doc.lanes[0],
        { ...doc.lanes[1], cards: [{ title: '', blurb: '' }, doc.lanes[1].cards[1]] },
      ],
    };
    render(<BuildCanvas doc={withGap} selectedCard={null} onSelectCard={() => {}} />);
    const untitled = screen.getByText('Untitled card').closest('button');
    expect(untitled?.className).toContain('is-untitled');
    expect(screen.getByText('Approve').closest('button')?.className).not.toContain('is-untitled');
  });

  it('a lane without a divider renders no band', () => {
    renderCanvas();
    expect(screen.queryByText('— Line of interaction —')).toBeNull();
  });
});