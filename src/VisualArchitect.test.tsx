import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { VisualArchitect, type SwatchVerdicts } from './VisualArchitect';
import type { BlueprintLane, BlueprintStage } from './types';

const stages: BlueprintStage[] = [
  { id: 's1', name: 'Signal' },
  { id: 's2', name: 'Analyze' },
];
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
function renderPanel(lanes: BlueprintLane[] = baseLanes) {
  const handlers = {
    onMetaChange: vi.fn(),
    onStageChange: vi.fn(),
    onStageAdd: vi.fn(),
    onStageRemove: vi.fn(),
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
      onLaneChange={handlers.onLaneChange}
      onLaneAdd={handlers.onLaneAdd}
      onLaneRemove={handlers.onLaneRemove}
    />,
  );
  return { ...view, handlers };
}

describe('VisualArchitect — grouped workflow panel with the lane accordion', () => {
  it('labels the three workflow groups (Document / Stages / Lanes)', () => {
    renderPanel();
    expect(screen.getByRole('group', { name: 'Document' })).toBeDefined();
    expect(screen.getByRole('group', { name: 'Stages' })).toBeDefined();
    expect(screen.getByRole('group', { name: 'Lanes' })).toBeDefined();
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
        tintWarnings={{}} swatchVerdicts={{ '#FFFFFF': { pass: true, ratio: 14.4 } }}
        onMetaChange={handlers.onMetaChange} onStageChange={handlers.onStageChange}
        onStageAdd={handlers.onStageAdd} onStageRemove={handlers.onStageRemove}
        onLaneChange={handlers.onLaneChange} onLaneAdd={handlers.onLaneAdd}
        onLaneRemove={handlers.onLaneRemove}
      />,
    );
    await waitFor(() => expect(screen.getByLabelText('Lane 4 kind')).toBeDefined());
  });
});