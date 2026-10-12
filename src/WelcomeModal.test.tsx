import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { WelcomeModal } from './WelcomeModal';

describe('WelcomeModal — the boot-time setup invitation', () => {
  const harness = () => {
    const calls = {
      wizard: 0,
      template: [] as string[],
      dismiss: [] as boolean[],
    };
    render(
      <WelcomeModal
        isOpen
        onStartWizard={() => {
          calls.wizard += 1;
        }}
        onStartWithTemplate={(id) => calls.template.push(id)}
        onDismiss={(neverAgain) => calls.dismiss.push(neverAgain)}
      />,
    );
    return calls;
  };

  it('invites with the two starting paths', () => {
    harness();
    expect(screen.getByText('Welcome to Phoenix Tekton')).toBeDefined();
    expect(screen.getByText(/setup wizard/)).toBeDefined();
    expect(screen.getByText(/finished example/)).toBeDefined();
  });

  it('renders nothing when closed', () => {
    const { container } = render(
      <WelcomeModal isOpen={false} onStartWizard={() => {}} onStartWithTemplate={() => {}} onDismiss={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('Esc dismisses while KEEPING the invitation preference', () => {
    const calls = harness();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(calls.dismiss).toEqual([false]);
  });

  it('the wizard card opens the guided flow', () => {
    const calls = harness();
    fireEvent.click(screen.getByText(/Design it with the setup wizard/));
    expect(calls.wizard).toBe(1);
    expect(calls.dismiss).toEqual([]);
  });

  it('the example card opens the worked case study', () => {
    const calls = harness();
    fireEvent.click(screen.getByText(/Read a finished example first/));
    expect(calls.template).toEqual(['agentic-ai-ecommerce']);
  });

  it('the checkbox + Not now opts the user out of future invitations', () => {
    const calls = harness();
    fireEvent.click(screen.getByLabelText("Don't show this again"));
    fireEvent.click(screen.getByRole('button', { name: 'Not now' }));
    expect(calls.dismiss).toEqual([true]);
  });
});