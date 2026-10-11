//! # blueprint-core
//!
//! phoenix-Tekton's service blueprint engine: document model, structural
//! validation, WCAG 2.2 contrast linting, and dual-format HTML rendering.
//!
//! The crate contract (see the repo AGENTS.md): **pure** — no Tauri, no filesystem,
//! no async runtime. It must keep compiling to `wasm32-unknown-unknown` so the
//! future Phoenix Insight Nexus toolkit module can embed it unchanged.
//!
//! ```no_run
//! use blueprint_core::{Document, Format};
//!
//! fn main() -> Result<(), blueprint_core::Error> {
//!     let doc = Document::from_yaml(include_str!("../../../fixtures/serta-simmons.yaml"))?;
//!     let html = blueprint_core::render::render(&doc, Format::Standalone)?;
//!     println!("{html:.60}");
//!     Ok(())
//! }
//! ```

pub mod lint;
pub mod model;
pub mod render;
pub mod theme;
pub mod validate;

pub use model::{Card, Document, Lane, LaneKind, Meta, Note, Stage, Stat};
pub use render::Format;
pub use theme::Theme;

/// Engine error surface — hand-rolled (no thiserror) to keep the dependency
/// footprint minimal for the wasm32 target.
#[derive(Debug)]
pub enum Error {
    /// YAML deserialization failure (serde_yaml includes line/column in its message).
    Yaml(serde_yaml::Error),
    /// JSON deserialization/serialization failure.
    Json(serde_json::Error),
    /// Validation or lint failure with the actionable detail inside.
    Render(render::RenderError),
    /// Output write failure (examples/CLI; the core itself performs no I/O).
    Io(std::io::Error),
}

impl std::fmt::Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Error::Yaml(e) => write!(f, "invalid YAML document: {e}"),
            Error::Json(e) => write!(f, "invalid JSON document: {e}"),
            Error::Render(e) => write!(f, "{e}"),
            Error::Io(e) => write!(f, "write failed: {e}"),
        }
    }
}

impl std::error::Error for Error {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match self {
            Error::Yaml(e) => Some(e),
            Error::Json(e) => Some(e),
            Error::Render(e) => Some(e),
            Error::Io(e) => Some(e),
        }
    }
}

impl From<std::io::Error> for Error {
    fn from(e: std::io::Error) -> Self {
        Error::Io(e)
    }
}

/// Convenience: parse (YAML or JSON — detected by leading brace), validate, lint,
/// and render in one call. Returns the finished HTML.
pub fn render_str(source: &str, format: Format) -> Result<String, Error> {
    let doc = Document::from_yaml(source).or_else(|_| Document::from_json(source))?;
    render::render(&doc, format)
}
