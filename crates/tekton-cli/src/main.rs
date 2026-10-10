//! `tekton` — the phoenix-Tekton blueprint engine on the command line.
//!
//! Headless by design (Minerva is a CLI-only host): everything testable without
//! a GUI lives here. Exit codes are CI-friendly — lint and validate return 1 on
//! failures, render returns 1 on validation/lint errors (an inaccessible theme
//! refuses to render, mirroring the library contract).
//!
//! Visual testing path (documented in the repo AGENTS.md):
//!   tekton render fixtures/serta-simmons.yaml
//!   cd <output-dir> && python3 -m http.server 6041
//!   -> open http://<minerva-lan-ip>:6041/serta-simmons-standalone.html in any browser

use blueprint_core::{Document, Format};
use clap::{Parser, Subcommand};
use std::path::{Path, PathBuf};
use std::process::ExitCode;

#[derive(Parser)]
#[command(
    name = "tekton",
    version,
    about = "phoenix-Tekton blueprint engine CLI — render, lint, and validate interactive service blueprints"
)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Render a blueprint document to self-contained HTML
    Render {
        /// Input document (YAML or JSON — YAML is a JSON superset, so both parse)
        input: PathBuf,
        /// Output file (default: <input-stem>-<format>.html next to the input)
        #[arg(short, long)]
        output: Option<PathBuf>,
        /// Output format: standalone (full page) or wordpress (embed fragment)
        #[arg(short = 'f', long, default_value = "standalone")]
        format: String,
    },
    /// Lint the document's theme against WCAG 2.2 (exits 1 on AA failures)
    Lint {
        /// Input document
        input: PathBuf,
        /// Emit machine-readable JSON (still exits 1 on AA failures)
        #[arg(long)]
        json: bool,
    },
    /// Validate document structure (exits 1 on errors)
    Validate {
        /// Input document
        input: PathBuf,
    },
}

fn main() -> ExitCode {
    let cli = Cli::parse();
    match cli.command {
        Commands::Render {
            input,
            output,
            format,
        } => cmd_render(&input, output, &format),
        Commands::Lint { input, json } => cmd_lint(&input, json),
        Commands::Validate { input } => cmd_validate(&input),
    }
}

fn load(input: &Path) -> Result<Document, String> {
    let text = std::fs::read_to_string(input)
        .map_err(|e| format!("cannot read {}: {e}", input.display()))?;
    Document::from_yaml(&text).map_err(|e| format!("not a valid blueprint document: {e}"))
}

fn parse_format(s: &str) -> Result<Format, String> {
    match s {
        "standalone" => Ok(Format::Standalone),
        "wordpress" => Ok(Format::WordPress),
        other => Err(format!(
            "unknown format {other:?} — expected standalone or wordpress"
        )),
    }
}

fn cmd_render(input: &Path, output: Option<PathBuf>, format: &str) -> ExitCode {
    let fmt = match parse_format(format) {
        Ok(f) => f,
        Err(e) => return fail(e),
    };
    let doc = match load(input) {
        Ok(d) => d,
        Err(e) => return fail(e),
    };
    let html = match blueprint_core::render::render(&doc, fmt) {
        Ok(h) => h,
        Err(e) => return fail(e.to_string()),
    };
    let out = output.unwrap_or_else(|| default_output(input, fmt));
    if let Err(e) = std::fs::write(&out, &html) {
        return fail(format!("cannot write {}: {e}", out.display()));
    }
    println!("wrote {} ({} bytes)", out.display(), html.len());
    println!("serve + view: cd into the output dir, `python3 -m http.server 6041`,");
    println!("then open the file from any LAN browser.");
    ExitCode::SUCCESS
}

fn cmd_lint(input: &Path, json: bool) -> ExitCode {
    let doc = match load(input) {
        Ok(d) => d,
        Err(e) => return fail(e),
    };
    // Structural errors block linting — malformed hexes would poison the contrast math.
    let validation = blueprint_core::validate::validate(&doc);
    if !validation.is_ok() {
        for issue in validation.errors() {
            eprintln!("[error] {}", issue.message);
        }
        return ExitCode::FAILURE;
    }
    let report = match blueprint_core::lint::lint(&doc) {
        Ok(r) => r,
        Err(e) => return fail(e),
    };
    let failures = report.aa_failures().len();
    let summary = if failures == 0 {
        format!(
            "{} pairs checked — theme passes WCAG AA",
            report.findings.len()
        )
    } else {
        format!("{failures} of {} pairs FAIL WCAG AA", report.findings.len())
    };
    if json {
        // Machine mode: stdout is PURE JSON (one parseable document); the human
        // summary goes to stderr so pipelines stay clean.
        let payload = serde_json::to_string_pretty(&report).expect("findings serialize");
        println!("{payload}");
        eprintln!("{summary}");
    } else {
        for f in &report.findings {
            let class = if f.large { "large" } else { "normal" };
            let aa = if f.aa { "AA ok" } else { "AA FAIL" };
            let aaa = if f.aaa { "AAA ok" } else { "AAA no" };
            let suggestion = f
                .suggestion
                .as_deref()
                .map(|s| format!(" (suggested fg: {s})"))
                .unwrap_or_default();
            println!(
                "{aa:>8}  {aaa:>7}  [{class:>5}]  {}: {} on {} = {:.2}:1{suggestion}",
                f.element, f.fg, f.bg, f.ratio
            );
        }
        println!("{summary}");
    }
    if failures == 0 {
        ExitCode::SUCCESS
    } else {
        ExitCode::FAILURE
    }
}

fn cmd_validate(input: &Path) -> ExitCode {
    let doc = match load(input) {
        Ok(d) => d,
        Err(e) => return fail(e),
    };
    let v = blueprint_core::validate::validate(&doc);
    for issue in &v.issues {
        let tag = match issue.severity {
            blueprint_core::validate::Severity::Error => "error",
            blueprint_core::validate::Severity::Warning => "warning",
        };
        println!("[{tag}] {}", issue.message);
    }
    if v.issues.is_empty() {
        println!(
            "valid: {} stages × {} lanes, {} cards, note present: {}",
            doc.stages.len(),
            doc.lanes.len(),
            doc.card_count(),
            doc.note.is_some()
        );
    }
    if v.is_ok() {
        ExitCode::SUCCESS
    } else {
        ExitCode::FAILURE
    }
}

fn default_output(input: &Path, fmt: Format) -> PathBuf {
    let stem = input
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("blueprint");
    let dir = input
        .parent()
        .filter(|p| !p.as_os_str().is_empty())
        .map(Path::to_path_buf)
        .unwrap_or_default();
    let suffix = match fmt {
        Format::Standalone => "standalone",
        Format::WordPress => "wordpress",
    };
    dir.join(format!("{stem}-{suffix}.html"))
}

fn fail(msg: impl std::fmt::Display) -> ExitCode {
    eprintln!("error: {msg}");
    ExitCode::FAILURE
}
