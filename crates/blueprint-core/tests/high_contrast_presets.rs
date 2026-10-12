//! The HIGH-CONTRAST presets — the AAA tier, GUARDED here the way
//! `dark_preset.rs` guards the studio-matched dark set.
//!
//! The same maps live in the editor's registry (`src/types.ts` →
//! `THEME_PRESETS`). Rust carries deliberate copies because the editor's
//! engine runs IN THE BROWSER (wasm) where no Rust test can reach. Keep the
//! copies in sync — the comments anchor why.
//!
//! The tier's contract is STRICTER than AA: every pair the engine lints must
//! hold the AAA floor — 7:1 for normal text, 4.5:1 for large text.

use blueprint_core::lint::lint;
use blueprint_core::Document;

const HIGH_CONTRAST_LIGHT: &[(&str, &str)] = &[
    ("band_bg", "#0b0f1a"),
    ("band_border", "#1e40af"),
    ("band_eyebrow", "#93c5fd"),
    ("band_text", "#e5e7eb"),
    ("canvas", "#ffffff"),
    ("surface", "#ffffff"),
    ("ink", "#111827"),
    ("ink_strong", "#0b0f1a"),
    ("grid_head", "#111827"),
    ("divider_bg", "#182150"),
    ("row_head_bg", "#f3f4f6"),
    ("row_blurb", "#374151"),
    ("stage_bg", "#e5e7eb"),
    ("stage_ink", "#111827"),
    ("stage_blurb", "#374151"),
    ("accent", "#1b3aa0"),
    ("accent_ink", "#ffffff"),
    ("accent_soft_bg", "#dbeafe"),
    ("accent_soft_ink", "#1e3a8a"),
    ("item_border", "#1f2937"),
    ("item_type", "#1f2937"),
    ("border_soft", "#1f2937"),
    ("legend", "#1f2937"),
    ("stat_caption", "#374151"),
    ("note_ink", "#1f2937"),
    ("drawer_ink", "#1f2937"),
    ("focus_outline", "#1b3aa0"),
    ("selected_outline", "#1b3aa0"),
    ("hover_soft", "#e5e7eb"),
    ("tint_agents", "#e3e0f8"),
    ("tint_systems", "#e0f2f1"),
    ("tint_data", "#e1ecfa"),
    ("tint_governance", "#fdeedd"),
    ("tint_outcome", "#e1f3e9"),
];

const HIGH_CONTRAST_DARK: &[(&str, &str)] = &[
    ("band_bg", "#000000"),
    ("band_border", "#3b82f6"),
    ("band_eyebrow", "#93c5fd"),
    ("band_text", "#e5e7eb"),
    ("canvas", "#000000"),
    ("surface", "#14181f"),
    ("ink", "#ffffff"),
    ("ink_strong", "#ffffff"),
    ("grid_head", "#1B2C52"),
    ("divider_bg", "#20255e"),
    ("row_head_bg", "#1a212c"),
    ("row_blurb", "#c3cbda"),
    ("stage_bg", "#1f2733"),
    ("stage_ink", "#ffffff"),
    ("stage_blurb", "#c3cbda"),
    ("accent", "#93c5fd"),
    ("accent_ink", "#0b0f1a"),
    ("accent_soft_bg", "#0b2a6b"),
    ("accent_soft_ink", "#dbeafe"),
    ("item_border", "#565f6e"),
    ("item_type", "#e2e8f0"),
    ("border_soft", "#565f6e"),
    ("legend", "#c3cbda"),
    ("stat_caption", "#c3cbda"),
    ("note_ink", "#d1d5db"),
    ("drawer_ink", "#e5e7eb"),
    ("focus_outline", "#93c5fd"),
    ("selected_outline", "#93c5fd"),
    ("hover_soft", "#2a3242"),
    ("tint_agents", "#3b3560"),
    ("tint_systems", "#17454d"),
    ("tint_data", "#16436b"),
    ("tint_governance", "#4d3517"),
    ("tint_outcome", "#175637"),
];

fn themed_document(map: &[(&str, &str)]) -> Document {
    let yaml = "meta:\n  eyebrow: \"Service blueprint\"\n  title: \"High Contrast Blueprint\"\n  intro: \"The accessibility-first rendition.\"\nstats:\n  - figure: \"3 stages\"\n    caption: \"Discover to deliver\"\nstages:\n  - id: discover\n    name: Discover\n    blurb: \"How the need appears\"\n  - id: define\n    name: Define\n    blurb: \"How options get shaped\"\n  - id: deliver\n    name: Deliver\n    blurb: \"How the outcome lands\"\nlanes:\n  - id: customer\n    kind: customer\n    name: \"Customer actions\"\n    cards:\n      - { title: \"Arrives with a goal\", blurb: \"What brings them in\" }\n      - { title: \"Weighs the options\", blurb: \"How they decide\" }\n      - { title: \"Uses the outcome\", blurb: \"What they take away\" }\n  - id: agents\n    kind: agents\n    name: \"AI agent workflow\"\n    cards:\n      - { title: \"Agent intake\", blurb: \"Signals received\" }\n      - { title: \"Ranked options\", blurb: \"Opportunities surfaced\" }\n      - { title: \"Prepared proposals\", blurb: \"Constrained changes\" }\n  - id: systems\n    kind: systems\n    name: \"Supporting systems\"\n    cards:\n      - { title: \"Crystallized context\", blurb: \"Rules and tokens\" }\n      - { title: \"System support\", blurb: \"Tools powering the stage\" }\n      - { title: \"Prepared artifacts\", blurb: \"Ready components\" }\n  - id: data\n    kind: data\n    name: \"Evidence and data\"\n    cards:\n      - { title: \"Behavioral signals\", blurb: \"Views and events\" }\n      - { title: \"Recommendations\", blurb: \"Source-linked\" }\n      - { title: \"Decision records\", blurb: \"Reviewer and version\" }\n  - id: governance\n    kind: governance\n    name: \"Governance\"\n    cards:\n      - { title: \"Control gate\", blurb: \"Explicit human sign-off\" }\n      - { title: \"Evidence trail\", blurb: \"Every output linked\" }\n      - { title: \"Audit log\", blurb: \"Impact and revert path\" }\n  - id: outcome\n    kind: outcome\n    name: \"Service outcomes\"\n    cards:\n      - { title: \"Prioritized work\", blurb: \"Insight to action\" }\n      - { title: \"Faster prototyping\", blurb: \"Prepared in hours\" }\n      - { title: \"Continuous improvement\", blurb: \"Targets monitored\" }\n";
    let mut doc = Document::from_yaml(yaml).expect("the high-contrast doc parses");
    for (field, value) in map {
        let value = *value;
        match *field {
            "band_bg" => doc.theme.band_bg = value.into(),
            "band_border" => doc.theme.band_border = value.into(),
            "band_eyebrow" => doc.theme.band_eyebrow = value.into(),
            "band_text" => doc.theme.band_text = value.into(),
            "canvas" => doc.theme.canvas = value.into(),
            "surface" => doc.theme.surface = value.into(),
            "ink" => doc.theme.ink = value.into(),
            "ink_strong" => doc.theme.ink_strong = value.into(),
            "grid_head" => doc.theme.grid_head = value.into(),
            "divider_bg" => doc.theme.divider_bg = value.into(),
            "row_head_bg" => doc.theme.row_head_bg = value.into(),
            "row_blurb" => doc.theme.row_blurb = value.into(),
            "stage_bg" => doc.theme.stage_bg = value.into(),
            "stage_ink" => doc.theme.stage_ink = value.into(),
            "stage_blurb" => doc.theme.stage_blurb = value.into(),
            "accent" => doc.theme.accent = value.into(),
            "accent_ink" => doc.theme.accent_ink = value.into(),
            "accent_soft_bg" => doc.theme.accent_soft_bg = value.into(),
            "accent_soft_ink" => doc.theme.accent_soft_ink = value.into(),
            "item_border" => doc.theme.item_border = value.into(),
            "item_type" => doc.theme.item_type = value.into(),
            "border_soft" => doc.theme.border_soft = value.into(),
            "legend" => doc.theme.legend = value.into(),
            "stat_caption" => doc.theme.stat_caption = value.into(),
            "note_ink" => doc.theme.note_ink = value.into(),
            "drawer_ink" => doc.theme.drawer_ink = value.into(),
            "focus_outline" => doc.theme.focus_outline = value.into(),
            "selected_outline" => doc.theme.selected_outline = value.into(),
            "hover_soft" => doc.theme.hover_soft = value.into(),
            "tint_agents" => doc.theme.tint_agents = value.into(),
            "tint_systems" => doc.theme.tint_systems = value.into(),
            "tint_data" => doc.theme.tint_data = value.into(),
            "tint_governance" => doc.theme.tint_governance = value.into(),
            "tint_outcome" => doc.theme.tint_outcome = value.into(),
            _ => panic!("unknown token in the high-contrast map: {field}"),
        }
    }
    doc
}

fn assert_aaa(name: &str, map: &[(&str, &str)]) {
    let doc = themed_document(map);
    let report = lint(&doc).expect("lints");
    let failing: Vec<_> = report.findings.iter().filter(|f| !f.aa).collect();
    assert!(
        failing.is_empty(),
        "{name} must pass AA with no tint overrides — failures: {:?}",
        failing
    );
    let sub_aaa: Vec<_> = report
        .findings
        .iter()
        .filter(|f| {
            // AAA floors: 7:1 normal text, 4.5:1 large text.
            let floor = if f.large { 4.5 } else { 7.0 };
            f.ratio < floor
        })
        .collect();
    assert!(
        sub_aaa.is_empty(),
        "{name} is the HIGH-CONTRAST tier: every pair must hold AAA (7:1 normal, 4.5:1 large) — sub-AAA: {:?}",
        sub_aaa
    );
}

#[test]
fn the_high_contrast_light_preset_holds_aaa() {
    assert_aaa("high-contrast light", HIGH_CONTRAST_LIGHT);
}

#[test]
fn the_high_contrast_dark_preset_holds_aaa() {
    assert_aaa("high-contrast dark", HIGH_CONTRAST_DARK);
}

#[test]
fn the_high_contrast_presets_render_self_contained() {
    for (name, map) in [("light", HIGH_CONTRAST_LIGHT), ("dark", HIGH_CONTRAST_DARK)] {
        let doc = themed_document(map);
        let html = blueprint_core::render::render(&doc, blueprint_core::Format::Standalone)
            .unwrap_or_else(|e| panic!("{name} renders: {e}"));
        let tint = map
            .iter()
            .find(|(k, _)| *k == "tint_agents")
            .expect("kind tint present")
            .1;
        assert!(html.contains("--bp-canvas"), "theme vars flow");
        assert!(html.contains(tint), "the kind tints ship");
    }
}
