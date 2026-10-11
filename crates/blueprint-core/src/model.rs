//! The Tekton blueprint document model.
//!
//! The shape mirrors the proven data model of the source artifact (stages × lanes →
//! cards, lane-level interpretation, evidence note) but is authored as a serde
//! document: YAML by default (git-diff-friendly), JSON round-trips via the same
//! structs. `Theme` carries sane defaults so a document can omit it entirely.

use serde::{Deserialize, Serialize};

/// Whole document: one interactive service blueprint.
///
/// `deny_unknown_fields` — every struct in this model is strict: a typo'd or
/// misplaced key fails parsing loudly instead of silently doing nothing
/// (a real authoring failure mode caught during the CLI's first integration test).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Document {
    pub meta: Meta,
    /// At-a-glance figures above the grid (e.g. "4 layers").
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub stats: Vec<Stat>,
    /// Ordered workflow stages (the grid's columns).
    pub stages: Vec<Stage>,
    /// Ordered service lanes (the grid's rows).
    pub lanes: Vec<Lane>,
    /// Scope-and-evidence disclosure note below the grid. Strongly encouraged —
    /// see the fixture for the NDA-conscious phrasing pattern.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub note: Option<Note>,
    #[serde(default)]
    pub theme: Theme,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Meta {
    /// Small caps line above the title (e.g. "Portfolio case study · Future-state").
    pub eyebrow: String,
    /// The blueprint's own headline.
    pub title: String,
    /// One-sentence framing paragraph inside the band.
    pub intro: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Stat {
    pub figure: String,
    pub caption: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Stage {
    /// Kebab id, used in `data-*` wiring.
    pub id: String,
    pub name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub blurb: Option<String>,
}

/// Semantic lane type — adopted from the Gemini prototype's lane-type selector.
/// Drives default rendering semantics (each kind has a default card tint) and
/// gives editors affordances beyond raw strings. Explicit lane `tint` overrides
/// the kind default; absent tint falls back to the surface color.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum LaneKind {
    /// Customer actions (top of the blueprint).
    Customer,
    /// What the customer sees (frontstage experience).
    Frontstage,
    /// Automated / agent workflows.
    Agents,
    /// Human backstage work.
    Backstage,
    /// Supporting systems and infrastructure.
    Systems,
    /// Evidence, data, and traceability.
    Data,
    /// Controls, approval gates, accountability.
    Governance,
    /// Expected or reported value.
    Outcome,
}

impl LaneKind {
    /// Default lane tint (effective card background) — the palette the Serta
    /// fixture carried by hand before kinds existed.
    pub fn default_tint(self) -> Option<&'static str> {
        Some(match self {
            LaneKind::Agents => "#f3f0ff",
            LaneKind::Systems => "#eff9f8",
            LaneKind::Data => "#f3f8ff",
            LaneKind::Governance => "#fff3e9",
            LaneKind::Outcome => "#f0fbf4",
            _ => return None,
        })
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Lane {
    pub id: String,
    pub name: String,
    /// Short description under the lane label.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub blurb: Option<String>,
    /// Full-width divider row rendered before this lane ("Line of interaction" etc.).
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub divider: Option<String>,
    /// Optional tint for this lane's cards/background (#rrggbb). Overrides the
    /// kind default when both are present.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub tint: Option<String>,
    /// Semantic kind — drives default tinting and editor affordances.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub kind: Option<LaneKind>,
    /// Drawer "Service design interpretation" text for cards in this lane.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub interpretation: Option<String>,
    /// Cards, one per stage, in stage order (validated by `validate`).
    pub cards: Vec<Card>,
}

impl Lane {
    /// The card background the renderer will actually use for this lane:
    /// explicit tint wins, then the kind default, then the theme surface.
    pub fn effective_tint(&self) -> Option<&str> {
        self.tint
            .as_deref()
            .or_else(|| self.kind.and_then(|k| k.default_tint()))
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Card {
    pub title: String,
    pub blurb: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Note {
    /// Bold lead-in, e.g. "Scope and evidence:".
    #[serde(default = "Note::default_label")]
    pub label: String,
    pub body: String,
}

impl Note {
    fn default_label() -> String {
        "Scope and evidence:".to_string()
    }
}

use crate::theme::Theme;

impl Document {
    /// Parse a document from YAML text.
    pub fn from_yaml(s: &str) -> Result<Self, crate::Error> {
        serde_yaml::from_str(s).map_err(crate::Error::Yaml)
    }

    /// Parse a document from JSON text.
    pub fn from_json(s: &str) -> Result<Self, crate::Error> {
        serde_json::from_str(s).map_err(crate::Error::Json)
    }

    /// Serialize back to YAML.
    pub fn to_yaml(&self) -> Result<String, crate::Error> {
        serde_yaml::to_string(self).map_err(crate::Error::Yaml)
    }

    /// Serialize back to JSON (round-trip parity with `from_json`).
    pub fn to_json(&self) -> Result<String, crate::Error> {
        serde_json::to_string_pretty(self).map_err(crate::Error::Json)
    }

    /// Total card count (stages × lanes when well-formed).
    pub fn card_count(&self) -> usize {
        self.lanes.iter().map(|l| l.cards.len()).sum()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn lane_kind_round_trips_from_yaml() {
        let yaml = "meta:\n  eyebrow: e\n  title: t\n  intro: i\nstages:\n  - {id: s, name: Signal}\nlanes:\n  - {id: agents, kind: agents, name: Agents, cards: [{title: T, blurb: B}]}\n";
        let doc = Document::from_yaml(yaml).unwrap();
        assert_eq!(doc.lanes[0].kind, Some(LaneKind::Agents));
        // and back out
        let out = doc.to_yaml().unwrap();
        assert!(out.contains("kind: agents"), "{out}");
    }

    #[test]
    fn unknown_lane_kind_fails_loudly() {
        let yaml = "meta:\n  eyebrow: e\n  title: t\n  intro: i\nstages:\n  - {id: s, name: Signal}\nlanes:\n  - {id: x, kind: vibes, name: X, cards: [{title: T, blurb: B}]}\n";
        assert!(
            Document::from_yaml(yaml).is_err(),
            "typos must not pass silently"
        );
    }

    #[test]
    fn explicit_tint_overrides_kind_default() {
        let mut lane = Lane {
            id: "agents".into(),
            name: "Agents".into(),
            blurb: None,
            divider: None,
            tint: Some("#eef2ff".into()),
            kind: Some(LaneKind::Agents),
            interpretation: None,
            cards: vec![],
        };
        assert_eq!(lane.effective_tint(), Some("#eef2ff"));
        lane.tint = None;
        assert_eq!(
            lane.effective_tint(),
            Some(LaneKind::Agents.default_tint().unwrap())
        );
        lane.kind = None;
        assert_eq!(lane.effective_tint(), None);
    }
}
