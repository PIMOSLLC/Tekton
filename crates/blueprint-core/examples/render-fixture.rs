//! End-to-end proof: renders the shipped example in both formats and writes them
//! to the working directory for manual inspection.
//!
//! ```text
//! cargo run -p blueprint-core --example render-fixture
//! ```

use blueprint_core::{Document, Format};

fn main() -> Result<(), blueprint_core::Error> {
    let yaml = include_str!("../../../fixtures/agentic-ai-ecommerce.yaml");
    let doc = Document::from_yaml(yaml)?;
    let parsed = blueprint_core::validate::validate(&doc);
    println!("validation: {} issue(s)", parsed.issues.len());
    for issue in &parsed.issues {
        println!("  [{:?}] {}", issue.severity, issue.message);
    }

    let report = blueprint_core::lint::lint(&doc)
        .map_err(|e| blueprint_core::Error::Render(blueprint_core::render::RenderError(e)))?;
    println!(
        "lint: {} pairs checked, {} AA failures",
        report.findings.len(),
        report.aa_failures().len()
    );

    let standalone = blueprint_core::render::render(&doc, Format::Standalone)?;
    let wordpress = blueprint_core::render::render(&doc, Format::WordPress)?;
    std::fs::write("agentic-ai-ecommerce-standalone.html", &standalone)?;
    std::fs::write("agentic-ai-ecommerce-wordpress.html", &wordpress)?;
    println!(
        "wrote agentic-ai-ecommerce-standalone.html ({} bytes) + agentic-ai-ecommerce-wordpress.html ({} bytes)",
        standalone.len(),
        wordpress.len()
    );
    Ok(())
}
