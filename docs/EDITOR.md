# The Tekton editor — user guide

New here? **[QUICK_START.md](QUICK_START.md)** is the ten-minute path from
install to a first export; this guide is the full reference.

The studio shell (from a browser at the dev server's address, or a desktop
installer) is organized as one persistent workspace:

```
StudioNav ┆ panels ┆ workspace column (AppHeader · toolbar · canvas · docks · footer)
```

The nav and panels **push** the workspace — they never float over it — so the
canvas is always visible while you shape the document.

## The shell

- **StudioNav** — collapsible: a 56px icon rail or a 240px labeled menu. The
  menu groups: **Document** (New · Open · Save · Save JSON), **Author**
  (Visual Architect · YAML · Theme), and **Ship** (Export).
- **AppHeader** — brand + the document's identity: the name derived from
  `meta.title`, plus the save-state chip (a green tag timestamps the last
  autosave flush; an amber dot means genuinely unprotected work — the file
  hasn't been Saved since the last change).
- **Panels** — pushed panes with user-resizable widths (280–760px, drag the
  gap or use the resize affordance; widths persist per session profile).
- **StatusFooter** — always-visible verdict row: the WCAG light (the
  contrast-lint state at a glance), engine status, and the editor's quiet
  telemetry.

## Document lifecycle

| Action | Behavior |
|---|---|
| **New** | Opens the starter picker: **Starter** (the commented teaching document) or the **agentic-AI e-commerce example** — or **from scratch** via the setup wizard |
| **Setup wizard** | Four steps — basics (eyebrow/title/intro), stages, lanes (the five classic defaults pre-filled), cards land intentionally empty: the dashed amber slots *are* your work list — click one to create its card |
| **Open** | `.yaml` (canonical) or `.json` — auto-detected; confirmed when the document is dirty |
| **Save / Save JSON** | Writes `slug.yaml` or `slug.json` (the slug derived from `meta.title`) |
| **Dirty tracking** | Confirm-on-New/Open, `beforeunload` guard, and localStorage autosave; a restore boots **dirty** — restored work is unsaved work, kept honest by the chip |

## Authoring surfaces

**Visual Architect** — the blueprint as the grid it is:
- lane list with one-open lane cards, collapsed summaries (name · kind chip ·
  tint dot), auto-open on add
- stage and lane editing; cards open into the **Card Inspector** (title,
  blurb, positioning feedback from the validator with lane/stage context)
- per-lane **card tint**: kind default (theme-driven) or an explicit
  `#rrggbb` — a failing tint shows an inline AA verdict with
  **Apply suggested color** (the engine computes a passing replacement that
  keeps the shared card text) or **Reset to kind default**

**YAML panel** — the document itself, as a first-class authoring surface (a
wide pane, not a peek). The YAML is live truth: edit, and the whole studio
reflects it. Hand-authored documents from `templates/starter.yaml` land here
verbatim.

## Cards — born from slots

The document is a closed **lane × stage matrix**: each lane carries exactly
one card slot per stage column. There are no "add card" or "delete card"
controls — cards are not entries in a list; they are born by filling a slot.

- **Slots come from the shape.** Adding a stage gives *every* lane a new
  slot; adding a lane gives a full row of slots; the setup wizard pre-shapes
  the whole matrix from your stage/lane answers and leaves it empty.
- **To create a card:** on the Build canvas, click the dashed cell at the
  lane row × stage column you want — it reads **"Untitled card"**. The
  Card Inspector opens; type the title (required — `blurb` is optional) and
  the slot *becomes* the card.
- **Empty slots are the work list, not breakage.** The Structure light
  counts them ("N to fill"); the preview and Export unlock only when every
  slot has a title. The gate banner is the to-do list — and "fix →" in the
  lint terminal navigates straight to the flagged slot.
- **The same rule in the YAML panel:** each lane's `cards` array, one entry
  per stage, in stage order — [docs/AUTHORING.md](AUTHORING.md) is the
  format-level spec (card = the lane×stage intersection).

## Theming

The **Theme** panel exposes all **34 tokens** of the document theme, grouped
(Band → Grid & lanes → Stage headers → Cards & interaction → Accent → Lane
tints → Secondary text), with a live WCAG verdict while you work.

- **Presets**: Light default ↔ Dark studio; plus the two **AAA
  high-contrast** presets. Preset apply is guarded — a preset that fails its
  audit is refused rather than half-applied.
- The render **gate** applies here too: the PREVIEW/Export path refuses an
  AA-failing theme (with the same per-pair verdicts the CLI prints), while
  the build canvas stays fully editable — you're never boxed into an
  inaccessible corner without an exit; you're just blocked from shipping it.

## The contrast-lint terminal

A docked terminal over the workspace footer, boot **closed** — the footer's
WCAG light is the always-visible verdict, opening the drawer stays a choice.

Rows read like the CLI's: element under test → foreground on background →
ratio → AA/AAA verdict (+ suggested fg on failures). Findings that map to a
lane tint are **navigable**: "fix →" opens that lane's tint editor.

## Canvas and toolbar

- **BuildCanvas** — the grid, stage columns × lane rows, with divider bands
  and the evidence note.
- **CanvasViewport** — pan/zoom; a dot-grid toggle; **fit to view** (true
  content-fit) with a fit-on-init option; zoom controls live bottom-center in
  the workspace, the % readout on a tabular-numeric rhythm so live zoom
  changes don't shake the layout.
- **Deterministic zoom** — one wheel notch ≈ **7%** (cursor-anchored; scroll
  ripples bank until a notch's worth accrues, so trackpads stay precise),
  button presses 15%, double-click 20% — one family of deliberate amounts,
  clamped 15%–300%, never momentum-tossed by the raw delta.
- **Toolbar** — the Ship zone in three grouped clusters (view state, canvas
  tools, export pair). Export writes the **pair**: `slug-standalone.html`
  (the self-contained interactive artifact) + the data layer
  (`slug.yaml`/`slug.json`, per the toolbar choice) — the same artifact Save
  writes, in the same shape.

## Panels, focus, and one-layer-at-a-time

- Panel widths resize via the drag gap (the gap itself is the affordance —
  content → scrollbar → grip in three clean layers) or arrow keys; **Home**
  restores defaults.
- **Esc closes exactly one layer** — a drawer or a panel, never everything at
  once.
- The Welcome invitation (the guided starter picker at boot) can be disabled
  with "don't show again" — the choice persists in the session profile.
- State changes announce or show; nothing important is hover-only.
- `prefers-reduced-motion` is honored throughout.

## What the studio edits and what the engine owns

The studio is deliberately a **view**: every edit mutates the document (YAML/
JSON), which re-runs the same engine pipeline the CLI uses — validate → lint
→ render. The editor never hand-draws a state the engine didn't verify. That
is why the YAML panel and the canvas never disagree, and why [docs/CLI.md](CLI.md)
and this guide describe the same behaviors.