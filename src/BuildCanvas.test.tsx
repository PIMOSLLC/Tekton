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

describe('BuildCanvas document-theme parity', () => {
  it('untinted cards paint the DOCUMENT surface and ink — a dark document reads dark, like the exported artifact', () => {
    const dark: BlueprintDocument = {
      ...doc,
      theme: { surface: '#1F2937', ink_strong: '#F1F5F9' },
    };
    render(<BuildCanvas doc={dark} selectedCard={null} onSelectCard={() => {}} />);
    const card = screen.getByText('Arrive').closest('button');
    expect(card?.style.background).toBe('#1F2937');
    expect(card?.style.getPropertyValue('--tk-card-ink')).toBe('#F1F5F9');
  });

  it('a tinted lane keeps its tint as the card surface under the same ink', () => {
    const tinted: BlueprintDocument = {
      ...doc,
      lanes: [{ ...doc.lanes[0], tint: '#2A2140' }, doc.lanes[1]],
      theme: { surface: '#1F2937', ink_strong: '#F1F5F9' },
    };
    render(<BuildCanvas doc={tinted} selectedCard={null} onSelectCard={() => {}} />);
    const card = screen.getByText('Arrive').closest('button');
    expect(card?.style.background).toBe('#2A2140');
  });

  it('the canvas shows the document face: band, stats, and note in the artifact\u2019s reading order', () => {
    const face: BlueprintDocument = {
      ...doc,
      meta: { eyebrow: 'Portfolio case study', title: 'Agentic Blueprint', intro: 'One pilot, traced.' },
      stats: [
        { figure: '4 layers', caption: 'Systems · data · governance · outcomes' },
        { figure: '1 week', caption: 'Signal to monitored release' },
      ],
      note: { label: 'Scope and evidence:', body: 'The pilot includes Shopify CRM.' },
      theme: {
        band_bg: '#0b0f1a',
        band_border: '#1e40af',
        band_eyebrow: '#93c5fd',
        band_text: '#e5e7eb',
        accent: '#60A5FA',
        stat_caption: '#94A3B8',
        note_ink: '#94A3B8',
      },
    };
    render(<BuildCanvas doc={face} selectedCard={null} onSelectCard={() => {}} />);
    // Band: title block paints in the doc's band pair.
    expect(screen.getByText('Portfolio case study')).toBeDefined();
    expect(screen.getByText('Agentic Blueprint')).toBeDefined();
    expect(screen.getByText('One pilot, traced.')).toBeDefined();
    const band = document.querySelector('.tk-canvas-band') as HTMLElement;
    expect((band.querySelector('h2') as HTMLElement).textContent).toBe('Agentic Blueprint');
    // Stats strip: each figure/caption pair renders beneath the band.
    expect(screen.getAllByText('4 layers').length).toBe(1);
    expect(screen.getByText('1 week')).toBeDefined(); // the bold figure chip
    expect(screen.getByText('Signal to monitored release')).toBeDefined();
    // Note: the closing scope line renders at the sheet's foot.
    const note = document.querySelector('.tk-canvas-note') as HTMLElement;
    expect(note.textContent).toContain('Scope and evidence:');
    expect(note.textContent).toContain('The pilot includes Shopify CRM.');
    // Doc-driven tokens flow for the new face regions (scoped on the root,
    // consumed by inheritance).
    const root = document.querySelector('.tk-canvas') as HTMLElement;
    expect(root.style.getPropertyValue('--tk-doc-accent')).toBe('#60A5FA');
    expect(root.style.getPropertyValue('--tk-doc-band-bg')).toBe('#0b0f1a');
    expect(root.style.getPropertyValue('--tk-doc-note-ink')).toBe('#94A3B8');
  });

  it('a theme-less document still shows the face (chrome fallbacks) — no crash', () => {
    renderCanvas();
    expect(document.querySelector('.tk-canvas-band')).not.toBeNull();
    expect(screen.getByText('t')).toBeDefined(); // the wizard-less title
    expect(document.querySelector('.tk-canvas-stats')).toBeNull(); // no stats authored
    expect(document.querySelector('.tk-canvas-note')).toBeNull();
  });

  it('the page, stage columns, and lane headers wear the document theme — no white sheet survives a dark document', () => {
    const dark: BlueprintDocument = {
      ...doc,
      theme: {
        canvas: '#0B121B',
        stage_bg: '#0F172A',
        stage_ink: '#E2E8F0',
        stage_blurb: '#94A3B8',
        row_head_bg: '#111827',
        ink: '#E2E8F0',
        row_blurb: '#94A3B8',
      },
    };
    render(<BuildCanvas doc={dark} selectedCard={null} onSelectCard={() => {}} />);
    const root = document.querySelector('.tk-canvas') as HTMLElement;
    expect(root?.style.getPropertyValue('--tk-doc-canvas')).toBe('#0B121B');
    expect(root?.style.getPropertyValue('--tk-doc-stage-bg')).toBe('#0F172A');
    expect(root?.style.getPropertyValue('--tk-doc-row-bg')).toBe('#111827');
    expect(root?.style.getPropertyValue('--tk-doc-stage-ink')).toBe('#E2E8F0');
  });

  it('a light document gets no dark vars — the chrome light look carries it', () => {
    renderCanvas();
    const root = document.querySelector('.tk-canvas') as HTMLElement;
    expect(root?.style.getPropertyValue('--tk-doc-canvas')).toBe('#f5f7fb');
    expect(root?.style.getPropertyValue('--tk-doc-stage-ink')).toBe('#17256d');
  });
});