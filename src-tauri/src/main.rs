// The shell: one window wrapping the editor's static build. The wasm engine
// runs IN the webview, so the document stays editor-owned; the single bridge
// is the PREVIEW. The editor hands its latest rendered artifact over IPC
// (`set_preview_html`) and reads it back through this blueprint-preview://
// route, whose responses carry no CSP.
//
// Why the preview cannot load through the app document itself (an srcdoc
// iframe): the production CSP (tauri.conf.json) is inherited by srcdoc frames,
// and the artifact's interaction script is generated PER DOCUMENT — its hash
// can never sit in a fixed CSP hash list, so the exe (WebView2) and the
// appimage/rpm (WebKit) both refuse it and the preview renders dead-static
// (the bug the owner caught: dev worked, the packaged app did not). A custom
// protocol response passes through wry untouched — no CSP injection, no
// inheritance — so the artifact keeps its interactions in every bundle.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Mutex;

use tauri::http::Response;
use tauri::{Manager, State};

#[derive(Default)]
struct PreviewState(Mutex<Option<String>>);

#[tauri::command]
fn set_preview_html(state: State<PreviewState>, html: String) {
    *state.0.lock().expect("preview state mutex poisoned") = Some(html);
}

#[tauri::command]
fn clear_preview_html(state: State<PreviewState>) {
    *state.0.lock().expect("preview state mutex poisoned") = None;
}

fn main() {
    tauri::Builder::default()
        .manage(PreviewState::default())
        .invoke_handler(tauri::generate_handler![
            set_preview_html,
            clear_preview_html
        ])
        .register_uri_scheme_protocol("blueprint-preview", |ctx, _request| {
            let state = ctx.app_handle().state::<PreviewState>();
            let html = state
                .0
                .lock()
                .expect("preview state mutex poisoned")
                .clone()
                .unwrap_or_default();
            Response::builder()
                .status(200)
                .header("Content-Type", "text/html; charset=utf-8")
                .header("Access-Control-Allow-Origin", "*")
                .body(html.into_bytes())
                .expect("the preview handler's response always builds")
        })
        .run(tauri::generate_context!())
        .expect("error while running the phoenix-tekton shell");
}
