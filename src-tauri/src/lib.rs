mod commands;
mod db;
mod feed;
mod models;
mod tray;
mod worker;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            let db_state = db::init_db(&app.handle())?;
            app.manage(db_state);

            // Setup system tray
            tray::setup_tray(app.handle())?;

            // Setup feed update scheduler
            let scheduler = worker::FeedScheduler::new(30); // 30 minutes
            scheduler.start(app.handle().clone());

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_feeds,
            commands::get_feed,
            commands::create_feed,
            commands::update_feed,
            commands::delete_feed,
            commands::update_feed_counts,
            commands::fetch_feed_info,
            commands::add_feed_with_fetch,
            commands::import_opml,
            commands::export_opml,
            commands::update_feed_articles,
            commands::update_all_feeds,
            commands::get_news,
            commands::get_news_item,
            commands::update_news,
            commands::mark_all_read,
            commands::delete_news,
            commands::restore_news,
            commands::cleanup_deleted_news,
            commands::search_news,
            commands::get_news_count,
            commands::get_labels,
            commands::create_label,
            commands::update_label,
            commands::delete_label,
            commands::set_article_labels,
            commands::get_filters,
            commands::create_filter,
            commands::delete_filter,
            commands::set_filter_enabled,
            commands::get_setting,
            commands::set_setting,
            commands::delete_setting,
            commands::get_all_settings,
            commands::test_proxy,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}