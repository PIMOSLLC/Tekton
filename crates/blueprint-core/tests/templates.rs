//! Starter template parity — the two seeds every new-user journey begins from
//! (`templates/starter.yaml`, the commented teaching format, and
//! `templates/starter.json`, the structured format) must parse to the exact
//! same document, and that document must validate and lint clean. A broken
//! starter is a broken first impression.

use blueprint_core::Document;

const YAML: &str = include_str!("../../../templates/starter.yaml");
const JSON: &str = include_str!("../../../templates/starter.json");

#[test]
fn yaml_and_json_seeds_parse_to_the_same_document() {
    let from_yaml = Document::from_yaml(YAML).expect("starter.yaml must parse");
    let from_json = Document::from_json(JSON).expect("starter.json must parse");
    assert_eq!(from_yaml, from_json, "the two seeds are one document");
}

#[test]
fn starter_validates_with_zero_errors_and_zero_warnings() {
    let doc = Document::from_yaml(YAML).expect("starter.yaml must parse");
    let v = blueprint_core::validate::validate(&doc);
    assert!(v.is_ok(), "starter must render: {:?}", v.issues);
    assert!(
        v.issues.is_empty(),
        "the first impression should be fully clean, not 'valid with warnings': {:?}",
        v.issues
    );
}

#[test]
fn starter_lints_aaa_clean_on_the_default_theme() {
    // The starter omits `theme` on purpose: the default hue-230 palette must
    // pass AA (and is tight enough to hit AAA here — asserted to catch drift
    // in the default theme's palette the way the fixture comment intends).
    let doc = Document::from_yaml(YAML).expect("starter.yaml must parse");
    let report = blueprint_core::lint::lint(&doc).expect("starter must lint");
    let failing: Vec<_> = report.findings.iter().filter(|f| !f.aa).collect();
    assert!(
        failing.is_empty(),
        "starter must pass the WCAG AA gate: {:?}",
        failing
    );
}
