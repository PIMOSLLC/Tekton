import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CardInspector } from './CardInspector';
import type { BlueprintLane } from './types';

describe('CardInspector', () => {
  it('the card inspector edits ONLY the card — a lane-level control never rides in the card drawer', () => {
    const lane: BlueprintLane = {
      id: 'customer',
      name: 'Customer actions',
      kind: 'customer',
      interpretation: 'This is what you get',
      cards: [],
    };
    render(
      <CardInspector
        open
        lane={lane}
        stageName="Analyze"
        card={{ title: 'Consider options', blurb: 'Review details and product information' }}
        onCardChange={() => {}}
        onClose={() => {}}
      />,
    );

    // The card's own fields are present (the labels wrap their help text,
    // so the accessible read is the label's whole content)…
    expect(screen.getByLabelText(/^Card title/)).toBeDefined();
    expect(screen.getByLabelText(/^Card blurb/)).toBeDefined();
    // …and nothing lane-level: the interpretation edits in the Architect's
    // lane editor, never duplicated inside a card-level drawer (the owner's
    // catch: the field made the drawer claim lane scope it does not have).
    expect(screen.queryByLabelText(/Lane interpretation/)).toBeNull();
    expect(document.querySelectorAll('.tk-inspector-body textarea')).toHaveLength(1);
    expect(screen.getByText('Edit this card — the title and its supporting line.')).toBeDefined();
  });
});