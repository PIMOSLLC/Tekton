# The `tekton` CLI

The blueprint engine on the command line — the headless surface: everything
testable in CI, scripted pipelines, or batch workflows, no GUI required.

```sh
cargo run -p tekton-cli -- <command> <args>     # from a checkout
~/.../target/<triple>/release/tekton <cmd>      # the built binary, wherever your target dir lives (see .cargo/config.toml)
```

The binary is named `tekton`; in this workspace `cargo run -p tekton-cli --`
works from the repo root.

## Commands

### `tekton render <input>`

Renders a blueprint document to **self-contained HTML** — a real interactive
artifact: focusable cards, `aria-expanded`/`aria-controls` detail drawer,
keyboard-complete, print-ready, `prefers-reduced-motion` aware, zero external
requests.

| Flag | Short | Default | Meaning |
|---|---|---|---|
| `--output <path>` | `-o` | `<stem>-standalone.html` next to the input | write target |
| `--format <fmt>` | `-f` | `standalone` | the page format (see below) |

Output naming defaults to `<input-stem>-<format>.html`.

**The render path is a gate, not a formatter** — before writing anything it
runs the full engine pipeline:

1. **structural validation** — malformed documents refuse to render, with the
   complete issue list
2. **WCAG 2.2 contrast lint** — a theme failing AA **refuses to render**:
   each failing pair prints `element: fg on bg = ratio:1` plus the
   engine-computed suggested replacement color when one exists

Inaccessible blueprints cannot ship accidentally.

### `tekton lint <input> [--json]`

Lints the document's theme against WCAG 2.2 without rendering. One row per
pair (card text and stage tags against every lane tint — 31 pairs on the
shipped example):

```
  AA ok    AAA no [normal] cards: #141b3d on #f3f0ff = 10.21:1
 AA FAIL    AAA no [  small] stage tags: #566783 on #ffffff = 4.13:1 (suggested fg: #4a5568)
```

Columns: AA verdict, AAA verdict, text-size class (`normal`/`large` — per SC
1.4.3: ≥24px regular or ≥18.66px bold), element under test, foreground on
background, computed ratio, and — on AA failures — `suggested fg:` the
nearest passing replacement.

| Flag | Meaning |
|---|---|
| `--json` | machine mode: stdout is **pure JSON, one parseable document** (the full findings report, including per-pair suggestions); the human summary goes to stderr so pipelines stay clean |

Exit code: `0` when the theme passes AA, `1` on any AA failure — CI-friendly
by construction.

### `tekton validate <input>`

Structural validation only. Prints `[error]`/`[warning]` issue rows (including
lane/stage positioning for cards — each issue can name the exact card), and on
success prints the document summary shape:

```
[error] lanes[2].cards[1].title is required

valid: 5 stages × 8 lanes, 40 cards, note present: true
```

Exit code: `0` valid, `1` on any error-severity issue.

## Exit behavior (CI contract)

| Situation | `render` | `lint` | `validate` |
|---|---|---|---|
| success | `0` | `0` | `0` |
| invalid document (structure) | `1` | `1` (won't lint a malformed doc — the contrast math needs valid content) | `1` |
| theme fails WCAG AA | `1` (refuses to render) | `1` | — |
| bad file path / unreadable | `1` | `1` | `1` |

A typical CI gate order, matching the editor's own QA order:

```sh
tekton validate blueprints/*.yaml
tekton lint blueprints/*.yaml            # AA failures exit 1
tekton render  blueprints/*.yaml -f standalone -o dist/
```

## Container workflows

The image carries the CLI — no native toolchain needed on the host:

```sh
podman build -t phoenix-tekton .
podman compose up -d                     # the studio on :6041
podman run --rm -v .:/w:Z phoenix-tekton tekton lint /w/blueprints/my-blueprint.yaml
```

The `-o` flag matters with mounted volumes: rendered output defaults to
writing beside the input, which fails on read-only mounts — always pair a
read-only input mount with `-o` writing to a writable mount.

## Formats

`standalone` — a complete HTML page: everything needed to open, interact with,
and print the blueprint anywhere, with no network. This is the format the
shipped example uses.

(The JSON data layer — written alongside the rendered page by the editor's
export pair — is the same document this CLI reads as input; see
[docs/EDITOR.md](EDITOR.md).)