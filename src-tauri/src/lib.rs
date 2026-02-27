mod commands;
mod db;
mod feed;
mod models;

use db::DbState;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let db_state = db::init_db(&app.handle())?;
            app.manage(db_state);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_feeds,
            commands::get_feed,
            commands::create_feed,
            commands::update_feed,
            commands::delete_feed,
            commands::update_feed_counts,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}