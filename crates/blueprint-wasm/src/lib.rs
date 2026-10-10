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
/// `format`: "standalone" (full page) or "wordpress" (embed fragment).
#[wasm_bindgen]
pub fn render_blueprint(yaml: &str, format: &str) -> Result<String, JsValue> {
    let doc = blueprint_core::Document::from_yaml(yaml)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    let fmt = match format {
        "wordpress" => blueprint_core::Format::WordPress,
        _ => blueprint_core::Format::Standalone,
    };
    blueprint_core::render::render(&doc, fmt).map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Lint the document's theme. Returns the full report as a JSON string
/// (`{ findings: [...] }` — see `blueprint_core::lint::Report`).
#[wasm_bindgen]
pub fn lint_blueprint(yaml: &str) -> Result<String, JsValue> {
    let doc = blueprint_core::Document::from_yaml(yaml)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    let report = blueprint_core::lint::lint(&doc).map_err(|e| JsValue::from_str(&e))?;
    serde_json::to_string(&report).map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Validate document structure. Returns `{ issues: [...] }` as a JSON string
/// (errors block rendering; warnings do not).
#[wasm_bindgen]
pub fn validate_blueprint(yaml: &str) -> Result<String, JsValue> {
    let doc = blueprint_core::Document::from_yaml(yaml)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    let validation = blueprint_core::validate::validate(&doc);
    serde_json::to_string(&validation).map_err(|e| JsValue::from_str(&e.to_string()))
}