import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ModalCard } from './ModalCard';

describe('ModalCard — the shared dialog chrome', () => {
  it('with nested modals, only the topmost dialog processes Esc', () => {
    const bottomEsc = vi.fn();
    const topEsc = vi.fn();
    render(
      <>
        <ModalCard labelledBy="bottom" onEscape={bottomEsc}>
          <h2 id="bottom">Bottom dialog</h2>
        </ModalCard>
        <ModalCard labelledBy="top" onEscape={topEsc}>
          <h2 id="top">Top dialog</h2>
        </ModalCard>
      </>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(topEsc).toHaveBeenCalledTimes(1);
    expect(bottomEsc).not.toHaveBeenCalled();
  });

  it('a lone dialog keeps full keyboard ownership (Esc + Tab wrap)', () => {
    const onEscape = vi.fn();
    render(
      <ModalCard labelledBy="solo" onEscape={onEscape}>
        <h2 id="solo">Solo</h2>
        <button type="button" data-testid="first">First</button>
        <button type="button" data-testid="last">Last</button>
      </ModalCard>,
    );
    // Initial focus goes to the card...
    expect(document.activeElement?.getAttribute('role')).toBe('dialog');
    // ...Tab from the last focusable wraps back to the first.
    screen.getByTestId('last').focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement?.getAttribute('data-testid')).toBe('first');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onEscape).toHaveBeenCalledTimes(1);
  });
});