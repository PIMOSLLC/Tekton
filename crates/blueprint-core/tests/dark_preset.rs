//! The studio-matched DARK theme preset — its AA conformance is GUARDED here.
//!
//! The same map lives in `src/core/templates.ts`?? — no: it lives in the
//! editor's theme panel (`src/ThemeEditor.tsx`'s presets). This test carries a
//! deliberate copy because the editor's engine runs IN THE BROWSER (wasm) where
//! no Rust test can reach it: if a token choice breaks AA here, the editor
//! preset can't ship it. Keep the two maps in sync — the comment anchors why.

use blueprint_core::{validate::validate, validate::Severity, Document};

const DARK: &[(&str, &str)] = &[
    ("band_bg", "#0B0F1A"),
    ("band_border", "#1E40AF"),
    ("band_eyebrow", "#93C5FD"),
    ("band_text", "#CBD5E1"),
    ("canvas", "#0B121B"),
    ("surface", "#1F2937"),
    ("ink", "#E2E8F0"),
    ("ink_strong", "#F1F5F9"),
    ("grid_head", "#1B2C52"),
    ("divider_bg", "#182150"),
    ("row_head_bg", "#111827"),
    ("row_blurb", "#94A3B8"),
    ("stage_bg", "#0F172A"),
    ("stage_ink", "#E2E8F0"),
    ("stage_blurb", "#94A3B8"),
    ("accent", "#60A5FA"),
    ("accent_ink", "#0B0F1A"),
    ("accent_soft_bg", "#172554"),
    ("accent_soft_ink", "#93C5FD"),
    ("item_border", "#374151"),
    ("item_type", "#94A3B8"),
    ("border_soft", "#374151"),
    ("legend", "#94A3B8"),
    ("stat_caption", "#94A3B8"),
    ("note_ink", "#94A3B8"),
    ("drawer_ink", "#CBD5E1"),
    ("focus_outline", "#60A5FA"),
    ("selected_outline", "#60A5FA"),
    ("hover_soft", "#1F2937"),
    ("tint_agents", "#2A2140"),
    ("tint_systems", "#0E3034"),
    ("tint_data", "#0F2740"),
    ("tint_governance", "#33261A"),
    ("tint_outcome", "#10352A"),
];

fn dark_document() -> Document {
    let yaml = "meta:\n  eyebrow: \"Service blueprint · dark draft\"\n  title: \"Dark Studio Blueprint\"\n  intro: \"A dark-themed rendering matched to the studio chrome.\"\nstats:\n  - figure: \"3 stages\"\n    caption: \"Discover to deliver\"\nstages:\n  - id: discover\n    name: Discover\n    blurb: \"How the need appears\"\n  - id: define\n    name: Define\n    blurb: \"How options get shaped\"\n  - id: deliver\n    name: Deliver\n    blurb: \"How the outcome lands\"\nlanes:\n  - id: customer\n    kind: customer\n    name: \"Customer actions\"\n    cards:\n      - { title: \"Arrives with a goal\", blurb: \"What brings them in\" }\n      - { title: \"Weighs the options\", blurb: \"How they decide\" }\n      - { title: \"Uses the outcome\", blurb: \"What they take away\" }\n  - id: frontstage\n    kind: frontstage\n    name: \"Frontstage experience\"\n    cards:\n      - { title: \"Visible touchpoint\", blurb: \"What they encounter\" }\n      - { title: \"Comparison surface\", blurb: \"What they configure\" }\n      - { title: \"Delivered experience\", blurb: \"What they receive\" }\n  - id: agents\n    kind: agents\n    name: \"AI agent workflow\"\n    cards:\n      - { title: \"Agent intake\", blurb: \"Signals received\" }\n      - { title: \"Ranked options\", blurb: \"Opportunities surfaced\" }\n      - { title: \"Prepared proposals\", blurb: \"Constrained changes\" }\n  - id: systems\n    kind: systems\n    name: \"Supporting systems\"\n    cards:\n      - { title: \"System support\", blurb: \"Tools powering the stage\" }\n      - { title: \"System support\", blurb: \"Tools powering the stage\" }\n      - { title: \"System support\", blurb: \"Tools powering the stage\" }\n  - id: governance\n    kind: governance\n    name: \"Governance\"\n    cards:\n      - { title: \"Control at discovery\", blurb: \"Gate or evidence\" }\n      - { title: \"Control at definition\", blurb: \"Gate or evidence\" }\n      - { title: \"Control at delivery\", blurb: \"Gate or evidence\" }\nnote:\n  label: \"Scope and evidence:\"\n  body: \"What is measured versus intended, and what is out of scope.\"\n";
    let mut doc = Document::from_yaml(yaml).expect("the dark-preset doc parses");
    for (field, value) in DARK {
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
            _ => panic!("unknown token in the dark map: {field}"),
        }
    }
    doc
}

#[test]
fn the_dark_studio_preset_passes_the_aa_gate_without_any_tint_override() {
    let doc = dark_document();
    let v = validate(&doc);
    assert!(
        v.issues.iter().all(|i| i.severity != Severity::Error),
        "dark preset must validate: {:?}",
        v.issues
    );
    let report = blueprint_core::lint::lint(&doc).expect("lints");
    let failing: Vec<_> = report.findings.iter().filter(|f| !f.aa).collect();
    assert!(
        failing.is_empty(),
        "the studio-matched dark theme must pass AA with the WHITE active-button text, the tinted-card text, and the drawer — failures: {:?}",
        failing
    );
}

/// The realistic preset scenario: documents authored under the LIGHT artifact
/// often carry per-lane tints as explicit overrides (the shipped e-commerce
/// example's customer lane is `#FFFFFF`). Presets own THEMES, never document
/// data — so a stale override survives a preset switch. The deployment
/// contract audited here:
///   1. the lint must REPORT the stale pair (this is the render gate the
///      preview honors — a broken pairing may never render silently), and
///   2. re-basing the override to the kind default — exactly the editor's
///      apply-time fix — must restore full AA conformance.
#[test]
fn stale_light_lane_tints_are_reported_and_the_kind_default_rebase_restores_aa() {
    let mut doc = dark_document();
    doc.lanes[0].tint = Some("#FFFFFF".into());

    let report = blueprint_core::lint::lint(&doc).expect("lints");
    let stale: Vec<_> = report.findings.iter().filter(|f| !f.aa).collect();
    assert!(
        !stale.is_empty() && stale.iter().any(|f| f.element.contains("customer")),
        "a stale white override must be REPORTED, never silently rendered: {:?}",
        stale
    );

    doc.lanes[0].tint = None;
    let report = blueprint_core::lint::lint(&doc).expect("lints");
    let failing: Vec<_> = report.findings.iter().filter(|f| !f.aa).collect();
    assert!(
        failing.is_empty(),
        "the editor's apply-time re-base must restore AA end to end: {:?}",
        failing
    );
}

#[test]
fn dark_preset_renders_and_exports_self_contained() {
    let doc = dark_document();
    let html = blueprint_core::render::render(&doc, blueprint_core::Format::Standalone)
        .expect("the dark doc renders");
    assert!(html.contains("--bp-canvas:#0B121B;"), "theme vars flow");
    assert!(html.contains("#2A2140"), "the darkened kind tints ship");
}
