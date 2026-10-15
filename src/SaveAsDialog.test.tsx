import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SaveAsDialog, withFormatExtension } from './SaveAsDialog';

function renderDialog(props: Partial<Parameters<typeof SaveAsDialog>[0]> = {}) {
  const handlers = { onSave: vi.fn(), onCancel: vi.fn() };
  render(
    <SaveAsDialog
      open
      initialName="sample-blueprint"
      initialFormat="yaml"
      onSave={handlers.onSave}
      onCancel={handlers.onCancel}
      {...props}
    />,
  );
  return handlers;
}

describe('SaveAsDialog — the deliberate copy', () => {
  it('offers the current slug and the workspace format, and announces the resolved file name', () => {
    renderDialog();
    expect((screen.getByTestId('save-as-name') as HTMLInputElement).value).toBe('sample-blueprint');
    expect(screen.getByText('sample-blueprint.yaml')).toBeDefined();
    expect((screen.getByRole('button', { name: 'Save the copy' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('always lands the format\'s extension — a typed one is replaced, never doubled', () => {
    expect(withFormatExtension('report', 'yaml')).toBe('report.yaml');
    expect(withFormatExtension('report.json', 'yaml')).toBe('report.yaml');
    expect(withFormatExtension('report', 'json')).toBe('report.json');
    expect(withFormatExtension('  ', 'json')).toBe('blueprint.json');
  });

  it('Enter saves with the chosen format', () => {
    const handlers = renderDialog();
    fireEvent.change(screen.getByTestId('save-as-name'), { target: { value: 'Final Report' } });
    fireEvent.click(screen.getByRole('button', { name: 'JSON' }));
    fireEvent.keyDown(screen.getByTestId('save-as-name'), { key: 'Enter' });
    expect(handlers.onSave).toHaveBeenCalledWith('Final Report.json', 'json');
  });

  it('Esc cancels', () => {
    const handlers = renderDialog();
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(handlers.onCancel).toHaveBeenCalled();
  });

  it('an empty name holds the Save button (the fallback slug still saves a copy)', () => {
    const handlers = renderDialog();
    fireEvent.change(screen.getByTestId('save-as-name'), { target: { value: '   ' } });
    expect((screen.getByRole('button', { name: 'Save the copy' }) as HTMLButtonElement).disabled).toBe(true);
    expect(handlers.onSave).not.toHaveBeenCalled();
  });

  it('opens focused on the name, with it selected for immediate replacement', async () => {
    renderDialog();
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByTestId('save-as-name'));
      const input = screen.getByTestId('save-as-name') as HTMLInputElement;
      expect(input.selectionStart).toBe(0);
      expect(input.selectionEnd).toBe(input.value.length);
    });
  });
});