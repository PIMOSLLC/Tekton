//! WCAG 2.2 contrast linter — the engine's flagship: linting runs on the document's
//! theme BEFORE rendering so an inaccessible palette never ships. Ratios use the
//! spec's relative-luminance definition (WCAG 2.1+ threshold 0.04045); "large text"
//! follows SC 1.4.3: ≥24px regular or ≥18.66px bold.

use serde::Serialize;

use crate::model::Document;
use crate::theme::Theme;

/// One checked color pair.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct Finding {
    /// Human-readable element name, e.g. "Band intro text".
    pub element: String,
    pub fg: String,
    pub bg: String,
    pub ratio: f64,
    /// Large-text classification per SC 1.4.3.
    pub large: bool,
    pub aa: bool,
    pub aaa: bool,
    /// Suggested replacement foreground when AA fails (nearest passing color).
    pub suggestion: Option<String>,
    /// Suggested replacement background — only for lane tints, where the text
    /// is a shared editorial token and the tint is the local, fixable choice.
    pub bg_suggestion: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct Report {
    pub findings: Vec<Finding>,
}

impl Report {
    /// AA failures (the WCAG 2.2 conformance bar this product enforces).
    pub fn aa_failures(&self) -> Vec<&Finding> {
        self.findings.iter().filter(|f| !f.aa).collect()
    }
}

/// Parse `#rgb`, `#rrggbb`, or `#rrggbbaa` into sRGB 0..=1 channels.
/// Alpha composites onto `over` (the pair's background) so translucent colors
/// are judged at their effective value.
fn parse_hex_composited(hex: &str, over: [f64; 3]) -> Result<[f64; 3], String> {
    let h = hex.trim().trim_start_matches('#');
    let digit = |i: usize, len: usize| -> Result<u32, String> {
        u32::from_str_radix(&h[i..i + len], 16).map_err(|e| e.to_string())
    };
    let (r, g, b, a) = match h.len() {
        3 => (
            digit(0, 1)? * 17,
            digit(1, 1)? * 17,
            digit(2, 1)? * 17,
            255u32,
        ),
        6 | 8 => {
            let a = if h.len() == 8 { digit(6, 2)? } else { 255 };
            (digit(0, 2)?, digit(2, 2)?, digit(4, 2)?, a)
        }
        n => {
            return Err(format!(
                "expected #rgb, #rrggbb or #rrggbbaa, got {hex:?} with {n} hex digits"
            ))
        }
    };
    let f = |v: u32| v as f64 / 255.0;
    let (r, g, b, a) = (f(r), f(g), f(b), f(a));
    Ok([
        r * a + over[0] * (1.0 - a),
        g * a + over[1] * (1.0 - a),
        b * a + over[2] * (1.0 - a),
    ])
}

/// WCAG 2.x relative luminance.
fn luminance(c: [f64; 3]) -> f64 {
    let lin = |v: f64| {
        if v <= 0.04045 {
            v / 12.92
        } else {
            ((v + 0.055) / 1.055).powf(2.4)
        }
    };
    0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2])
}

/// Contrast ratio between two colors (`#rrggbb`-style strings; alpha supported on fg).
pub fn contrast_ratio(fg: &str, bg: &str) -> Result<f64, String> {
    let bgc = parse_hex_composited(bg, [0.0, 0.0, 0.0])?;
    let fgc = parse_hex_composited(fg, bgc)?;
    let (l1, l2) = (luminance(fgc), luminance(bgc));
    let (hi, lo) = if l1 >= l2 { (l1, l2) } else { (l2, l1) };
    Ok((hi + 0.05) / (lo + 0.05))
}

fn aa_threshold(large: bool) -> f64 {
    if large {
        3.0
    } else {
        4.5
    }
}
fn aaa_threshold(large: bool) -> f64 {
    if large {
        4.5
    } else {
        7.0
    }
}

/// Nearest foreground color that passes AA: walk HSL lightness toward the
/// background's polarity until the threshold is met (bails out after 50 steps
/// and reports the failure unchanged).
fn suggest(fg: &str, bg: &str, large: bool) -> Option<String> {
    let bgc = parse_hex_composited(bg, [0.0, 0.0, 0.0]).ok()?;
    let bg_lum = luminance(bgc);
    let darken = bg_lum > 0.18; // light backgrounds want darker text
    let (h, s, mut l) = rgb_to_hsl(parse_hex_composited(fg, bgc).ok()?);
    for _ in 0..50 {
        l = if darken { l - 0.02 } else { l + 0.02 };
        if !(0.0..=1.0).contains(&l) {
            return None;
        }
        let cand = hsl_to_hex(h, s, l);
        if contrast_ratio(&cand, bg).ok()? >= aa_threshold(large) {
            return Some(cand);
        }
    }
    None
}

/// The mirror image of `suggest`: nearest background that passes AA against a
/// fixed foreground — walk the bg's lightness AWAY from the fg's luminance.
/// Lane tint fixes use this: the shared card text stays, the tint moves.
fn suggest_bg(fg: &str, bg: &str, large: bool) -> Option<String> {
    let fgc = parse_hex_composited(fg, [0.0, 0.0, 0.0]).ok()?;
    let bgc = parse_hex_composited(bg, [0.0, 0.0, 0.0]).ok()?;
    let (fg_lum, bg_lum) = (luminance(fgc), luminance(bgc));
    let darken = fg_lum > bg_lum;
    let (h, s, mut l) = rgb_to_hsl(bgc);
    for _ in 0..50 {
        l = if darken { l - 0.02 } else { l + 0.02 };
        if !(0.0..=1.0).contains(&l) {
            return None;
        }
        let cand = hsl_to_hex(h, s, l);
        if contrast_ratio(fg, &cand).ok()? >= aa_threshold(large) {
            return Some(cand);
        }
    }
    None
}

fn rgb_to_hsl(c: [f64; 3]) -> (f64, f64, f64) {
    let [r, g, b] = c;
    let mx = r.max(g).max(b);
    let mn = r.min(g).min(b);
    let l = (mx + mn) / 2.0;
    if (mx - mn).abs() < f64::EPSILON {
        return (0.0, 0.0, l);
    }
    let d = mx - mn;
    let s = if l > 0.5 {
        d / (2.0 - mx - mn)
    } else {
        d / (mx + mn)
    };
    let h = if (mx - r).abs() < f64::EPSILON {
        ((g - b) / d) % 6.0
    } else if (mx - g).abs() < f64::EPSILON {
        (b - r) / d + 2.0
    } else {
        (r - g) / d + 4.0
    };
    (h * 60.0, s, l)
}

fn hsl_to_hex(h: f64, s: f64, l: f64) -> String {
    let c = (1.0 - (2.0 * l - 1.0).abs()) * s;
    let hp = (h.rem_euclid(360.0)) / 60.0;
    let x = c * (1.0 - (hp % 2.0 - 1.0).abs());
    let (r, g, b) = match hp as u32 {
        0 => (c, x, 0.0),
        1 => (x, c, 0.0),
        2 => (0.0, c, x),
        3 => (0.0, x, c),
        4 => (x, 0.0, c),
        _ => (c, 0.0, x),
    };
    let m = l - c / 2.0;
    let v = |t: f64| (t + m).clamp(0.0, 1.0) * 255.0;
    format!(
        "#{:02x}{:02x}{:02x}",
        v(r).round() as u8,
        v(g).round() as u8,
        v(b).round() as u8
    )
}

struct Pair<'a> {
    element: &'a str,
    fg: &'a str,
    bg: &'a str,
    large: bool,
}

/// Lint every text/background pair the theme can produce. Lane tints are included:
/// cell text is checked against every lane's tinted background, so a tint that
/// breaks contrast is caught here, not in review.
pub fn lint(doc: &Document) -> Result<Report, String> {
    let t: &Theme = &doc.theme;
    let surf = t.surface.as_str();
    let band = t.band_bg.as_str();

    let mut pairs: Vec<Pair<'_>> = vec![
        Pair {
            element: "Band eyebrow",
            fg: &t.band_eyebrow,
            bg: band,
            large: false,
        },
        Pair {
            element: "Band intro text",
            fg: &t.band_text,
            bg: band,
            large: false,
        },
        Pair {
            element: "Band headline (on band)",
            fg: surface_white(),
            bg: band,
            large: true,
        },
        Pair {
            element: "Stage header text",
            fg: &t.stage_ink,
            bg: &t.stage_bg,
            large: true,
        },
        Pair {
            element: "Stage description",
            fg: &t.stage_blurb,
            bg: &t.stage_bg,
            large: false,
        },
        Pair {
            element: "Lane label text",
            fg: &t.ink,
            bg: &t.row_head_bg,
            large: true,
        },
        Pair {
            element: "Lane label description",
            fg: &t.row_blurb,
            bg: &t.row_head_bg,
            large: false,
        },
        Pair {
            element: "Card text (surface)",
            fg: &t.ink_strong,
            bg: surf,
            large: false,
        },
        Pair {
            element: "Card stage tag",
            fg: &t.item_type,
            bg: surf,
            large: false,
        },
        Pair {
            element: "Grid corner text",
            fg: surface_white(),
            bg: &t.grid_head,
            large: false,
        },
        Pair {
            element: "Divider label text",
            fg: surface_white(),
            bg: &t.divider_bg,
            large: false,
        },
        Pair {
            element: "Toolbar legend",
            fg: &t.legend,
            bg: surf,
            large: false,
        },
        Pair {
            element: "Toolbar control text",
            fg: &t.ink_strong,
            bg: surf,
            large: false,
        },
        Pair {
            element: "Active button text",
            fg: &t.accent_ink,
            bg: &t.accent,
            large: false,
        },
        Pair {
            element: "Stat figure",
            fg: &t.accent,
            bg: surf,
            large: true,
        },
        Pair {
            element: "Stat caption",
            fg: &t.stat_caption,
            bg: surf,
            large: false,
        },
        Pair {
            element: "Pill text",
            fg: &t.accent_soft_ink,
            bg: &t.accent_soft_bg,
            large: false,
        },
        Pair {
            element: "Drawer sub-head",
            fg: &t.accent_soft_ink,
            bg: surf,
            large: false,
        },
        Pair {
            element: "Drawer body text",
            fg: &t.drawer_ink,
            bg: surf,
            large: false,
        },
        Pair {
            element: "Evidence note text",
            fg: &t.note_ink,
            bg: &t.canvas,
            large: false,
        },
        Pair {
            element: "Root body text",
            fg: &t.ink,
            bg: &t.canvas,
            large: false,
        },
    ];

    // Per-lane tints (explicit tint, else the lane-kind default): the card
    // text AND the stage tag both paint on that background. The element names
    // are built first so the borrows outlive the pushes.
    let mut tint_names: Vec<String> = Vec::new();
    for lane in &doc.lanes {
        if lane.effective_tint(&doc.theme).is_some() {
            tint_names.push(format!("Card text ({} lane tint)", lane.id));
            tint_names.push(format!("Card stage tag ({} lane tint)", lane.id));
        }
    }
    let mut tint_i = 0usize;
    for lane in &doc.lanes {
        if let Some(tint) = lane.effective_tint(&doc.theme) {
            pairs.push(Pair {
                element: &tint_names[tint_i],
                fg: &t.ink_strong,
                bg: tint,
                large: false,
            });
            tint_i += 1;
            pairs.push(Pair {
                element: &tint_names[tint_i],
                fg: &t.item_type,
                bg: tint,
                large: false,
            });
            tint_i += 1;
        }
    }

    let mut findings = Vec::with_capacity(pairs.len());
    for p in pairs {
        let ratio = contrast_ratio(p.fg, p.bg)?;
        let (aa_t, aaa_t) = (aa_threshold(p.large), aaa_threshold(p.large));
        findings.push(Finding {
            element: p.element.to_string(),
            fg: p.fg.to_string(),
            bg: p.bg.to_string(),
            ratio: (ratio * 100.0).round() / 100.0,
            large: p.large,
            aa: ratio >= aa_t,
            aaa: ratio >= aaa_t,
            suggestion: if ratio >= aa_t {
                None
            } else {
                suggest(p.fg, p.bg, p.large)
            },
            bg_suggestion: None,
        });
    }
    // Post-pass: lane-tint findings (trailing entries in construction order)
    // get a background fix — the shared card text stays, the tint moves.
    let tint_count = tint_names.len();
    let tint_start = findings.len() - tint_count;
    for f in findings.iter_mut().skip(tint_start) {
        if !f.aa {
            f.bg_suggestion = suggest_bg(&f.fg, &f.bg, f.large);
        }
    }
    Ok(Report { findings })
}

fn surface_white() -> &'static str {
    "#ffffff"
}

#[cfg(test)]
mod tests {
    use super::*;

    /// These exact pairs were computed during the DLC accessibility audits —
    /// they anchor the engine's math to reviewed-and-published numbers.
    #[test]
    fn known_ratios_match_published_audit_values() {
        let cases = [
            ("#ffffff", "#060d2f", 18.98), // case-study band h2
            ("#9fc4ff", "#060d2f", 10.68), // band eyebrow
            ("#1d4ed8", "#ffffff", 6.70),  // site accent (FIX 4)
            ("#566b8e", "#eaf1ff", 4.76),  // stage small
            ("#455670", "#ffffff", 7.45),  // drawer body
            ("#03a9f4", "#ffffff", 2.63),  // the known AA failure from the archives
        ];
        for (fg, bg, want) in cases {
            let got = contrast_ratio(fg, bg).unwrap();
            assert!(
                (got - want).abs() < 0.02,
                "{fg} on {bg}: got {got:.3}, expected {want}"
            );
        }
    }

    #[test]
    fn suggestion_fixes_the_known_failure() {
        // White text on #03a9f4 is the recurring AA failure in the site archives.
        let s = suggest("#ffffff", "#03a9f4", false).expect("a fix must exist");
        assert!(
            contrast_ratio(&s, "#03a9f4").unwrap() >= 4.5,
            "suggested {s}"
        );
    }

    #[test]
    fn suggestion_on_dark_bg_lightens() {
        // Legend gray on the navy band should lighten toward AAA/AA.
        let s = suggest("#566783", "#060d2f", false).expect("a fix must exist");
        assert!(contrast_ratio(&s, "#060d2f").unwrap() >= 4.5);
        // And it should be lighter than the original.
        let (.., l_old) = rgb_to_hsl(parse_hex_composited("#566783", [0.0; 3]).unwrap());
        let (.., l_new) = rgb_to_hsl(parse_hex_composited(&s, [0.0; 3]).unwrap());
        assert!(l_new > l_old);
    }

    #[test]
    fn bg_suggestion_fixes_a_failing_lane_tint_keeping_the_text() {
        // The editor's fix path: dark card text on a red tint (3.12:1) — the
        // background moves, the shared ink_strong token never does.
        let s = suggest_bg("#131b45", "#c93131", false).expect("a bg fix must exist");
        assert!(
            contrast_ratio("#131b45", &s).unwrap() >= 4.5,
            "suggested bg {s} passes with the text unchanged"
        );
    }

    #[test]
    fn lint_gives_failing_lane_tints_a_background_fix_and_theme_pairs_only_fg() {
        let yaml = "meta:\n  eyebrow: e\n  title: t\n  intro: i\nstages:\n  - {id: s, name: Signal}\nlanes:\n  - {id: customer, name: Customer, tint: '#c93131', cards: [{title: T, blurb: B}]}\n";
        let doc = crate::Document::from_yaml(yaml).expect("parses");
        let report = lint(&doc).expect("lints");
        for f in &report.findings {
            if f.element.contains("lane tint") {
                assert!(!f.aa, "the red tint fails");
                let fix = f.bg_suggestion.as_ref().expect("tint pairs carry a bg fix");
                assert!(contrast_ratio(&f.fg, fix).unwrap() >= 4.5, "{fix} passes");
            } else {
                assert!(
                    f.suggestion.is_none() || f.bg_suggestion.is_none(),
                    "theme pairs keep the fg-suggestion discipline: {f:?}"
                );
            }
        }
    }

    #[test]
    fn alpha_composites_onto_background() {
        // 50% black over white must equal ~#808080's ratio, not black's.
        // Tolerance 0.1: compositing lands at 127.5/255 vs the literal 128/255.
        let a = contrast_ratio("#00000080", "#ffffff").unwrap();
        let b = contrast_ratio("#808080", "#ffffff").unwrap();
        assert!((a - b).abs() < 0.1, "alpha {a} vs solid {b}");
    }

    #[test]
    fn bad_hex_is_an_error() {
        assert!(contrast_ratio("#zz", "#ffffff").is_err());
        assert!(contrast_ratio("nope", "#ffffff").is_err());
    }
}
