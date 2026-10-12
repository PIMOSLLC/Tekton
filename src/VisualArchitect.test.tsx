import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { VisualArchitect, type SwatchVerdicts } from './VisualArchitect';
import type { BlueprintLane, BlueprintStage, BlueprintStat, BlueprintTheme } from './types';

const stages: BlueprintStage[] = [
  { id: 's1', name: 'Signal' },
  { id: 's2', name: 'Analyze' },
];
const baseStats: BlueprintStat[] = [
  { figure: '4 layers', caption: 'Design system · analytics · site operations · human command' },
];
function renderPanel(lanes: BlueprintLane[] = baseLanes, stats: BlueprintStat[] = baseStats, theme?: BlueprintTheme) {
  const handlers = {
    onMetaChange: vi.fn(),
    onStageChange: vi.fn(),
    onStageAdd: vi.fn(),
    onStageRemove: vi.fn(),
    onStatChange: vi.fn(),
    onStatAdd: vi.fn(),
    onStatRemove: vi.fn(),
    onLaneChange: vi.fn(),
    onLaneAdd: vi.fn(),
    onLaneRemove: vi.fn(),
  };
  const view = render(
    <VisualArchitect
      eyebrow="e"
      title="t"
      intro="i"
      stages={stages}
      lanes={lanes}
      stats={stats}
      theme={theme}
      tintWarnings={{}}
      swatchVerdicts={
        {
          '#FFFFFF': { pass: true, ratio: 14.4 },
          '#F3F0FF': { pass: true, ratio: 12.9 },
        } as SwatchVerdicts
      }
      onMetaChange={handlers.onMetaChange}
      onStageChange={handlers.onStageChange}
      onStageAdd={handlers.onStageAdd}
      onStageRemove={handlers.onStageRemove}
      onStatChange={handlers.onStatChange}
      onStatAdd={handlers.onStatAdd}
      onStatRemove={handlers.onStatRemove}
      onLaneChange={handlers.onLaneChange}
      onLaneAdd={handlers.onLaneAdd}
      onLaneRemove={handlers.onLaneRemove}
    />,
  );
  return { ...view, handlers };
}

const lane = (id: string, name: string, kind: BlueprintLane['kind']): BlueprintLane => ({
  id,
  name,
  kind,
  cards: [
    { title: 'One', blurb: '' },
    { title: 'Two', blurb: '' },
  ],
});
const baseLanes: BlueprintLane[] = [
  lane('customer', 'Customer actions', 'customer'),
  lane('frontstage', 'Frontstage', 'frontstage'),
  lane('agents', 'AI agent workflow', 'agents'),
];

describe('VisualArchitect — grouped workflow panel with the lane accordion', () => {
  it('labels the four authoring groups (Document / Stats / Stages / Lanes)', () => {
    renderPanel();
    expect(screen.getByRole('group', { name: 'Document' })).toBeDefined();
    expect(screen.getByRole('group', { name: 'Stats' })).toBeDefined();
    expect(screen.getByRole('group', { name: 'Stages' })).toBeDefined();
    expect(screen.getByRole('group', { name: 'Lanes' })).toBeDefined();
  });

  it('every row-card field carries a visible label (discoverability — not aria-only naming)', () => {
    renderPanel();
    for (const text of [
      'Figure — the bold stat',
      'Caption — one line beneath it',
      'Stage name',
      'Stage description',
      'Lane name',
      'Lane description',
      'Lane kind',
      'Separation line',
      'Card colors',
      'Lane interpretation',
    ]) {
      expect(screen.getAllByText(text).length).toBeGreaterThan(0);
    }
  });

  it('each stat row previews the artifact\u2019s stat card live — the pair paints as it exports', () => {
    renderPanel(baseLanes, baseStats, {
      accent: '#60A5FA',
      surface: '#1F2937',
      stat_caption: '#94A3B8',
    });
    const preview = document.querySelector('.tk-stat-preview') as HTMLElement;
    expect(preview).not.toBeNull();
    expect((preview.querySelector('strong') as HTMLElement).textContent).toBe('4 layers');
    expect((preview.querySelector('span') as HTMLElement).textContent).toBe(
      'Design system · analytics · site operations · human command',
    );
    expect(preview.style.background).toBe('#1F2937');
    expect(preview.style.getPropertyValue('--tk-stat-accent')).toBe('#60A5FA');
  });

  it('an empty stat row shows no preview chip (it would be noise)', () => {
    renderPanel(baseLanes, [{ figure: '', caption: '' }]);
    expect(document.querySelector('.tk-stat-preview')).toBeNull();
  });

  it('stat rows edit figure and caption; add/remove go through the document ops', () => {
    const { handlers } = renderPanel();
    const figure = screen.getByLabelText('Stat 1 figure') as HTMLInputElement;
    expect(figure.value).toBe('4 layers');
    fireEvent.change(figure, { target: { value: '1 week' } });
    expect(handlers.onStatChange).toHaveBeenCalledWith(0, 'figure', '1 week');
    fireEvent.change(screen.getByLabelText('Stat 1 caption'), {
      target: { value: 'Signal to monitored release' },
    });
    expect(handlers.onStatChange).toHaveBeenCalledWith(0, 'caption', 'Signal to monitored release');
    fireEvent.click(screen.getByRole('button', { name: /Add stat/ }));
    expect(handlers.onStatAdd).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Remove stat 4 layers' }));
    expect(handlers.onStatRemove).toHaveBeenCalledWith(0);
  });

  it('lane 0 starts open; the rest are one-line summaries', () => {
    renderPanel();
    expect(screen.getByLabelText('Expand lane 2: Frontstage')).toBeDefined();
    expect(screen.getByLabelText('Expand lane 3: AI agent workflow')).toBeDefined();
    // the open lane's fields exist
    expect(screen.getByLabelText('Lane 1 name')).toBeDefined();
    expect(screen.getByLabelText('Lane 1 kind')).toBeDefined();
    // lane 2's deep fields are NOT mounted (no wall of controls)
    expect(screen.queryByLabelText('Lane 2 kind')).toBeNull();
  });

  it('the click opens one lane and folds the previous', async () => {
    renderPanel();
    fireEvent.click(screen.getByLabelText('Expand lane 2: Frontstage'));
    await waitFor(() => {
      expect(screen.getByLabelText('Lane 2 kind')).toBeDefined();
      expect(screen.queryByLabelText('Lane 1 kind')).toBeNull();
    });
  });

  it('the fold button collapses the open lane', async () => {
    renderPanel();
    fireEvent.click(screen.getByLabelText('Collapse lane 1'));
    await waitFor(() => {
      expect(screen.getByLabelText(/Expand lane 1/)).toBeDefined();
      expect(screen.queryByLabelText('Lane 1 kind')).toBeNull();
    });
  });

  it('a newly added lane opens itself, ready for typing', async () => {
    const { rerender, handlers } = renderPanel();
    fireEvent.click(screen.getByRole('button', { name: /Add swimlane/ }));
    expect(handlers.onLaneAdd).toHaveBeenCalledOnce();
    const added = lane('lane-2', 'Lane 3', 'backstage');
    rerender(
      <VisualArchitect
        eyebrow="e" title="t" intro="i"
        stages={stages} lanes={[...baseLanes, added]}
        stats={[]}
        tintWarnings={{}} swatchVerdicts={{ '#FFFFFF': { pass: true, ratio: 14.4 } }}
        onMetaChange={handlers.onMetaChange} onStageChange={handlers.onStageChange}
        onStageAdd={handlers.onStageAdd} onStageRemove={handlers.onStageRemove}
        onStatChange={handlers.onStatChange} onStatAdd={handlers.onStatAdd}
        onStatRemove={handlers.onStatRemove}
        onLaneChange={handlers.onLaneChange} onLaneAdd={handlers.onLaneAdd}
        onLaneRemove={handlers.onLaneRemove}
      />,
    );
    await waitFor(() => expect(screen.getByLabelText('Lane 4 kind')).toBeDefined());
  });

  it('STAGES and LANES carry an info hint: the tip is linked to a labeled trigger, not hover-only decoration', () => {
    renderPanel();
    for (const label of ['About stats', 'About stages', 'About lanes']) {
      const trigger = screen.getByRole('button', { name: label });
      const tipId = trigger.getAttribute('aria-describedby');
      expect(tipId).toBeTruthy();
      const tip = document.getElementById(tipId as string);
      expect(tip?.getAttribute('role')).toBe('tooltip');
      expect(tip?.textContent?.length ?? 0).toBeGreaterThan(20);
    }
  });
});