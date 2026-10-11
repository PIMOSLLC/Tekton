import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SetupWizardModal, type SetupWizardModalProps } from './SetupWizardModal';
import type { BlueprintSetup } from './core/useBlueprintDocument';

describe('SetupWizardModal — the guided from-scratch flow', () => {
  function renderWizard(overrides?: Partial<SetupWizardModalProps>) {
    const created: { setup: BlueprintSetup | null; cancelled: number } = {
      setup: null,
      cancelled: 0,
    };
    const props: SetupWizardModalProps = {
      isOpen: true,
      onCreate: (setup) => {
        created.setup = setup;
      },
      onCancel: () => {
        created.cancelled += 1;
      },
      ...overrides,
    };
    render(<SetupWizardModal {...props} />);
    return created;
  }

  it('renders a labelled stepped modal', () => {
    renderWizard();
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(screen.getByRole('heading', { name: 'Blueprint setup' })).toBeDefined();
    expect(screen.getByText('Basics')).toBeDefined();
    expect(screen.getByText('Review')).toBeDefined();
  });

  it('renders nothing when closed', () => {
    const { container } = render(<SetupWizardModal isOpen={false} onCreate={() => {}} onCancel={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('gates its own Next — an incomplete step refuses quietly', () => {
    renderWizard();
    const next = screen.getByTestId('wizard-next');
    expect((next as HTMLButtonElement).disabled).toBe(true); // intro empty by default
    fireEvent.change(screen.getByLabelText('Wizard opening sentence'), {
      target: { value: 'Now complete' },
    });
    expect((screen.getByTestId('wizard-next') as HTMLButtonElement).disabled).toBe(false);
  });

  it('walks to Review with the live math and Create hands over the shaped setup', () => {
    const created = renderWizard();
    fireEvent.change(screen.getByLabelText('Wizard opening sentence'), { target: { value: 'i' } });
    fireEvent.click(screen.getByTestId('wizard-next'));
    fireEvent.click(screen.getByTestId('wizard-next'));
    fireEvent.click(screen.getByTestId('wizard-next'));
    // Defaults: 5 classic lanes × 3 stages.
    expect(screen.getByTestId('wizard-math').textContent).toContain('15 card slots');
    expect(screen.getByTestId('wizard-create')).toBeDefined();
    fireEvent.click(screen.getByTestId('wizard-create'));
    expect(created.setup?.meta.title).toBe('My New Blueprint');
    expect(created.setup?.stages).toHaveLength(3);
    expect(created.setup?.lanes).toHaveLength(5);
    expect(created.setup?.lanes[0]?.kind).toBe('customer');
    // The setup carries NO cards — content is the canvas's job, not the wizard's.
  });

  it('Back navigates without losing typed state, and focus lands in the step', () => {
    renderWizard();
    fireEvent.change(screen.getByLabelText('Wizard opening sentence'), { target: { value: 'kept' } });
    fireEvent.click(screen.getByTestId('wizard-next'));
    fireEvent.change(screen.getByLabelText('Wizard stage 1 name'), {
      target: { value: 'Custom stage' },
    });
    fireEvent.click(screen.getByRole('button', { name: '← Back' }));
    expect((screen.getByLabelText('Wizard opening sentence') as HTMLInputElement).value).toBe('kept');
    fireEvent.click(screen.getByTestId('wizard-next'));
    expect(
      (screen.getByLabelText('Wizard stage 1 name') as HTMLInputElement).value,
    ).toBe('Custom stage');
  });

  it('focus reaches the step\u2019s first field when a step begins', async () => {
    renderWizard();
    fireEvent.change(screen.getByLabelText('Wizard opening sentence'), { target: { value: 'i' } });
    fireEvent.click(screen.getByTestId('wizard-next'));
    await waitFor(() =>
      expect(document.activeElement?.getAttribute('aria-label')).toBe('Wizard stage 1 name'),
    );
  });

  it('Esc with no progress cancels immediately', () => {
    const created = renderWizard();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(created.cancelled).toBe(1);
    expect(screen.queryByRole('button', { name: 'Discard' })).toBeNull();
  });

  it('Esc with typed progress asks first — Keep going stays, Discard cancels', async () => {
    const created = renderWizard();
    fireEvent.change(screen.getByLabelText('Wizard opening sentence'), { target: { value: 'typed' } });
    fireEvent.keyDown(document, { key: 'Escape' });
    const discard = await screen.findByRole('button', { name: 'Discard' });
    expect(created.cancelled).toBe(0); // the ask comes first
    fireEvent.click(screen.getByRole('button', { name: 'Keep going' }));
    await waitFor(() => expect(discard.ownerDocument.querySelectorAll('.tk-modal-dialog')).toHaveLength(1));
    expect(screen.getByTestId('wizard-next')).toBeDefined(); // still on the wizard
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(await screen.findByRole('button', { name: 'Discard' }));
    expect(created.cancelled).toBe(1);
  });

  it('the X button runs the same touched-cancel path', () => {
    const created = renderWizard();
    fireEvent.change(screen.getByLabelText('Wizard opening sentence'), { target: { value: 'typed' } });
    fireEvent.click(screen.getByRole('button', { name: 'Close setup wizard' }));
    expect(screen.getByText('Discard setup progress?')).toBeDefined();
    expect(created.cancelled).toBe(0);
  });
});