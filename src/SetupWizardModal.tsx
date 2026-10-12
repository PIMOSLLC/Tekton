import { useEffect, useRef, useState } from 'react';
import { Flame, Trash2, X } from 'lucide-react';
import type { BlueprintSetup } from './core/useBlueprintDocument';
import { ModalCard } from './ModalCard';
import { ConfirmationModal } from './ConfirmationModal';
import type { LaneKind } from './types';
import { LANE_KINDS, laneKindLabel } from './types';

export interface SetupWizardModalProps {
  isOpen: boolean;
  onCreate(setup: BlueprintSetup): void;
  onCancel(): void;
}

const STEPS = ['Basics', 'Stages', 'Lanes', 'Review'] as const;

/** The classic service-blueprint lanes — the pedagogically correct default. */
const DEFAULT_LANES: { name: string; kind: LaneKind }[] = [
  { name: 'Customer actions', kind: 'customer' },
  { name: 'Frontstage experience', kind: 'frontstage' },
  { name: 'Backstage human actions', kind: 'backstage' },
  { name: 'Supporting systems', kind: 'systems' },
  { name: 'Governance', kind: 'governance' },
];

/**
 * SetupWizardModal — a GUIDED from-scratch start (owner direction: the setup
 * should walk users through the process step by step, not sit in one form).
 * Four steps with a visible stepper: Basics → Stages → Lanes → Review+Create.
 *
 * Each step teaches as it goes (the hints carry the starter template's
 * teaching text) and gates its own Next button. Cards are NOT authored here:
 * a wizard that invents bullet content lies to the author; the review step
 * says the created slots start EMPTY and the canvas marks them. Create is
 * parent-gated (the document's unsaved-work discard dialog) and lands clean.
 *
 * Closing guards the wizard's OWN progress: with typed-but-unsaved setup,
 * Esc/X ask first (nested ConfirmationModal; the topmost-modal rule in
 * ModalCard keeps the two dialogs' keyboard behavior straight).
 */
export function SetupWizardModal({ isOpen, onCreate, onCancel }: SetupWizardModalProps) {
  const [step, setStep] = useState(0);
  const [touched, setTouched] = useState(false);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  const [eyebrow, setEyebrow] = useState('Service blueprint · draft');
  const [title, setTitle] = useState('My New Blueprint');
  const [intro, setIntro] = useState('');
  const [stages, setStages] = useState<string[]>(['Discover', 'Define', 'Deliver']);
  const [lanes, setLanes] = useState<{ name: string; kind?: LaneKind }[]>(
    DEFAULT_LANES.map((l) => ({ ...l })),
  );

  // Step-scoped validity — each Next button refuses an incomplete step quietly
  // (the engine rejects empties loudly; the form refuses first).
  const stepValid = (s: number): boolean => {
    if (s === 0) return [eyebrow, title, intro].every((v) => v.trim().length > 0);
    if (s === 1) return stages.every((n) => n.trim().length > 0);
    if (s === 2) return lanes.every((l) => l.name.trim().length > 0);
    return true;
  };
  const ready = [0, 1, 2].every(stepValid);

  // Focus the step's first field when a step begins (keyboard users land in).
  useEffect(() => {
    if (!isOpen) return;
    bodyRef.current?.querySelector<HTMLElement>('input, textarea, select')?.focus();
  }, [step, isOpen]);

  if (!isOpen) return null;

  const attemptCancel = () => {
    if (touched) setConfirmingDiscard(true);
    else onCancel();
  };

  return (
    <>
      {confirmingDiscard ? (
        <ConfirmationModal
          isOpen
          variant="warning"
          title="Discard setup progress?"
          message="The setup you typed so far will be lost."
          confirmText="Discard"
          cancelText="Keep going"
          onConfirm={onCancel}
          onCancel={() => setConfirmingDiscard(false)}
        />
      ) : (
        <ModalCard
          labelledBy="tk-wizard-title"
          cardClassName="!max-w-3xl tk-wizard"
          scrimClassName="tk-fade-in"
          onEscape={attemptCancel}
        >
          <div className="px-8 pt-8 pb-5 border-b border-white/10">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* Brand icon: flame until the PIN-branded application icon lands */}
                <div className="p-2.5 bg-white/10 rounded-lg" aria-hidden="true">
                  <Flame className="w-6 h-6 text-brand-secondary" />
                </div>
                <div>
                  <h2
                    id="tk-wizard-title"
                    className="text-2xl font-black tracking-tighter text-white"
                  >
                    Blueprint setup
                  </h2>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Shape your grid — we&apos;ll guide the rest
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={attemptCancel}
                aria-label="Close setup wizard"
                className="tk-close shrink-0"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <ol className="tk-wizard-steps" aria-label="Setup steps">
              {STEPS.map((label, i) => (
                <li
                  key={label}
                  aria-current={i === step ? 'step' : undefined}
                  className={i === step ? 'is-current' : i < step ? 'is-done' : ''}
                >
                  <span className="tk-wizard-step-badge" aria-hidden="true">
                    {i < step ? '✓' : i + 1}
                  </span>
                  <span className="tk-wizard-step-label">{label}</span>
                </li>
              ))}
            </ol>
            <span className="sr-only" aria-live="polite">
              Step {step + 1} of {STEPS.length} — {STEPS[step]}
            </span>
          </div>

          <div className="px-8 py-6 overflow-y-auto max-h-[62vh]" ref={bodyRef} data-testid="wizard-body">
            <div className="tk-glass-panel">
            {step === 0 && (
              <>
                <p className="tk-wizard-note">
                  Name the blueprint — the title also names your file:{' '}
                  <code className="tk-wizard-filename">{`${
                    title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') ||
                    'my-blueprint'
                  }.yaml`}</code>
                </p>
                <div className="tk-field">
                  <span>Tagline</span>
                  <span className="tk-field-help">
                    The short label that sits above the title — a category, not a
                    sentence. Designers call this the &ldquo;eyebrow&rdquo;.
                  </span>
                  <input
                    type="text"
                    value={eyebrow}
                    aria-label="Wizard tagline"
                    placeholder="Service blueprint · first draft"
                    onChange={(e) => {
                      setTouched(true);
                      setEyebrow(e.target.value);
                    }}
                  />
                </div>
                <div className="tk-field">
                  <span>Title</span>
                  <span className="tk-field-help">What this blueprint is called.</span>
                  <input
                    type="text"
                    value={title}
                    aria-label="Wizard blueprint title"
                    placeholder="My First Service Blueprint"
                    onChange={(e) => {
                      setTouched(true);
                      setTitle(e.target.value);
                    }}
                  />
                </div>
                <div className="tk-field">
                  <span>Opening sentence</span>
                  <span className="tk-field-help">
                    One sentence that frames the service and the moment you are
                    designing for.
                  </span>
                  <textarea
                    rows={3}
                    value={intro}
                    aria-label="Wizard opening sentence"
                    placeholder="What is this service, and what moment is it for?"
                    onChange={(e) => {
                      setTouched(true);
                      setIntro(e.target.value);
                    }}
                  />
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <p className="tk-wizard-note">
                  Stages are TIME, left to right — the workflow's columns.
                </p>
                {stages.map((name, i) => (
                  <div className="tk-row-card" key={`w-stage-${i}`}>
                    <div className="tk-row-card-main">
                      <input
                        type="text"
                        value={name}
                        aria-label={`Wizard stage ${i + 1} name`}
                        onChange={(e) => {
                          setTouched(true);
                          setStages((prev) => prev.map((n, j) => (j === i ? e.target.value : n)));
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      className="tk-remove"
                      aria-label={`Remove wizard stage ${i + 1}`}
                      title={`Remove wizard stage ${i + 1}`}
                      disabled={stages.length <= 1}
                      onClick={() => {
                        setTouched(true);
                        setStages((prev) => prev.filter((_, j) => j !== i));
                      }}
                    >
                      <Trash2 aria-hidden="true" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="tk-add"
                  onClick={() => {
                    setTouched(true);
                    setStages((prev) => [...prev, `Stage ${prev.length + 1}`]);
                  }}
                >
                  + Add stage
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <p className="tk-wizard-note">
                  Lanes are the rows — who or what does the work. The kind drives
                  the row's default card color.
                </p>
                {lanes.map((lane, i) => (
                  <div className="tk-row-card" key={`w-lane-${i}`}>
                    <div className="tk-row-card-main">
                      <input
                        type="text"
                        value={lane.name}
                        aria-label={`Wizard lane ${i + 1} name`}
                        onChange={(e) => {
                          setTouched(true);
                          setLanes((prev) =>
                            prev.map((l, j) => (j === i ? { ...l, name: e.target.value } : l)),
                          );
                        }}
                      />
                      <select
                        value={lane.kind ?? ''}
                        aria-label={`Wizard lane ${i + 1} kind`}
                        onChange={(e) => {
                          setTouched(true);
                          setLanes((prev) =>
                            prev.map((l, j) =>
                              j === i
                                ? {
                                    ...l,
                                    kind:
                                      e.target.value === ''
                                        ? undefined
                                        : (e.target.value as LaneKind),
                                  }
                                : l,
                            ),
                          );
                        }}
                      >
                        <option value="">— no kind —</option>
                        {LANE_KINDS.map((k) => (
                          <option key={k} value={k}>{laneKindLabel(k)}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      className="tk-remove"
                      aria-label={`Remove wizard lane ${lane.name}`}
                      title={`Remove wizard lane ${lane.name}`}
                      disabled={lanes.length <= 1}
                      onClick={() => {
                        setTouched(true);
                        setLanes((prev) => prev.filter((_, j) => j !== i));
                      }}
                    >
                      <Trash2 aria-hidden="true" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="tk-add"
                  onClick={() => {
                    setTouched(true);
                    setLanes((prev) => [...prev, { name: `Lane ${prev.length + 1}`, kind: 'backstage' }]);
                  }}
                >
                  + Add lane
                </button>
              </>
            )}

            {step === 3 && (
              <>
                <p className="tk-wizard-note">
                  Ready when you are — the structure is yours from here.
                </p>
                <div className="tk-wizard-summary">
                  <span className="tk-wizard-title-line">{title}</span>
                  <span className="tk-wizard-eyebrow-line">{eyebrow}</span>
                  <span className="tk-wizard-intro-line">{intro}</span>
                </div>
                <div className="tk-wizard-math" data-testid="wizard-math">
                  <span>
                    {lanes.length} lanes × {stages.length} stages ={' '}
                    {lanes.length * stages.length} card slots
                  </span>
                  <span>
                    {stages.map((s) => s || '…').join(' → ') || '—'}
                  </span>
                  <span>
                    Lanes: {lanes.map((l) => l.name || '…').join(' · ') || '—'}
                  </span>
                </div>
                <p className="tk-wizard-note">
                  The {lanes.length * stages.length} slots start EMPTY — a wizard
                  that invents content lies; the canvas marks each slot for
                  filling the moment the blueprint opens.
                </p>
              </>
            )}
            </div>
          </div>

          <div className="px-8 py-5 border-t border-white/10 flex items-center gap-3">
            {step > 0 ? (
              <button
                type="button"
                className="tk-wizard-secondary"
                onClick={() => setStep((s) => s - 1)}
              >
                ← Back
              </button>
            ) : (
              <span />
            )}
            <span className="ml-auto text-[9px] font-mono text-gray-500">
              {step + 1}/{STEPS.length}
            </span>
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                className="tk-create"
                data-testid="wizard-next"
                disabled={!stepValid(step)}
                onClick={() => setStep((s) => s + 1)}
              >
                Next →
              </button>
            ) : (
              <button
                type="button"
                className="tk-create"
                data-testid="wizard-create"
                disabled={!ready}
                onClick={() =>
                  onCreate({
                    meta: { eyebrow, title, intro },
                    stages: stages.map((name) => ({ name })),
                    lanes,
                  })
                }
              >
                Create blueprint
              </button>
            )}
          </div>
        </ModalCard>
      )}
    </>
  );
}