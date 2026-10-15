# Tekton quick start — your first blueprint in ten minutes

The target: an **interactive service blueprint** — one self-contained HTML
document you can open, print, or share anywhere, exactly like the bundled
worked example (`fixtures/agentic-ai-ecommerce.yaml`). This guide is the
shortest path from install to a first export; the user guide
([EDITOR.md](EDITOR.md)) covers every surface in depth.

## 1 · Boot the studio

| Door | Command |
|---|---|
| **Desktop** | Install a release artifact — Fedora: `sudo dnf install ./phoenix-tekton-0.1.1-1.x86_64.rpm`; portable Linux: `chmod +x` the AppImage and run; Windows: double-click the verify-gated exe |
| **Container** | `podman run -d -p 6041:6041 phoenix-tekton:0.1.1` → open `http://localhost:6041` |
| **Dev server** | `npm run dev` (port 6041) → `http://localhost:6041` |

## 2 · Your first document

The studio boots with the bundled worked example already loaded — that is a
real blueprint you can inspect before authoring anything. To start fresh:

- **New** in StudioNav → pick a **template** (a worked example or the
  commented starter) or **From scratch** — the setup wizard walks four
  steps: identity (eyebrow/title/intro), **stages**, **lanes**.
- The wizard sizes the workspace exactly: stages × lanes card slots, all
  empty on purpose.

## 3 · The two-minute recipe

1. **Shape the model** — open the **Visual Architect** panel (StudioNav →
   Architect): rename stages and lanes, add more, set each lane's *kind*
   (customer / frontstage / agents / systems … — the kind chooses the row's
   tint; see [AUTHORING.md](AUTHORING.md)).
2. **Create the cards** — switch to **Build**: every lane row × stage column
   shows a cell. Click a dashed **"Untitled card"** where the lane meets the
   stage you mean; the Card Inspector opens; type the **title** (+ blurb).
   There is no add-card control — cards are born from slots (the full
   model: *Cards — born from slots* in [EDITOR.md](EDITOR.md)).
3. **Preview** — the toolbar's Preview renders the real engine output; the
   focus-layer dropdown, "Show all stages", and the card drawer work there.
4. **Mind the gate** — the Preview unlocks only when every slot has a
   title; the Structure light counts what remains ("N to fill"); the lint
   terminal's **fix →** jumps to a flagged slot or lane tint.
5. **Export the pair** — Export writes `slug-standalone.html` (the
   interactive artifact) plus the data layer (`slug.yaml` or `.json`).
6. **Name it — and rename it** — the blueprint's name is its **Title** (the
   header's name chip follows it live; one click on the chip jumps you to
   that field). Save — `Ctrl/Cmd+S` (`.yaml`; add Shift for `.json`) — and
   the file carries the name; a retitle renames at the next save. For a
   deliberate copy under another name, **Save As…**; autosave flushes to
   the browser between Saves — the header's chip shows the last flush, and
   restored work boots as unsaved.

## 4 · Zoom and pan on the canvas

- **Wheel / trackpad two-finger scroll** — one deliberate, cursor-anchored
  step per notch (≈7%): the zoom is determined and precise, never
  momentum-tossed.
- **Drag** to pan; **zoom buttons / double-click** step in a family of
  deliberate amounts; **Fit** shows all lanes and cards at once.

## Where to go deeper

- **[EDITOR.md](EDITOR.md)** — the studio user guide: panels, theme editor,
  contrast-lint workflows, focus rules
- **[AUTHORING.md](AUTHORING.md)** — the YAML document, field by field
  (the same document the editor edits)
- **[CLI.md](CLI.md)** — headless validate → lint → render for CI and batch
- **[ARCHITECTURE.md](ARCHITECTURE.md)** — why one engine serves the
  editor, the CLI, and the desktop shell