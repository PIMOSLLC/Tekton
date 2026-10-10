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
    /// Optional tint for this lane's cards/background (#rrggbb).
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub tint: Option<String>,
    /// Drawer "Service design interpretation" text for cards in this lane.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub interpretation: Option<String>,
    /// Cards, one per stage, in stage order (validated by `validate`).
    pub cards: Vec<Card>,
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
