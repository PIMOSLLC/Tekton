// The stock shell: one window wrapping the editor's static build. The wasm
// engine runs IN the webview, so there is nothing to bind — `withGlobalTauri`
// stays false so `engineService` keeps its wasm path (isTauriHost reads
// window.__TAURI__, which is only injected with the global api).
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running the phoenix-tekton shell");
}
