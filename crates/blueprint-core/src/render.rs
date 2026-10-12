//! Renderer: emits the interactive blueprint as fully self-contained HTML.
//!
//! Architecture decisions inherited from the source artifact's eight revision
//! passes (see the DLC changelog):
//!   - **Pre-rendered static DOM** — the grid, cards, and drawer ship as HTML;
//!     JavaScript only wires interactions. The page is semantic without JS.
//!   - **Scoped selectors** — every CSS rule lives under `.bp-root`; embedded
//!     output cannot style its host page.
//!   - **Sticky-header docking** — `--bp-header-h` is measured at runtime so
//!     embeds with their own fixed chrome dock the toolbar/drawer below it.
//!   - **Theme via CSS custom properties** — colors never appear in the static
//!     stylesheet; a theme override is one tiny generated block.

use serde::Serialize;

use crate::model::{Document, Lane};

/// Output shape.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Format {
    /// Full HTML document — open it anywhere.
    Standalone,
}

pub struct RenderError(pub String);
impl std::fmt::Display for RenderError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "render error: {}", self.0)
    }
}
impl std::fmt::Debug for RenderError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "RenderError({:?})", self.0)
    }
}
impl std::error::Error for RenderError {}

/// Entry point: validate first (errors abort), then lint the theme (AA failures
/// abort — the product's contract: an inaccessible palette never ships), then
/// render. Returns the final HTML. (`format` stays a positional API slot for
/// future output shapes; today the document is always the standalone HTML shell.)
pub fn render(doc: &Document, _format: Format) -> Result<String, crate::Error> {
    let validation = crate::validate::validate(doc);
    if !validation.is_ok() {
        return Err(crate::Error::Render(RenderError(format!(
            "document has {} validation error(s): {}",
            validation.errors().len(),
            validation
                .errors()
                .iter()
                .map(|i| i.message.clone())
                .collect::<Vec<_>>()
                .join("; ")
        ))));
    }

    let report = crate::lint::lint(doc).map_err(|e| crate::Error::Render(RenderError(e)))?;
    let aa_failures = report.aa_failures();
    if !aa_failures.is_empty() {
        let detail = aa_failures
            .iter()
            .map(|f| {
                format!(
                    "{}: {} on {} = {:.2}:1{}",
                    f.element,
                    f.fg,
                    f.bg,
                    f.ratio,
                    f.suggestion
                        .as_deref()
                        .map(|s| format!(" (suggested fg: {s})"))
                        .unwrap_or_default()
                )
            })
            .collect::<Vec<_>>()
            .join("; ");
        return Err(crate::Error::Render(RenderError(format!(
            "theme fails WCAG AA on {} pair(s): {detail}",
            aa_failures.len()
        ))));
    }

    Ok(standalone(doc))
}

// ---------------------------------------------------------------------------
// Theme variables block (generated per document)
// ---------------------------------------------------------------------------

fn theme_vars(doc: &Document) -> String {
    let t = &doc.theme;
    let mut s = String::from(".bp-root{");
    for (name, value) in [
        ("band-bg", &t.band_bg),
        ("band-border", &t.band_border),
        ("band-eyebrow", &t.band_eyebrow),
        ("band-text", &t.band_text),
        ("canvas", &t.canvas),
        ("surface", &t.surface),
        ("ink", &t.ink),
        ("ink-strong", &t.ink_strong),
        ("grid-head", &t.grid_head),
        ("divider-bg", &t.divider_bg),
        ("row-head-bg", &t.row_head_bg),
        ("row-blurb", &t.row_blurb),
        ("stage-bg", &t.stage_bg),
        ("stage-ink", &t.stage_ink),
        ("stage-blurb", &t.stage_blurb),
        ("accent", &t.accent),
        ("accent-ink", &t.accent_ink),
        ("accent-soft-bg", &t.accent_soft_bg),
        ("accent-soft-ink", &t.accent_soft_ink),
        ("item-border", &t.item_border),
        ("item-type", &t.item_type),
        ("border-soft", &t.border_soft),
        ("legend", &t.legend),
        ("stat-caption", &t.stat_caption),
        ("note-ink", &t.note_ink),
        ("drawer-ink", &t.drawer_ink),
        ("focus-outline", &t.focus_outline),
        ("selected-outline", &t.selected_outline),
        ("hover-soft", &t.hover_soft),
    ] {
        s.push_str(&format!("--bp-{name}:{};", value));
    }
    s.push('}');

    // Per-lane tints as generated rules (content-specific, so not in the static CSS).
    // Effective tint = explicit lane tint, else the lane-kind default.
    for lane in &doc.lanes {
        if let Some(tint) = lane.effective_tint(&doc.theme) {
            s.push_str(&format!(
                ".bp-root .bp-cell[data-lane=\"{}\"]{{background:{tint};}}",
                escape_attr(&lane.id)
            ));
        }
    }
    s
}

// ---------------------------------------------------------------------------
// Interaction data island (drawer content) — pre-rendered DOM stays lean;
// the drawer pulls lane interpretation + stage names from here.
// ---------------------------------------------------------------------------

#[derive(Serialize)]
struct InteractionData<'a> {
    stages: Vec<StageRef<'a>>,
    lanes: LaneMap<'a>,
}

#[derive(Serialize)]
struct StageRef<'a> {
    name: &'a str,
}

#[derive(Serialize)]
struct LaneMap<'a> {
    #[serde(flatten)]
    map: std::collections::BTreeMap<&'a str, LaneRef<'a>>,
}

#[derive(Serialize)]
struct LaneRef<'a> {
    name: &'a str,
    #[serde(skip_serializing_if = "Option::is_none")]
    interpretation: Option<&'a str>,
}

fn data_island(doc: &Document) -> String {
    let data = InteractionData {
        stages: doc
            .stages
            .iter()
            .map(|s| StageRef {
                name: s.name.as_str(),
            })
            .collect(),
        lanes: LaneMap {
            map: doc
                .lanes
                .iter()
                .map(|l| {
                    (
                        l.id.as_str(),
                        LaneRef {
                            name: l.name.as_str(),
                            interpretation: l.interpretation.as_deref(),
                        },
                    )
                })
                .collect(),
        },
    };
    let json = serde_json::to_string(&data).expect("interaction data is plain serializable");
    format!(
        "<script type=\"application/json\" class=\"bp-data\">{}</script>",
        json.replace('<', "\\u003c").replace('>', "\\u003e")
    )
}

// ---------------------------------------------------------------------------
// Body (shared by both formats)
// ---------------------------------------------------------------------------

fn body(doc: &Document, heading_level: u8) -> String {
    let mut h = String::new();
    let n = doc.stages.len().max(1);

    h.push_str("<div class=\"bp-root\" data-tekton=\"service-blueprint\">");
    h.push_str("<style>");
    h.push_str(&theme_vars(doc));
    h.push_str(STATIC_CSS);
    h.push_str("</style>");

    // Band
    h.push_str("<header class=\"bp-band\"><div class=\"bp-eyebrow\">");
    h.push_str(&escape_html(&doc.meta.eyebrow));
    h.push_str("</div>");
    h.push_str(&format!(
        "<h{lvl}>{}</h{lvl}>",
        escape_html(&doc.meta.title),
        lvl = heading_level
    ));
    h.push_str("<p>");
    h.push_str(&escape_html(&doc.meta.intro));
    h.push_str("</p></header>");

    // Toolbar
    h.push_str("<div class=\"bp-toolbar\"><label for=\"bp-focus\">Focus layer</label><select id=\"bp-focus\" class=\"bp-focus\">");
    h.push_str("<option value=\"all\">All layers</option>");
    for lane in &doc.lanes {
        h.push_str(&format!(
            "<option value=\"{}\">{}</option>",
            escape_attr(&lane.id),
            escape_html(&lane.name)
        ));
    }
    h.push_str("</select><button id=\"bp-show-all\" class=\"bp-show-all active\" type=\"button\">Show all stages</button><button id=\"bp-print\" class=\"bp-print\" type=\"button\">Print / Save PDF</button><span class=\"bp-legend\">Select any card to inspect its handoff and controls</span></div>");

    // Main: stats, labeled scroll region with the grid, note, drawer
    h.push_str("<main class=\"bp-main\">");
    if !doc.stats.is_empty() {
        h.push_str("<div class=\"bp-stats\">");
        for stat in &doc.stats {
            h.push_str(&format!(
                "<div class=\"bp-stat\"><strong>{}</strong><span>{}</span></div>",
                escape_html(&stat.figure),
                escape_html(&stat.caption)
            ));
        }
        h.push_str("</div>");
    }

    h.push_str(&format!(
        "<div class=\"bp-scroll\" role=\"region\" aria-label=\"Service blueprint grid: {}\">",
        escape_attr(&doc.meta.title)
    ));
    h.push_str(&format!(
        "<div class=\"bp-grid\" id=\"bp-grid\" style=\"grid-template-columns:190px repeat({n},minmax(200px,1fr))\">"
    ));
    h.push_str("<div class=\"bp-corner\">Service layer \u{2193}<small>Workflow stage \u{2192}</small></div>");
    for stage in &doc.stages {
        h.push_str("<div class=\"bp-stage\">");
        h.push_str(&escape_html(&stage.name));
        if let Some(blurb) = &stage.blurb {
            h.push_str(&format!("<small>{}</small>", escape_html(blurb)));
        }
        h.push_str("</div>");
    }

    for lane in &doc.lanes {
        if let Some(divider) = &lane.divider {
            h.push_str("<div class=\"bp-divider\">");
            h.push_str(&escape_html(divider));
            h.push_str("</div>");
        }
        h.push_str(&format!(
            "<div class=\"bp-rowlabel\" data-lane=\"{}\">{}",
            escape_attr(&lane.id),
            escape_html(&lane.name)
        ));
        if let Some(blurb) = &lane.blurb {
            h.push_str(&format!("<small>{}</small>", escape_html(blurb)));
        }
        h.push_str("</div>");
        for (i, card) in lane.cards.iter().enumerate() {
            let stage_name = doc
                .stages
                .get(i)
                .map(|s| s.name.as_str())
                .unwrap_or_default();
            h.push_str(&card_markup(lane, i, stage_name, card));
        }
    }
    h.push_str("</div></div>"); // grid, scroll region

    if let Some(note) = &doc.note {
        h.push_str(&format!(
            "<p class=\"bp-note\"><strong>{}</strong> {}</p>",
            escape_html(&note.label),
            escape_html(&note.body)
        ));
    }

    h.push_str(&drawer_markup());
    h.push_str(&data_island(doc));
    h.push_str("</main></div>"); // main, bp-root
    h
}

fn card_markup(
    lane: &Lane,
    stage_index: usize,
    stage_name: &str,
    card: &crate::model::Card,
) -> String {
    format!(
        "<div class=\"bp-cell\" data-lane=\"{}\"><button class=\"bp-item\" type=\"button\" aria-expanded=\"false\" aria-controls=\"bp-drawer\" data-lane=\"{}\" data-stage=\"{}\" data-title=\"{}\" data-blurb=\"{}\"><span class=\"bp-type\">{}</span><strong>{}</strong>{}</button></div>",
        escape_attr(&lane.id),
        escape_attr(&lane.id),
        stage_index,
        escape_attr(&card.title),
        escape_attr(&card.blurb),
        escape_html(stage_name),
        escape_html(&card.title),
        escape_html(&card.blurb),
    )
}

fn drawer_markup() -> String {
    "<aside class=\"bp-drawer\" id=\"bp-drawer\" role=\"region\" aria-label=\"Blueprint card details\" aria-hidden=\"true\"><div class=\"bp-drawer-head\"><button class=\"bp-drawer-close\" id=\"bp-drawer-close\" type=\"button\" aria-label=\"Close details panel\"><svg viewBox=\"0 0 20 20\" width=\"20\" height=\"20\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M5 5l10 10M15 5L5 15\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"/></svg></button></div><div class=\"bp-drawer-body\" id=\"bp-drawer-body\" aria-live=\"polite\"></div></aside>".to_string()
}

// ---------------------------------------------------------------------------
// Formats
// ---------------------------------------------------------------------------

fn standalone(doc: &Document) -> String {
    let mut html = String::new();
    html.push_str("<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>");
    html.push_str(&escape_html(&doc.meta.title));
    html.push_str(" | Tekton Service Blueprint</title></head><body>");
    html.push_str(&body(doc, 1));
    html.push_str("<script>");
    html.push_str(STATIC_JS);
    html.push_str("</script></body></html>");
    html
}

// ---------------------------------------------------------------------------
// Escaping
// ---------------------------------------------------------------------------

pub fn escape_html(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for c in s.chars() {
        match c {
            '&' => out.push_str("&amp;"),
            '<' => out.push_str("&lt;"),
            '>' => out.push_str("&gt;"),
            '"' => out.push_str("&quot;"),
            '\'' => out.push_str("&#39;"),
            _ => out.push(c),
        }
    }
    out
}

pub fn escape_attr(s: &str) -> String {
    escape_html(s)
}

static STATIC_CSS: &str = include_str!("../assets/blueprint.css");
static STATIC_JS: &str = include_str!("../assets/blueprint.js");

#[cfg(test)]
mod tests {
    use super::*;
    use crate::model::*;

    fn doc() -> Document {
        Document::from_yaml(include_str!("../../../fixtures/agentic-ai-ecommerce.yaml")).unwrap()
    }

    #[test]
    fn standalone_has_document_shell_and_h1() {
        let html = render(&doc(), Format::Standalone).unwrap();
        assert!(html.starts_with("<!doctype html>"));
        assert!(html.contains("<h1>AI Agentic Workflows in E-Commerce</h1>"));
    }

    #[test]
    fn grid_is_fully_pre_rendered() {
        let html = render(&doc(), Format::Standalone).unwrap();
        // 8 lanes × 5 stages
        assert_eq!(html.matches("class=\"bp-item\"").count(), 40);
        // Every card is keyboard-ready with state wiring
        assert_eq!(html.matches("aria-expanded=\"false\"").count(), 40);
        assert_eq!(html.matches("aria-controls=\"bp-drawer\"").count(), 40);
        // Stage columns: 5 stage headers
        assert_eq!(html.matches("class=\"bp-stage\"").count(), 5);
        // Lane labels: 8
        assert_eq!(html.matches("class=\"bp-rowlabel\"").count(), 8);
        // Dividers: agents/backstage/systems/governance
        assert_eq!(html.matches("class=\"bp-divider\"").count(), 4);
    }

    #[test]
    fn css_is_scoped_no_element_selectors_leak() {
        let html = render(&doc(), Format::Standalone).unwrap();
        // Why: unscoped `header{...}` in embedded CSS once styled the host site's
        // own <header> — every rule must be .bp-root-prefixed.
        let css_start = html.find("<style>").unwrap() + "<style>".len();
        let css_end = html.find("</style>").unwrap();
        let css = strip_comments(&html[css_start..css_end]);
        let mut unscoped: Vec<&str> = Vec::new();
        for chunk in css.split('{') {
            // The text after the previous rule's `}` is this rule's selector.
            let sel = chunk.rsplit('}').next().unwrap_or("").trim();
            let sel = sel.split(',').last().unwrap_or("").trim();
            if !sel.is_empty() && !sel.starts_with(".bp-root") && !sel.starts_with('@') {
                unscoped.push(sel);
            }
        }
        assert!(unscoped.is_empty(), "unscoped selectors: {unscoped:?}");
    }

    fn strip_comments(css: &str) -> String {
        let mut out = String::new();
        let mut rest = css;
        while let Some(start) = rest.find("/*") {
            out.push_str(&rest[..start]);
            match rest[start..].find("*/") {
                Some(end) => rest = &rest[start + end + 2..],
                None => rest = "",
            }
        }
        out.push_str(rest);
        out
    }

    #[test]
    fn accessibility_landmarks_present() {
        let html = render(&doc(), Format::Standalone).unwrap();
        // Labeled scroll region (audit remediation #1)
        assert!(html.contains("role=\"region\" aria-label=\"Service blueprint grid:"));
        // Drawer with labelled region + live region + close button
        assert!(html.contains("aria-label=\"Blueprint card details\""));
        assert!(html.contains("aria-live=\"polite\""));
        assert!(html.contains("aria-label=\"Close details panel\""));
        // Reduced-motion guard
        assert!(html.contains("prefers-reduced-motion"));
    }

    #[test]
    fn interaction_data_island_round_trips() {
        let html = render(&doc(), Format::Standalone).unwrap();
        let start = html.find("class=\"bp-data\">").unwrap();
        let rest = &html[start..];
        let end = rest.find("</script>").unwrap();
        let json = &rest["class=\"bp-data\">".len()..end];
        let parsed: serde_json::Value = serde_json::from_str(json).unwrap();
        assert_eq!(parsed["stages"].as_array().unwrap().len(), 5);
        assert_eq!(parsed["lanes"]["governance"]["name"], "Governance");
    }

    #[test]
    fn theme_override_changes_output() {
        let mut d = doc();
        d.theme.band_bg = "#123456".into();
        let html = render(&d, Format::Standalone).unwrap();
        assert!(html.contains("--bp-band-bg:#123456;"));
    }

    #[test]
    fn aa_failing_theme_blocks_render_with_suggestion() {
        let mut d = doc();
        // The archived recurring failure: white-on-#03a9f4 buttons.
        d.theme.accent = "#03a9f4".into();
        let err = render(&d, Format::Standalone).unwrap_err();
        let msg = err.to_string();
        assert!(
            msg.contains("Active button text"),
            "called out the pair: {msg}"
        );
        assert!(
            msg.contains("suggested fg"),
            "gives an actionable fix: {msg}"
        );
    }

    #[test]
    fn invalid_document_blocks_render() {
        let mut d = doc();
        d.lanes[0].cards.clear();
        assert!(render(&d, Format::Standalone).is_err());
    }

    #[test]
    fn lane_tint_failure_appears_in_lint_before_render_refuses() {
        // The editor depends on this contract: the render gate's failing pair
        // must ALSO be a lint finding, so when the gate blocks, the terminal
        // still shows the author what to fix (the TS pipeline keeps lint
        // results via allSettled precisely for this).
        let yaml = "meta:\n  eyebrow: e\n  title: t\n  intro: i\nstages:\n  - {id: s, name: Signal}\nlanes:\n  - {id: customer, name: Customer, tint: '#c93131', cards: [{title: T, blurb: B}]}\n";
        let d = crate::Document::from_yaml(yaml).expect("parses");
        let report = crate::lint::lint(&d).expect("lints");
        assert!(
            report
                .findings
                .iter()
                .any(|f| !f.aa && f.element.contains("Card text (customer lane tint)")),
            "the failing tint pair is a lint finding: {:?}",
            report.findings
        );
        assert!(
            render(&d, Format::Standalone).is_err(),
            "the gate refuses the AA-failing tint"
        );
    }

    #[test]
    fn lane_kinds_drive_derived_tints_in_css() {
        // The fixture carries lane kinds (no explicit tints) — the renderer must
        // emit the kind-default tint rules (adopted from the Gemini prototype).
        let html = render(&doc(), Format::Standalone).unwrap();
        for (lane, tint) in [
            ("agents", "#f3f0ff"),
            ("systems", "#eff9f8"),
            ("data", "#f3f8ff"),
            ("governance", "#fff3e9"),
            ("outcome", "#f0fbf4"),
        ] {
            assert!(
                html.contains(&format!(
                    ".bp-cell[data-lane=\"{lane}\"]{{background:{tint};}}"
                )),
                "kind-derived tint missing for {lane}"
            );
        }
        // Untinted kinds (customer/frontstage/backstage) must NOT get a rule.
        for lane in ["customer", "frontstage", "backstage"] {
            assert!(!html.contains(&format!(".bp-cell[data-lane=\"{lane}\"]{{background:")));
        }
    }

    #[test]
    fn escaping_holds_against_html_in_content() {
        let mut d = doc();
        d.meta.title = "<script>alert(1)</script>".into();
        let html = render(&d, Format::Standalone).unwrap();
        assert!(!html.contains("<script>alert"), "title must be escaped");
        assert!(html.contains("&lt;script&gt;"));
    }
}
