# Authoring blueprints — the YAML format

Tekton's document format **is** the blueprint. A YAML file fully describes one
interactive service blueprint; the visual editor is a view of it, not the
opposite. You can author a complete blueprint in any text editor, generate it
with a script, or review it in a PR — the engine, the editor, and the CLI all
work from the same artifact.

Two files do the teaching here — read them alongside this reference:

- [`templates/starter.yaml`](../templates/starter.yaml) — a commented, minimal-but-complete starter
- [`fixtures/agentic-ai-ecommerce.yaml`](../fixtures/agentic-ai-ecommerce.yaml) — a real deployed blueprint (every feature in use)

## One document, one grid

```
stages → (columns) the flow of time
lanes  → (rows)    who or what does the work
card   → the lane×stage intersection — what happens when this role meets this moment
```

The model is intentionally strict (`deny_unknown_fields` everywhere): a typo'd
or misplaced key fails parsing loudly instead of silently producing an empty
grid.

A minimal, complete document:

```yaml
meta:
  eyebrow: "Service blueprint · draft"
  title: "Onboarding a new client"
  intro: >-
    Frame the service, the scope, and the moment you are designing for.

stages:
  - id: discover
    name: Discover
    blurb: "How the need first appears"

lanes:
  - id: customer
    kind: customer
    name: "Customer actions"
    blurb: "What the customer actually does"
    cards:
      - { title: "Arrives with a goal", blurb: "What brings them in" }

note:
  label: "Scope and evidence:"
  body: >-
    What the blueprint assumes and what is out of scope.
```

## The document, field by field

| Field | Type | Rules |
|---|---|---|
| `meta` | object | **required.** `eyebrow`, `title`, `intro` — all three are required; the editor derives file names from `meta.title`. |
| `stats` | list of `{ figure, caption }` | optional. At-a-glance figures in the band above the grid (e.g. `figure: "4 stages"`). Omit the block entirely when unused. |
| `stages` | list of `{ id, name, blurb? }` | **required,** ordered. `id` must be unique and required; `blurb` optional. Order defines the grid's columns. |
| `lanes` | list of `{ id, name, blurb?, divider?, kind?, tint?, interpretation?, cards }` | **required,** ordered. `cards` — **exactly one card per stage, in stage order**. |
| `note` | `{ label?, body }` | optional but strongly encouraged: the scope-and-evidence disclosure printed below the grid. |
| `theme` | `{ token: "#rrggbb", … }` | optional — omit for the audited default palette. Any subset of the 34 tokens. |

### Card

`{ title, blurb }` — `title` is required (the engine refuses empty card titles);
`blurb` may be empty. That's the whole card: the depth lives in lanes,
dividers, and interpretive text, not in card bloat.

A card exists at every lane×stage intersection as an **empty slot**; in the
editor the same rule reads as a gesture — click the dashed *Untitled* slot at
the lane row × stage column and give it a title (cards are born from slots,
never added to a list: see the "Cards — born from slots" section in
[docs/EDITOR.md](EDITOR.md)).

### Lane

| Field | Meaning |
|---|---|
| `id` / `name` | unique identifier + displayed label (both required) |
| `blurb` | short description under the lane label |
| `divider` | renders a full-width separation band **before** this lane — the blueprint's service-design lines ("Line of visibility", …) |
| `kind` | semantic lane type, one of the eight below |
| `tint` | explicit card background (`#rrggbb`) for this lane — overrides the kind default |
| `interpretation` | drawer text: the service-design reading of this lane's cards, as `aria-expanded`-wired "Service design interpretation" disclosures in the export |
| `cards` | one per stage, in stage order |

## The eight lane kinds

`customer` · `frontstage` · `agents` · `backstage` · `systems` · `data` ·
`governance` · `outcome`

Kind drives each lane's default card tint — a theme token, so dark themes
darken kind defaults with everything else. The light default:

| Kind | Default tint |
|---|---|
| `agents` | `#f3f0ff` |
| `systems` | `#eff9f8` |
| `data` | `#f3f8ff` |
| `governance` | `#fff3e9` |
| `outcome` | `#f0fbf4` |
| `customer`, `frontstage`, `backstage` | none (surface color) |

Precedence, low → high: surface color → theme's kind tint → explicit lane
`tint` → (editor) an engine-suggested color applied by you.

## Theme — omit, tune, or preset

Omit `theme:` entirely and you get the audited hue-230 default (the engine
still lints it on every render). Otherwise supply any subset of the **34
tokens** — unknown theme keys fail loudly, which is an authoring aid, not a
gotcha.

The token inventory, grouped as the editor's Theme panel presents it:

| Group | Tokens |
|---|---|
| Band | `band_bg`, `band_border`, `band_eyebrow`, `band_text` |
| Grid & lanes | `canvas`, `grid_head`, `divider_bg`, `row_head_bg`, `row_blurb` |
| Stage headers | `stage_bg`, `stage_ink`, `stage_blurb` |
| Cards & interaction | `surface`, `ink`, `ink_strong`, `item_border`, `item_type`, `hover_soft`, `focus_outline`, `selected_outline` |
| Accent | `accent`, `accent_ink`, `accent_soft_bg`, `accent_soft_ink` |
| Lane tints | `tint_agents`, `tint_systems`, `tint_data`, `tint_governance`, `tint_outcome` |
| Secondary text | `border_soft`, `legend`, `stat_caption`, `note_ink`, `drawer_ink` |

Each token is a `#rrggbb` hex — no named colors, no functions: the contrast
math needs exact values, and strictness is what makes the WCAG lint possible.

Shipped presets (the editor applies them; the engine tests audit them):

- **Light default** — the published artifact's palette
- **Dark studio** — matched to the editor chrome (`crates/blueprint-core/tests/dark_preset.rs` audits it)
- **High-contrast light / dark** — the AAA tier: every linted pair holds 7:1 on normal text (`crates/blueprint-core/tests/high_contrast_presets.rs`)

## YAML ↔ JSON

The parser accepts YAML **or** JSON for any input (YAML is a JSON superset;
the engine's loaders auto-detect). Serialize back with
`Document::to_yaml()` / `Document::to_json()` — round-trip parity is tested.
The editor saves either form; canonical authoring is YAML (git-diff-friendly),
JSON when a pipeline wants it.

## Rules the engine enforces (fail loudly, at authoring time)

Validation (`tekton validate`, the editor's Structure light, and — non-negotiable — the render path itself):

- `meta.eyebrow`, `meta.title`, `meta.intro` required
- every stage and lane: unique `id`, present `name`
- every lane carries exactly one card per stage, in stage order
- card titles must not be empty
- theme hexes must parse as colors

## Rendering is a linter, not a formatter

`tekton render` validates the structure **and** runs the WCAG lint before
writing a single byte: a theme that fails AA **refuses to render** — with a
per-pair verdict and, where the engine can compute one, a suggested
replacement color. An inaccessible blueprint cannot ship accidentally.
See [CLI.md](CLI.md) for the commands.