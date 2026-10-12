//! Theme: every color the renderer emits, as CSS custom properties on `.bp-root`.
//!
//! The default is the hue-230 navy family unified with the DLC site header
//! (`#060d2f` band + `#27539c` border, `#1d4ed8` accent) during the source
//! artifact's color-consistency pass — kept as the product default so generated
//! blueprints inherit the proven, WCAG-audited palette out of the box.

use serde::{Deserialize, Serialize};

// Per-field serde defaults. Kept as free functions at module level so both the
// derive and `Default` reference one source of truth per color.
fn d(s: &str) -> String {
    s.to_string()
}

/// Strict deserialization: unknown theme keys fail loudly (authoring aid).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Theme {
    /// Band background.
    #[serde(default = "band_bg")]
    pub band_bg: String,
    /// Band bottom border.
    #[serde(default = "band_border")]
    pub band_border: String,
    /// Eyebrow text on band.
    #[serde(default = "band_eyebrow")]
    pub band_eyebrow: String,
    /// Intro text on band.
    #[serde(default = "band_text")]
    pub band_text: String,
    /// Page canvas behind the grid.
    #[serde(default = "canvas")]
    pub canvas: String,
    /// Card/panel surface.
    #[serde(default = "surface")]
    pub surface: String,
    /// Primary text.
    #[serde(default = "ink")]
    pub ink: String,
    /// Cell & control text.
    #[serde(default = "ink_strong")]
    pub ink_strong: String,
    /// Grid corner background.
    #[serde(default = "grid_head")]
    pub grid_head: String,
    /// Divider row background.
    #[serde(default = "divider_bg")]
    pub divider_bg: String,
    /// Lane label background.
    #[serde(default = "row_head_bg")]
    pub row_head_bg: String,
    /// Lane label description text.
    #[serde(default = "row_blurb")]
    pub row_blurb: String,
    /// Stage header background.
    #[serde(default = "stage_bg")]
    pub stage_bg: String,
    /// Stage header text.
    #[serde(default = "stage_ink")]
    pub stage_ink: String,
    /// Stage description text.
    #[serde(default = "stage_blurb")]
    pub stage_blurb: String,
    /// Interactive accent (buttons, stats, selected focus).
    #[serde(default = "accent")]
    pub accent: String,
    /// The ink that sits ON accent surfaces (the active button's text): dark
    /// themes use a light accent + a dark ink; light themes white-on-blue.
    #[serde(default = "accent_ink")]
    pub accent_ink: String,
    /// Pill background.
    #[serde(default = "accent_soft_bg")]
    pub accent_soft_bg: String,
    /// Pill / drawer sub-head text.
    #[serde(default = "accent_soft_ink")]
    pub accent_soft_ink: String,
    /// Card border.
    #[serde(default = "item_border")]
    pub item_border: String,
    /// Card stage-tag text.
    #[serde(default = "item_type")]
    pub item_type: String,
    /// Grid/panel borders.
    #[serde(default = "border_soft")]
    pub border_soft: String,
    /// Toolbar legend text.
    #[serde(default = "legend")]
    pub legend: String,
    /// Stat caption text.
    #[serde(default = "stat_caption")]
    pub stat_caption: String,
    /// Evidence note text.
    #[serde(default = "note_ink")]
    pub note_ink: String,
    /// Drawer body text.
    #[serde(default = "drawer_ink")]
    pub drawer_ink: String,
    /// Card focus/hover outline.
    #[serde(default = "focus_outline")]
    pub focus_outline: String,
    /// Selected card outline.
    #[serde(default = "selected_outline")]
    pub selected_outline: String,
    /// Control hover background.
    #[serde(default = "hover_soft")]
    pub hover_soft: String,
    /// Lane-kind default card tints — THEME-DRIVEN so a dark document darkens
    /// its tinted lanes with everything else (light pastels are the default
    /// palette's values; a dark theme sets dark tints instead).
    #[serde(default = "tint_agents")]
    pub tint_agents: String,
    #[serde(default = "tint_systems")]
    pub tint_systems: String,
    #[serde(default = "tint_data")]
    pub tint_data: String,
    #[serde(default = "tint_governance")]
    pub tint_governance: String,
    #[serde(default = "tint_outcome")]
    pub tint_outcome: String,
}

impl Theme {
    /// The kind's default tint FROM THE THEME (the model call it `kindDefaultTint`
    /// mirrors this for the editor's fallback when no theme map exists yet).
    pub fn kind_tint(&self, kind: Option<crate::model::LaneKind>) -> Option<&str> {
        Some(match kind? {
            crate::model::LaneKind::Agents => self.tint_agents.as_str(),
            crate::model::LaneKind::Systems => self.tint_systems.as_str(),
            crate::model::LaneKind::Data => self.tint_data.as_str(),
            crate::model::LaneKind::Governance => self.tint_governance.as_str(),
            crate::model::LaneKind::Outcome => self.tint_outcome.as_str(),
            _ => return None,
        })
    }
}

fn band_bg() -> String {
    d("#060d2f")
}
fn band_border() -> String {
    d("#27539c")
}
fn band_eyebrow() -> String {
    d("#9fc4ff")
}
fn band_text() -> String {
    d("#cbd7f1")
}
fn canvas() -> String {
    d("#f5f7fb")
}
fn surface() -> String {
    d("#ffffff")
}
fn ink() -> String {
    d("#141b3d")
}
fn ink_strong() -> String {
    d("#131b45")
}
fn grid_head() -> String {
    d("#161f4c")
}
fn divider_bg() -> String {
    d("#182150")
}
fn row_head_bg() -> String {
    d("#f0f4fa")
}
fn row_blurb() -> String {
    d("#5e6d83")
}
fn stage_bg() -> String {
    d("#eaf1ff")
}
fn stage_ink() -> String {
    d("#17256d")
}
fn stage_blurb() -> String {
    d("#566b8e")
}
fn accent() -> String {
    d("#1d4ed8")
}
fn accent_ink() -> String {
    d("#ffffff")
}
fn accent_soft_bg() -> String {
    d("#e9efff")
}
fn accent_soft_ink() -> String {
    d("#2147a5")
}
fn item_border() -> String {
    d("#d8e1ef")
}
fn item_type() -> String {
    d("#566783")
}
fn border_soft() -> String {
    d("#e3e8f1")
}
fn legend() -> String {
    d("#566783")
}
fn stat_caption() -> String {
    d("#53647c")
}
fn note_ink() -> String {
    d("#59677d")
}
fn drawer_ink() -> String {
    d("#455670")
}
fn focus_outline() -> String {
    d("#3169e8")
}
fn selected_outline() -> String {
    d("#2563eb")
}
fn hover_soft() -> String {
    d("#e9f0ff")
}
fn tint_agents() -> String {
    d("#f3f0ff")
}
fn tint_systems() -> String {
    d("#eff9f8")
}
fn tint_data() -> String {
    d("#f3f8ff")
}
fn tint_governance() -> String {
    d("#fff3e9")
}
fn tint_outcome() -> String {
    d("#f0fbf4")
}

impl Default for Theme {
    fn default() -> Self {
        Self {
            band_bg: band_bg(),
            band_border: band_border(),
            band_eyebrow: band_eyebrow(),
            band_text: band_text(),
            canvas: canvas(),
            surface: surface(),
            ink: ink(),
            ink_strong: ink_strong(),
            grid_head: grid_head(),
            divider_bg: divider_bg(),
            row_head_bg: row_head_bg(),
            row_blurb: row_blurb(),
            stage_bg: stage_bg(),
            stage_ink: stage_ink(),
            stage_blurb: stage_blurb(),
            accent: accent(),
            accent_ink: accent_ink(),
            accent_soft_bg: accent_soft_bg(),
            accent_soft_ink: accent_soft_ink(),
            item_border: item_border(),
            item_type: item_type(),
            border_soft: border_soft(),
            legend: legend(),
            stat_caption: stat_caption(),
            note_ink: note_ink(),
            drawer_ink: drawer_ink(),
            focus_outline: focus_outline(),
            selected_outline: selected_outline(),
            hover_soft: hover_soft(),
            tint_agents: tint_agents(),
            tint_systems: tint_systems(),
            tint_data: tint_data(),
            tint_governance: tint_governance(),
            tint_outcome: tint_outcome(),
        }
    }
}
