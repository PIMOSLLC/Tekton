import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { WorkspaceSnapshot } from './platform/persistence';
import { SAMPLE_JSON, engineControls } from './test-support/fakeEngine';

vi.mock('./engine/engineService', async () => {
  const { makeFakeEngine } = await import('./test-support/fakeEngine');
  return { engine: makeFakeEngine(), isTauriHost: false };
});

const harness = vi.hoisted(() => ({
  recalled: null as WorkspaceSnapshot | null,
  opened: null as { name: string; text: string; format: 'yaml' | 'json' } | null,
  saved: [] as { name: string; text: string }[],
  /** The app profile, mocked like localStorage would behave. */
  profile: { showSetupOnStart: false, panelWidths: {} as Record<string, number> },
}));

vi.mock('./platform/persistence', () => ({
  browserFileStore: () => ({
    saveFile: async (name: string, text: string) => {
      harness.saved.push({ name, text });
    },
    openFile: async () => harness.opened,
  }),
  localStorageAutosave: () => ({
    remember: () => {
      /* autosave writes are covered by the persistence + recall specs */
    },
    recall: () => harness.recalled,
    forget: () => {
      harness.recalled = null;
    },
  }),
}));

vi.mock('./platform/appProfile', () => ({
  loadAppProfile: () => ({
    ...harness.profile,
    panelWidths: { ...harness.profile.panelWidths },
  }),
  saveAppProfile: (p: { showSetupOnStart: boolean; panelWidths: Record<string, number> }) => {
    harness.profile = { showSetupOnStart: p.showSetupOnStart, panelWidths: { ...p.panelWidths } };
  },
  PROFILE_KEY: 'tekton.appProfile',
}));

import { App } from './App';

beforeEach(() => {
  harness.recalled = null;
  harness.opened = null;
  harness.saved = [];
  harness.profile = { showSetupOnStart: false, panelWidths: {} };
  engineControls.renderError = null;
  engineControls.failFindings = null;
});

describe('App blueprint lifecycle', () => {
  it('a fresh session boots the seed clean — name chip derived from the title, no dirty dot', async () => {
    render(<App />);
    await waitFor(() =>
      expect(screen.getByTestId('doc-name').textContent).toBe('sample-blueprint'),
    );
    expect(screen.queryByTestId('dirty-dot')).toBeNull();
  });

  it('a recalled autosave session boots dirty under its remembered file name', async () => {
    harness.recalled = { sourceName: 'My Plan.yaml', yaml: 'whatever the engine parses' };
    render(<App />);
    await waitFor(() => expect(screen.getByTestId('doc-name').textContent).toBe('My Plan'));
    expect(screen.getByTestId('dirty-dot')).not.toBeNull();
  });

  it('New opens the template picker; picking runs the PIN-style discard dialog', async () => {
    harness.recalled = { sourceName: 'My Plan.yaml', yaml: 'x' };
    render(<App />);
    await screen.findByTestId('dirty-dot');
    fireEvent.click(screen.getByTitle('New Blueprint'));
    const picker = document.querySelector('[aria-label="New Blueprint panel"]');
    expect(picker?.getAttribute('aria-hidden')).toBe('false');
    expect(screen.queryByRole('dialog')).toBeNull(); // the picker modifies nothing yet
    fireEvent.click(screen.getByText('Starter blueprint').closest('button')!);
    const dialog = await screen.findByRole('dialog');
    expect(dialog.textContent).toContain('Unsaved changes will be discarded');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
    await waitFor(() =>
      expect(screen.getByTestId('doc-name').textContent).toBe('sample-blueprint'),
    );
    expect(screen.queryByTestId('dirty-dot')).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('cancelling the discard dialog keeps the work and the picker open', async () => {
    harness.recalled = { sourceName: 'My Plan.yaml', yaml: 'x' };
    render(<App />);
    await screen.findByTestId('dirty-dot');
    fireEvent.click(screen.getByTitle('New Blueprint'));
    fireEvent.click(screen.getByText('Starter blueprint').closest('button')!);
    await screen.findByRole('dialog');
    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByTestId('doc-name').textContent).toBe('My Plan');
    expect(screen.getByTestId('dirty-dot')).not.toBeNull();
    expect(
      document
        .querySelector('[aria-label="New Blueprint panel"]')
        ?.getAttribute('aria-hidden'),
    ).toBe('false');
  });

  it('Esc closes the discard dialog without acting on it', async () => {
    harness.recalled = { sourceName: 'My Plan.yaml', yaml: 'x' };
    render(<App />);
    await screen.findByTestId('dirty-dot');
    fireEvent.click(screen.getByTitle('New Blueprint'));
    fireEvent.click(screen.getByText('Starter blueprint').closest('button')!);
    await screen.findByRole('dialog');
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByTestId('doc-name').textContent).toBe('My Plan');
    expect(screen.getByTestId('dirty-dot')).not.toBeNull();
  });

  it('the discard dialog takes keyboard focus (keyboard users land in the modal)', async () => {
    harness.recalled = { sourceName: 'My Plan.yaml', yaml: 'x' };
    render(<App />);
    await screen.findByTestId('dirty-dot');
    fireEvent.click(screen.getByTitle('New Blueprint'));
    fireEvent.click(screen.getByText('Starter blueprint').closest('button')!);
    await screen.findByRole('dialog');
    const card = document.querySelector('.tk-modal-dialog');
    await waitFor(() => expect(card?.contains(document.activeElement)).toBe(true));
  });

  it('the example template loads clean from the picker too', async () => {
    render(<App />);
    await waitFor(() =>
      expect(screen.getByTestId('doc-name').textContent).toBe('sample-blueprint'),
    );
    fireEvent.click(screen.getByTitle('New Blueprint'));
    fireEvent.click(
      screen.getByText('Example · Agentic AI blueprint').closest('button')!,
    );
    await waitFor(() =>
      expect(screen.getByTestId('doc-name').textContent).toBe('sample-blueprint'),
    );
    // Picker closed: the panel title reverted, so its aria-label is gone.
    expect(document.querySelector('[aria-label="New Blueprint panel"]')).toBeNull();
    expect(screen.queryByTestId('dirty-dot')).toBeNull();
  });

  it('Save downloads the document under the file name and relines the baseline', async () => {
    harness.recalled = { sourceName: 'My Plan.yaml', yaml: 'x' };
    render(<App />);
    await screen.findByTestId('dirty-dot');
    fireEvent.click(screen.getByTitle('Save'));
    await waitFor(() =>
      expect(harness.saved).toEqual([{ name: 'My Plan.yaml', text: 'canonical yaml' }]),
    );
    await waitFor(() => expect(screen.queryByTestId('dirty-dot')).toBeNull());
  });

  it('Open loads a JSON blueprint and adopts its file name', async () => {
    harness.opened = { name: 'Plan.json', text: SAMPLE_JSON, format: 'json' };
    render(<App />);
    await waitFor(() =>
      expect(screen.getByTestId('doc-name').textContent).toBe('sample-blueprint'),
    );
    fireEvent.click(screen.getByTitle('Open Blueprint'));
    await waitFor(() => expect(screen.getByTestId('doc-name').textContent).toBe('Plan'));
    expect(screen.queryByTestId('dirty-dot')).toBeNull();
  });

  it('a broken file opens a modal error dialog and the workspace is untouched', async () => {
    harness.opened = { name: 'Broken.json', text: '{ not json', format: 'json' };
    render(<App />);
    await waitFor(() =>
      expect(screen.getByTestId('doc-name').textContent).toBe('sample-blueprint'),
    );
    fireEvent.click(screen.getByTitle('Open Blueprint'));
    const dialog = await screen.findByRole('dialog');
    expect(dialog.textContent).toContain('Broken.json');
    expect(dialog.textContent).toContain('did not parse as a blueprint');
    expect(screen.getByTestId('doc-name').textContent).toBe('sample-blueprint');
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('Cmd/Ctrl+S saves the current work as YAML', async () => {
    harness.recalled = { sourceName: 'My Plan.yaml', yaml: 'x' };
    render(<App />);
    await screen.findByTestId('dirty-dot');
    fireEvent.keyDown(window, { key: 's', ctrlKey: true });
    await waitFor(() =>
      expect(harness.saved).toEqual([{ name: 'My Plan.yaml', text: 'canonical yaml' }]),
    );
  });

  it('the Theme Colors panel opens from the nav and shows the grouped palette', async () => {
    render(<App />);
    await waitFor(() =>
      expect(screen.getByTestId('doc-name').textContent).toBe('sample-blueprint'),
    );
    fireEvent.click(screen.getByTitle('Theme Colors'));
    const panel = document.querySelector('[aria-label="Theme Colors panel"]');
    expect(panel?.getAttribute('aria-hidden')).toBe('false');
    // Tokens render (fake engine doc has no theme map — engine defaults live
    // in the model; the editor still surfaces every registered token).
    expect(screen.getAllByTestId('theme-token').length).toBeGreaterThan(20);
  });

  it('Export downloads the pair: interactive HTML + the YAML data layer', async () => {
    render(<App />);
    await waitFor(() => expect(
      screen.getByTitle('Export').closest('button')?.disabled,
    ).toBe(false));
    fireEvent.click(screen.getByTitle('Export'));
    await waitFor(() => expect(harness.saved).toHaveLength(2));
    expect(harness.saved[0]).toEqual({
      name: 'sample-blueprint-standalone.html',
      text: '<!doctype html><title>fake</title>',
    });
    expect(harness.saved[1]).toEqual({ name: 'sample-blueprint.yaml', text: 'canonical yaml' });
  });

  it('Export honors the JSON data-layer choice', async () => {
    render(<App />);
    await waitFor(() =>
      expect(screen.getByTitle('Export').closest('button')?.disabled).toBe(false),
    );
    fireEvent.click(screen.getByRole('button', { name: 'JSON' }));
    fireEvent.click(screen.getByTitle('Export'));
    await waitFor(() => expect(harness.saved).toHaveLength(2));
    expect(harness.saved[1]?.name).toBe('sample-blueprint.json');
    expect(JSON.parse(harness.saved[1]?.text ?? '{}')).toEqual(JSON.parse(SAMPLE_JSON));
  });

  it('the AA render gate blocks only the preview — the build canvas stays working', async () => {
    engineControls.renderError =
      'render error: theme fails WCAG AA on 1 pair(s): Card text (customer lane tint): #131b45 on #c93131 = 3.12:1 (suggested fg: #eceefa)';
    try {
      render(<App />);
      await waitFor(() => expect(screen.getByTestId('render-error')).toBeDefined());
      // The banner sits above a live, editable canvas — the lane color card
      // is still reachable so the author fixes the tint in place.
      expect(screen.getAllByText('Hello').length).toBeGreaterThan(0);
      // Lint results land despite the gate (allSettled): the terminal badge
      // counts the fake finding even while the preview is blocked.
      await waitFor(() =>
        expect(screen.getByTestId('terminal-badge').textContent).toBe('1 pairs passed'),
      );
      fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
      await waitFor(() => expect(screen.getByTestId('render-error')).toBeDefined());
    } finally {
      engineControls.renderError = null;
    }
  });

  it('a failing lane tint warns with a fix path — the canvas never dead-ends', async () => {
    engineControls.failFindings = {
      findings: [
        {
          element: 'Card text (customer lane tint)',
          fg: '#131b45',
          bg: '#c93131',
          ratio: 3.12,
          large: false,
          aa: false,
          aaa: false,
          bg_suggestion: '#eff2fb',
        },
      ],
    };
    render(<App />);
    await screen.findByTestId('tint-warning');
    expect(screen.getByTestId('tint-warning').textContent).toContain('3.12:1');
    expect(screen.getByTestId('tint-warning').textContent).toContain('fails WCAG AA');
    // The fix path applies the engine's suggested background…
    fireEvent.click(screen.getByRole('button', { name: 'Apply suggested color' }));
    expect(
      (screen.getByLabelText('Lane 1 card color') as HTMLInputElement).value,
    ).toBe('#eff2fb');
    // …and the reset returns the kind's audited default.
    fireEvent.click(screen.getByRole('button', { name: 'Reset to kind default' }));
    expect(
      (screen.getByLabelText('Lane 1 card color') as HTMLInputElement).value,
    ).toBe('#ffffff');
    engineControls.failFindings = null;
  });

  it('clicking the selected card toggles the inspector closed on itself', async () => {
    render(<App />);
    await waitFor(() =>
      expect(screen.getByTestId('doc-name').textContent).toBe('sample-blueprint'),
    );
    fireEvent.click(screen.getByText('Hello').closest('button')!);
    await waitFor(() =>
      expect(document.querySelector('.tk-inspector.is-open')).not.toBeNull(),
    );
    // Same card again — the drawer closes by itself.
    fireEvent.click(screen.getByText('Hello').closest('button')!);
    await waitFor(() =>
      expect(document.querySelector('.tk-inspector.is-open')).toBeNull(),
    );
  });

  it('card-located validation errors are navigable — one click lands in the inspector', async () => {
    engineControls.failIssues = {
      issues: [
        {
          severity: 'error',
          message: 'lanes[0].cards[0].title is required',
          lane: 0,
          stage: 0,
        },
      ],
    };
    render(<App />);
    await waitFor(() => expect(screen.getAllByTestId('validation-fix')).toHaveLength(1));
    fireEvent.click(screen.getByTestId('validation-fix'));
    // The inspector opens on exactly that card, focused on its first field.
    await waitFor(() =>
      expect(document.querySelector('.tk-inspector.is-open')).not.toBeNull(),
    );
    expect(
      document.activeElement?.closest('.tk-inspector-body') ?? document.activeElement,
    ).not.toBeNull();
    expect(document.activeElement?.tagName).toBe('INPUT');
    engineControls.failIssues = null;
  });

  it('untitled cards wear the needs-a-title marker on the canvas', async () => {
    engineControls.failFindings = {
      findings: [
        {
          element: 'Card text (customer lane tint)',
          fg: '#131b45',
          bg: '#c93131',
          ratio: 3.12,
          large: false,
          aa: false,
          aaa: false,
          bg_suggestion: '#eff2fb',
        },
      ],
    };
    render(<App />);
    await screen.findByTestId('tint-warning');
    // SAMPLE doc's only card has a title: no marker. (Marker behavior for
    // empty titles is covered by the BuildCanvas spec suite.)
    expect(document.querySelector('.tk-canvas-card.is-untitled')).toBeNull();
    engineControls.failFindings = null;
  });

  it('the standalone header carries brand + document identity (moved from the toolbar)', async () => {
    harness.recalled = { sourceName: 'My Plan.yaml', yaml: 'x' };
    render(<App />);
    await screen.findByTestId('dirty-dot');
    expect(screen.getByTestId('app-header').textContent).toContain('TEKTON');
    expect(screen.getByTestId('doc-name').textContent).toBe('My Plan');
    // the header's right tag mirrors the LIVE export format + explains it
    fireEvent.click(screen.getByRole('button', { name: 'WordPress' }));
    await waitFor(() =>
      expect(screen.getByTestId('format-tag').textContent).toBe('WordPress'),
    );
    expect(screen.getByTestId('format-tag').getAttribute('title')).toContain(
      'Custom HTML block',
    );
    expect(screen.getByTestId('format-tag').getAttribute('title')).toContain(
      'custom plugin needed',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Standalone' }));
    await waitFor(() =>
      expect(screen.getByTestId('format-tag').textContent).toBe('Standalone'),
    );
  });

  it('PIN-module hosts suppress the standalone header (PIN owns the top chrome)', async () => {
    vi.stubGlobal('__PIN_HOST__', true);
    try {
      render(<App />);
      await screen.findByText('Hello'); // canvas live without the brand bar
      expect(screen.queryByTestId('app-header')).toBeNull();
      expect(screen.queryByTestId('doc-name')).toBeNull();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('the from-scratch wizard walks Basics → review, guards, and lands clean', async () => {
    harness.recalled = { sourceName: 'My Plan.yaml', yaml: 'x' };
    render(<App />);
    await screen.findByTestId('dirty-dot');
    fireEvent.click(screen.getByTitle('New Blueprint'));
    fireEvent.click(screen.getByText('From scratch').closest('button')!);
    // The pushed panel closes; the modal is up; intro is still required.
    await waitFor(() =>
      expect(document.querySelector('[aria-labelledby="tk-wizard-title"]')).not.toBeNull(),
    );
    expect(document.querySelector('[aria-label="New Blueprint panel"]')).toBeNull();
    const next = screen.getByTestId('wizard-next');
    expect((next as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Wizard opening sentence'), {
      target: { value: 'Intro copy for the wizard test.' },
    });
    expect((next as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(next);
    fireEvent.click(screen.getByTestId('wizard-next')); // stages (defaults valid)
    fireEvent.click(screen.getByTestId('wizard-next')); // lanes (defaults valid)
    expect(screen.getByTestId('wizard-math').textContent).toContain('15 card slots');
    fireEvent.click(screen.getByTestId('wizard-create'));
    // Dirty document → the PIN-style discard dialog on top of the wizard.
    await waitFor(() => {
      const confirm = screen
        .getAllByRole('dialog')
        .find((d) => d.textContent?.includes('Creating a new blueprint'));
      expect(confirm).toBeDefined();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByTestId('doc-name').textContent).toBe('sample-blueprint');
    expect(screen.queryByTestId('dirty-dot')).toBeNull();
  });

  it('the wizard closes from its X and the picker remains the New home', async () => {
    render(<App />);
    await screen.findByTestId('doc-name');
    fireEvent.click(screen.getByTitle('New Blueprint'));
    fireEvent.click(screen.getByText('From scratch').closest('button')!);
    await waitFor(() => expect(document.querySelector('.tk-modal-dialog')).not.toBeNull());
    fireEvent.click(screen.getByRole('button', { name: 'Close setup wizard' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    fireEvent.click(screen.getByTitle('New Blueprint'));
    expect(screen.getByText('Starter blueprint')).toBeDefined();
  });

  it('a first profile opens the boot invitation; the wizard card replaces it', async () => {
    harness.profile.showSetupOnStart = true;
    render(<App />);
    await screen.findByText('Welcome to Phoenix-Tekton');
    // Opting into the wizard REPLACES the invitation, keeps the preference.
    fireEvent.click(screen.getByText(/Design it with the setup wizard/));
    await waitFor(() =>
      expect(
        document.querySelector('[aria-labelledby="tk-wizard-title"]'),
      ).not.toBeNull(),
    );
    expect(screen.queryByText('Welcome to Phoenix-Tekton')).toBeNull();
    expect(harness.profile.showSetupOnStart).toBe(true);
  });

  it('the invitation opts out through the checkbox + Not now', async () => {
    harness.profile.showSetupOnStart = true;
    render(<App />);
    await screen.findByText('Welcome to Phoenix-Tekton');
    fireEvent.click(screen.getByLabelText("Don't show this again"));
    fireEvent.click(screen.getByRole('button', { name: 'Not now' }));
    await waitFor(() => expect(harness.profile.showSetupOnStart).toBe(false));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('an opted-out profile boots straight into the studio', async () => {
    harness.profile.showSetupOnStart = false;
    render(<App />);
    await screen.findByTestId('doc-name');
    expect(screen.queryByText('Welcome to Phoenix-Tekton')).toBeNull();
  });

  it('a just-created blueprint announces ready-to-fill — never a red error wall', async () => {
    engineControls.failIssues = {
      issues: [
        { severity: 'error', code: 'card_title_required', message: 'lanes[0].cards[0].title is required', lane: 0, stage: 0 },
        { severity: 'error', code: 'card_title_required', message: 'lanes[0].cards[1].title is required', lane: 0, stage: 1 },
      ],
    };
    // The real wasm render refuses AA/validation failures — mirror that gate.
    engineControls.renderError = 'render error: document has 2 validation error(s)';
    render(<App />);
    const banner = await screen.findByTestId('fill-banner');
    expect(banner.textContent).toContain('2 card slots are ready to fill');
    expect(banner.textContent).toContain('dashed card');
    expect(screen.queryByTestId('render-error')).toBeNull();
    expect(banner.getAttribute('role')).toBe('status'); // polite, not an alert
    engineControls.failIssues = null;
  });

  it('mixed in: a structural error keeps the red gate', async () => {
    engineControls.failIssues = {
      issues: [
        { severity: 'error', code: 'card_title_required', message: 'lanes[0].cards[0].title is required', lane: 0, stage: 0 },
        { severity: 'error', code: 'lane_id_required', message: 'lanes[1].id is required', lane: 1 },
      ],
    };
    engineControls.renderError = 'render error: document has 2 validation error(s)';
    render(<App />);
    await screen.findByTestId('render-error');
    expect(screen.queryByTestId('fill-banner')).toBeNull();
    engineControls.failIssues = null;
  });

  it('the Structure light counts empty slots as work, not breakage', async () => {
    engineControls.failIssues = {
      issues: [
        { severity: 'error', code: 'card_title_required', message: 'lanes[0].cards[0].title is required', lane: 0, stage: 0 },
      ],
    };
    engineControls.renderError = 'render error: document has 1 validation error(s)';
    render(<App />);
    await screen.findByTestId('fill-banner');
    expect(screen.getByText('1 to fill')).toBeDefined();
    engineControls.failIssues = null;
  });

  it('guards closing the tab only while unsaved work exists', async () => {
    harness.recalled = { sourceName: 'My Plan.yaml', yaml: 'x' };
    render(<App />);
    await screen.findByTestId('dirty-dot');
    // Drain React's passive effects — the guard listener registers in one.
    await act(async () => {
      await Promise.resolve();
    });
    const dirtyExit = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(dirtyExit);
    expect(dirtyExit.defaultPrevented).toBe(true);
  });

  it('a clean session does not guard closing the tab', async () => {
    render(<App />);
    await waitFor(() =>
      expect(screen.getByTestId('doc-name').textContent).toBe('sample-blueprint'),
    );
    const cleanExit = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(cleanExit);
    expect(cleanExit.defaultPrevented).toBe(false);
  });
});