import { useState } from 'react';
import { Compass, BookOpen, Flame } from 'lucide-react';
import { ModalCard } from './ModalCard';

export interface WelcomeModalProps {
  isOpen: boolean;
  onStartWizard(): void;
  onStartWithTemplate(templateId: string): void;
  /** Dismissal; `neverAgain` = the user opted out of the boot invitation. */
  onDismiss(neverAgain: boolean): void;
}

/**
 * WelcomeModal — the boot-time setup INVITATION (owner direction: the wizard
 * should come up as a suggestion, with the user able to never see it again).
 * The styling is PIN's StartupWizard language: centered brand moment on the
 * scrim, two frosted action cards, and a "don't show again" preference row.
 *
 * The invitation itself is dismissible without consequence ("Not now" keeps
 * the preference); only the checkbox flips `showSetupOnStart` in the app
 * profile. Focus + Esc + the topmost-modal rule come from ModalCard; opening
 * the wizard REPLACES this (never two independent modals in flight).
 */
export function WelcomeModal(props: WelcomeModalProps) {
  const [neverAgain, setNeverAgain] = useState(false);
  if (!props.isOpen) return null;

  return (
    <ModalCard
      labelledBy="tk-welcome-title"
      cardClassName="!max-w-3xl tk-welcome"
      scrimClassName="tk-fade-in"
      onEscape={() => props.onDismiss(neverAgain)}
    >
      <div className="text-center px-10 pt-10">
        {/* Brand icon: flame until the PIN-branded application icon lands */}
        <Flame
          className="mx-auto h-14 w-14 text-brand-secondary"
          aria-hidden="true"
        />
        <h2 id="tk-welcome-title" className="mt-3 text-4xl font-bold text-white">
          Welcome to Phoenix Tekton
        </h2>
        <p className="mt-2 text-sm text-gray-200 text-balance">
          Map your service architecture: stages, lanes, and every critical
          handoff between them. What are we building today?
        </p>
      </div>

      <div className="px-10 mt-8 grid md:grid-cols-2 gap-6">
        <button
          type="button"
          className="p-6 bg-white/10 border border-white/20 rounded-lg text-left transition-all backdrop-blur-lg hover:bg-white/20 hover:border-white/30 shadow-lg motion-reduce:transition-none"
          onClick={props.onStartWizard}
        >
          <div className="flex items-center">
            <div className="p-3 bg-white/20 rounded-lg shrink-0" aria-hidden="true">
              <Compass className="h-7 w-7 text-white" />
            </div>
            <h3 className="ml-4 text-base font-semibold text-white text-balance">
              Design it with the setup wizard
            </h3>
          </div>
          <p className="mt-2 text-xs text-gray-200 leading-relaxed">
            A guided tour through tagline, title, stages, and lanes — your
            blueprint opens ready to fill.
          </p>
        </button>

        <button
          type="button"
          className="p-6 bg-white/10 border border-white/20 rounded-lg text-left transition-all backdrop-blur-lg hover:bg-white/20 hover:border-white/30 shadow-lg motion-reduce:transition-none"
          onClick={() => props.onStartWithTemplate('agentic-ai-ecommerce')}
        >
          <div className="flex items-center">
            <div className="p-3 bg-white/20 rounded-lg shrink-0" aria-hidden="true">
              <BookOpen className="h-7 w-7 text-white" />
            </div>
            <h3 className="ml-4 text-base font-semibold text-white text-balance">
              Read a finished example first
            </h3>
          </div>
          <p className="mt-2 text-xs text-gray-200 leading-relaxed">
            Open the agentic AI e-commerce example — a complete, published
            blueprint to learn from.
          </p>
        </button>
      </div>

      <div className="px-10 py-6 mt-6 flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="tk-welcome-optout"
            type="checkbox"
            checked={neverAgain}
            onChange={(e) => setNeverAgain(e.target.checked)}
            className="h-4 w-4 rounded border-gray-400 bg-white/20 text-brand-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-secondary"
          />
          <label
            htmlFor="tk-welcome-optout"
            className="ml-2 block text-sm text-gray-200 cursor-pointer"
          >
            Don&apos;t show this again
          </label>
        </div>
        <button
          type="button"
          onClick={() => props.onDismiss(neverAgain)}
          className="px-4 py-2 text-sm font-medium text-gray-200 hover:bg-white/10 rounded-md transition-colors motion-reduce:transition-none"
        >
          Not now
        </button>
      </div>
    </ModalCard>
  );
}