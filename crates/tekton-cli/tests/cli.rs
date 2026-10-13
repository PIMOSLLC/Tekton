//! CLI integration tests — run the built `tekton` binary end-to-end, exactly the
//! way a CI pipeline or a headless shell session would.

use std::process::Command;

fn tekton() -> Command {
    Command::new(env!("CARGO_BIN_EXE_tekton"))
}

fn fixture() -> &'static str {
    concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../fixtures/agentic-ai-ecommerce.yaml"
    )
}

fn temp(name: &str) -> std::path::PathBuf {
    std::env::temp_dir().join(format!("tekton-cli-test-{name}"))
}

fn run(args: &[&str]) -> (bool, String) {
    let out = tekton().args(args).output().expect("spawn tekton");
    let stdout = String::from_utf8_lossy(&out.stdout).to_string();
    let ok = out.status.success();
    // stderr carries the actionable error text — merge for assertions
    let stderr = String::from_utf8_lossy(&out.stderr);
    (ok, format!("{stdout}{}", stderr))
}

#[test]
fn render_standalone_smoke() {
    let out = temp("standalone.html");
    let (ok, _) = run(&[
        "render",
        fixture(),
        "-o",
        out.to_str().unwrap(),
        "-f",
        "standalone",
    ]);
    assert!(ok, "render must succeed");
    let html = std::fs::read_to_string(&out).unwrap();
    assert!(html.starts_with("<!doctype html>"));
    assert_eq!(html.matches("class=\"bp-item\"").count(), 40);
    assert!(html.contains("aria-live=\"polite\""));
}

#[test]
fn default_output_name_derives_from_input() {
    // No -o: expect <fixture-dir>/agentic-ai-ecommerce-standalone.html
    let expected = std::path::Path::new(fixture())
        .parent()
        .unwrap()
        .join("agentic-ai-ecommerce-standalone.html");
    let (ok, log) = run(&["render", fixture()]);
    assert!(ok, "{log}");
    assert!(log.contains(expected.file_name().unwrap().to_str().unwrap()));
    assert!(
        expected.exists(),
        "default output must be written next to the input"
    );
}

#[test]
fn validate_fixture_passes() {
    let (ok, log) = run(&["validate", fixture()]);
    assert!(ok, "{log}");
    assert!(log.contains("5 stages × 8 lanes, 40 cards"));
}

#[test]
fn lint_fixture_passes_aa() {
    let (ok, log) = run(&["lint", fixture()]);
    assert!(ok, "{log}");
    assert!(log.contains("theme passes WCAG AA"));
    assert!(log.contains("AA ok"));
}

#[test]
fn lint_failing_theme_exits_nonzero_with_suggestion() {
    // The archived recurring AA failure: white buttons on #03a9f4.
    // Leading newline guards against input files without a trailing one.
    let src = std::fs::read_to_string(fixture()).unwrap();
    let bad_path = temp("bad-theme.yaml");
    std::fs::write(&bad_path, format!("{src}\ntheme:\n  accent: \"#03a9f4\"\n")).unwrap();

    let out = tekton().arg("lint").arg(&bad_path).output().unwrap();
    assert!(!out.status.success(), "AA failure must exit 1");
    let log = String::from_utf8_lossy(&out.stdout);
    assert!(log.contains("AA FAIL"));
    assert!(log.contains("Active button text"));
    assert!(log.contains("suggested fg"));
}

#[test]
fn lint_json_is_machine_readable() {
    let out = tekton()
        .arg("lint")
        .arg(fixture())
        .arg("--json")
        .output()
        .unwrap();
    assert!(out.status.success());
    // Machine mode: stdout is pure JSON.
    let stdout = String::from_utf8_lossy(&out.stdout);
    let parsed: serde_json::Value = serde_json::from_str(&stdout).expect("pure JSON on stdout");
    let findings = parsed["findings"].as_array().expect("findings array");
    // 21 theme pairs + 2 per tinted kind lane (card text AND stage tag) → 31.
    assert_eq!(findings.len(), 31);
    assert!(findings.iter().all(|f| f["aa"].as_bool().unwrap()));
}

#[test]
fn unknown_format_is_an_error() {
    let (ok, log) = run(&["render", fixture(), "-f", "pdf"]);
    assert!(!ok);
    assert!(log.contains("unknown format"));
}

#[test]
fn missing_file_is_an_error() {
    let (ok, log) = run(&["validate", "/nonexistent/blueprint.yaml"]);
    assert!(!ok);
    assert!(log.contains("cannot read"));
}
