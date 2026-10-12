//! WASM bindings for `blueprint-core` — the engine that runs inside the Phoenix
//! Tekton editor (browser mode) and, later, the Phoenix Insight Nexus toolkit
//! module.
//!
//! Why JSON-string returns for lint/validate: the rich types live in Rust; JS
//! receives structured data without duplicating the model in TypeScript. The
//! editor (and future Nexus module) parses what it needs.
//!
//! Build (see repo AGENTS.md / package.json scripts):
//!   cargo build -p blueprint-wasm --target wasm32-unknown-unknown --release
//!   wasm-bindgen target/wasm32-unknown-unknown/release/blueprint_wasm.wasm \
//!     --target web --out-dir src/engine

use wasm_bindgen::prelude::*;

/// Parse + validate + lint + render in one call (same contract as the CLI and
/// the future Tauri command): an invalid or AA-failing document refuses to render,
/// returning the actionable error text.
///
/// `format`: "standalone" (full page). CMS fragment embedding was removed at
/// the public cut; the parameter is a positional API slot.
#[wasm_bindgen]
pub fn render_blueprint(yaml: &str, format: &str) -> Result<String, JsValue> {
    let doc =
        blueprint_core::Document::from_yaml(yaml).map_err(|e| JsValue::from_str(&e.to_string()))?;
    match format {
        "standalone" => {}
        other => {
            return Err(JsValue::from_str(&format!(
                "unknown format {other:?} — expected \"standalone\""
            )))
        }
    }
    blueprint_core::render::render(&doc, blueprint_core::Format::Standalone)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Lint the document's theme. Returns the full report as a JSON string
/// (`{ findings: [...] }` — see `blueprint_core::lint::Report`).
#[wasm_bindgen]
pub fn lint_blueprint(yaml: &str) -> Result<String, JsValue> {
    let doc =
        blueprint_core::Document::from_yaml(yaml).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let report = blueprint_core::lint::lint(&doc).map_err(|e| JsValue::from_str(&e))?;
    serde_json::to_string(&report).map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Validate document structure. Returns `{ issues: [...] }` as a JSON string
/// (errors block rendering; warnings do not).
#[wasm_bindgen]
pub fn validate_blueprint(yaml: &str) -> Result<String, JsValue> {
    let doc =
        blueprint_core::Document::from_yaml(yaml).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let validation = blueprint_core::validate::validate(&doc);
    serde_json::to_string(&validation).map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Parse a YAML document into the canonical JSON form of `Document` — the
/// editor's state model (single source of truth stays the Rust model; JS holds
/// the parsed shape for structured editing).
#[wasm_bindgen]
pub fn parse_blueprint(yaml: &str) -> Result<String, JsValue> {
    let doc =
        blueprint_core::Document::from_yaml(yaml).map_err(|e| JsValue::from_str(&e.to_string()))?;
    serde_json::to_string(&doc).map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Serialize a JSON-form `Document` back to YAML (canonical formatting).
#[wasm_bindgen]
pub fn serialize_blueprint(json: &str) -> Result<String, JsValue> {
    let doc: blueprint_core::Document =
        serde_json::from_str(json).map_err(|e| JsValue::from_str(&e.to_string()))?;
    doc.to_yaml().map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Load a document from YAML *or* JSON source (JSON detected by its leading
/// `{` — the editor's Open path accepts both file formats, and autosave recall
/// ships canonical YAML). Returns the canonical JSON form of `Document`.
#[wasm_bindgen]
pub fn load_source(text: &str) -> Result<String, JsValue> {
    let doc = if text.trim_start().starts_with('{') {
        blueprint_core::Document::from_json(text)
    } else {
        blueprint_core::Document::from_yaml(text)
    }
    .map_err(|e| JsValue::from_str(&e.to_string()))?;
    serde_json::to_string(&doc).map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Contrast ratio for one fg/bg pair — the editor's swatch validation runs
/// through the engine's own math (the WCAG 2.x relative-luminance ratio the
/// linter uses); nothing recomputes it client-side.
#[wasm_bindgen]
pub fn contrast_ratio(fg: &str, bg: &str) -> Result<f64, JsValue> {
    blueprint_core::lint::contrast_ratio(fg, bg).map_err(|e| JsValue::from_str(&e))
}

/// Render the editor's canonical JSON state as pretty JSON — the structured
/// file format for Save-as-JSON, and the JSONB payload shape when the future
/// PIN integration stores the blueprint in `toolkit_instances` (`tool=blueprint`).
#[wasm_bindgen]
pub fn document_to_json(json: &str) -> Result<String, JsValue> {
    let doc: blueprint_core::Document =
        serde_json::from_str(json).map_err(|e| JsValue::from_str(&e.to_string()))?;
    doc.to_json().map_err(|e| JsValue::from_str(&e.to_string()))
}
