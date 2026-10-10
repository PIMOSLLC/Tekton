//! phoenix-Tekton service blueprint engine.
//!
//! Scaffold only — the engine (model, validate, lint, theme, render) lands on
//! `phase-1-rust-core`. See the repo AGENTS.md for the architecture contract:
//! this crate stays pure (no Tauri, no I/O, wasm32-clean) so it can power both
//! the Tauri desktop app and the future Phoenix Insight Nexus toolkit module.
