import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ConfirmationModal } from './ConfirmationModal';

describe('ConfirmationModal (the PIN-family dialog)', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <ConfirmationModal
        isOpen={false}
        title="T"
        message="M"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders a labelled modal dialog with the message', () => {
    render(
      <ConfirmationModal
        isOpen
        title="Discard blueprint?"
        message="Unsaved changes go away."
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(screen.getByText('Discard blueprint?')).toBeDefined();
    expect(screen.getByText('Unsaved changes go away.')).toBeDefined();
  });

  it('confirm and cancel buttons fire their callbacks', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmationModal isOpen title="T" message="M" onConfirm={onConfirm} onCancel={onCancel} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('okOnly mode renders a single button — the window.alert replacement', () => {
    render(
      <ConfirmationModal
        isOpen
        okOnly
        title="Action failed"
        message="Bad file."
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getAllByRole('button', { name: /OK|Confirm/i })).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Keep editing' })).toBeNull();
  });

  it('Esc cancels the dialog', () => {
    const onCancel = vi.fn();
    render(
      <ConfirmationModal isOpen title="T" message="M" onConfirm={() => {}} onCancel={onCancel} />,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});