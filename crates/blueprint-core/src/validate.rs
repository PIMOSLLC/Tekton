//! Structural validation — run before render so malformed documents fail loudly
//! at authoring time, not as broken grids in a browser.

use crate::model::Document;
use serde::Serialize;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Severity {
    /// Blocks rendering.
    Error,
    /// Renders, but flagged in the editor.
    Warning,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct Issue {
    pub severity: Severity,
    /// Human-readable explanation, written for the document author.
    pub message: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize)]
pub struct Validation {
    pub issues: Vec<Issue>,
}

impl Validation {
    pub fn errors(&self) -> Vec<&Issue> {
        self.issues
            .iter()
            .filter(|i| i.severity == Severity::Error)
            .collect()
    }
    pub fn is_ok(&self) -> bool {
        self.issues.iter().all(|i| i.severity != Severity::Error)
    }
}

pub fn validate(doc: &Document) -> Validation {
    let mut issues = Vec::new();

    // Meta
    if doc.meta.title.trim().is_empty() {
        issues.push(issue(Severity::Error, "meta.title is required"));
    }
    if doc.meta.eyebrow.trim().is_empty() {
        issues.push(issue(Severity::Error, "meta.eyebrow is required"));
    }
    if doc.meta.intro.trim().is_empty() {
        issues.push(issue(Severity::Error, "meta.intro is required"));
    }

    // Stages
    if doc.stages.is_empty() {
        issues.push(issue(Severity::Error, "at least one stage is required"));
    }
    if doc.stages.len() > 10 {
        issues.push(issue(
            Severity::Warning,
            "more than 10 stages will overflow the grid's minimum width",
        ));
    }
    let mut seen = std::collections::HashSet::new();
    for (i, s) in doc.stages.iter().enumerate() {
        if s.id.trim().is_empty() {
            issues.push(issue(
                Severity::Error,
                format!("stages[{i}].id is required"),
            ));
        }
        if !seen.insert(s.id.trim().to_string()) {
            issues.push(issue(
                Severity::Error,
                format!("duplicate stage id '{}'", s.id),
            ));
        }
        if s.name.trim().is_empty() {
            issues.push(issue(
                Severity::Error,
                format!("stages[{i}].name is required"),
            ));
        }
    }

    // Lanes
    if doc.lanes.is_empty() {
        issues.push(issue(Severity::Error, "at least one lane is required"));
    }
    let mut lane_ids = std::collections::HashSet::new();
    for (i, lane) in doc.lanes.iter().enumerate() {
        if lane.id.trim().is_empty() {
            issues.push(issue(Severity::Error, format!("lanes[{i}].id is required")));
        }
        if !lane_ids.insert(lane.id.trim().to_string()) {
            issues.push(issue(
                Severity::Error,
                format!("duplicate lane id '{}'", lane.id),
            ));
        }
        if lane.name.trim().is_empty() {
            issues.push(issue(
                Severity::Error,
                format!("lanes[{i}].name is required"),
            ));
        }
        // The grid contract: exactly one card per lane per stage, in stage order.
        if lane.cards.len() != doc.stages.len() {
            issues.push(issue(
                Severity::Error,
                format!(
                    "lane '{}' has {} cards but there are {} stages — every lane needs exactly one card per stage",
                    lane.id,
                    lane.cards.len(),
                    doc.stages.len()
                ),
            ));
        }
        for (j, card) in lane.cards.iter().enumerate() {
            if card.title.trim().is_empty() {
                issues.push(issue(
                    Severity::Error,
                    format!("lanes[{i}].cards[{j}].title is required"),
                ));
            }
        }
    }

    // Disclosure note — strongly encouraged (the fixture shows the NDA-conscious pattern)
    if doc.note.is_none() {
        issues.push(issue(
            Severity::Warning,
            "no evidence/scope note — every published blueprint should disclose what is reported vs. intended",
        ));
    }

    // Theme colors must parse (lint reports ratios; unparsable hexes would panic there)
    if let Some(bad) = collect_bad_hexes(doc) {
        issues.push(issue(
            Severity::Error,
            format!("invalid hex color(s) in theme: {bad}"),
        ));
    }

    Validation { issues }
}

fn issue(severity: Severity, message: impl Into<String>) -> Issue {
    Issue {
        severity,
        message: message.into(),
    }
}

fn is_hex(s: &str) -> bool {
    let h = s.trim().trim_start_matches('#');
    matches!(h.len(), 3 | 6 | 8) && h.chars().all(|c| c.is_ascii_hexdigit())
}

fn collect_bad_hexes(doc: &Document) -> Option<String> {
    let t = &doc.theme;
    let fields = [
        (&t.band_bg, "band-bg"),
        (&t.band_border, "band-border"),
        (&t.band_eyebrow, "band-eyebrow"),
        (&t.band_text, "band-text"),
        (&t.canvas, "canvas"),
        (&t.surface, "surface"),
        (&t.ink, "ink"),
        (&t.ink_strong, "ink-strong"),
        (&t.grid_head, "grid-head"),
        (&t.divider_bg, "divider-bg"),
        (&t.row_head_bg, "row-head-bg"),
        (&t.row_blurb, "row-blurb"),
        (&t.stage_bg, "stage-bg"),
        (&t.stage_ink, "stage-ink"),
        (&t.stage_blurb, "stage-blurb"),
        (&t.accent, "accent"),
        (&t.accent_soft_bg, "accent-soft-bg"),
        (&t.accent_soft_ink, "accent-soft-ink"),
        (&t.item_border, "item-border"),
        (&t.item_type, "item-type"),
        (&t.border_soft, "border-soft"),
        (&t.legend, "legend"),
        (&t.stat_caption, "stat-caption"),
        (&t.note_ink, "note-ink"),
        (&t.drawer_ink, "drawer-ink"),
        (&t.focus_outline, "focus-outline"),
        (&t.selected_outline, "selected-outline"),
        (&t.hover_soft, "hover-soft"),
    ];
    let bad: Vec<String> = fields
        .iter()
        .filter(|(v, _)| !is_hex(v))
        .map(|(v, name)| format!("{name}=\"{v}\""))
        .collect();
    // Lane tints too
    let tint_bad: Vec<String> = doc
        .lanes
        .iter()
        .filter_map(|l| {
            l.tint
                .as_ref()
                .filter(|t| !is_hex(t))
                .map(|t| format!("{} tint={t}", l.id))
        })
        .collect();
    let mut all = bad;
    all.extend(tint_bad);
    if all.is_empty() {
        None
    } else {
        Some(all.join(", "))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::model::*;
    use crate::Theme;

    fn minimal_doc() -> Document {
        Document {
            meta: Meta {
                eyebrow: "Test".into(),
                title: "Tiny blueprint".into(),
                intro: "One stage, one lane.".into(),
            },
            stats: vec![],
            stages: vec![Stage {
                id: "signal".into(),
                name: "Signal".into(),
                blurb: None,
            }],
            lanes: vec![Lane {
                id: "customer".into(),
                name: "Customer actions".into(),
                blurb: None,
                divider: None,
                tint: None,
                interpretation: None,
                cards: vec![Card {
                    title: "Browse".into(),
                    blurb: "Looks around".into(),
                }],
            }],
            note: Some(Note {
                label: "Scope:".into(),
                body: "Fixture only.".into(),
            }),
            theme: Theme::default(),
        }
    }

    #[test]
    fn minimal_document_is_valid() {
        assert!(validate(&minimal_doc()).is_ok(), "minimal doc must pass");
    }

    #[test]
    fn card_count_mismatch_is_an_error() {
        let mut doc = minimal_doc();
        doc.lanes[0].cards.clear();
        let v = validate(&doc);
        assert!(!v.is_ok());
        assert!(v
            .issues
            .iter()
            .any(|i| i.message.contains("one card per stage")));
    }

    #[test]
    fn duplicate_lane_id_is_an_error() {
        let mut doc = minimal_doc();
        let second = doc.lanes[0].clone();
        doc.lanes.push(second);
        assert!(!validate(&doc).is_ok());
    }

    #[test]
    fn missing_note_is_only_a_warning() {
        let mut doc = minimal_doc();
        doc.note = None;
        let v = validate(&doc);
        assert!(v.is_ok(), "warnings do not block");
        assert!(v
            .issues
            .iter()
            .any(|i| i.severity == Severity::Warning && i.message.contains("evidence")));
    }

    #[test]
    fn bad_theme_hex_is_an_error() {
        let mut doc = minimal_doc();
        doc.theme.accent = "blurple".into();
        let v = validate(&doc);
        assert!(!v.is_ok());
        assert!(v.issues.iter().any(|i| i.message.contains("invalid hex")));
    }
}
