use tauri::State;
use crate::db::DbState;
use crate::models::{News, NewsFilter, NewsUpdate};

#[tauri::command]
pub fn get_news(db: State<'_, DbState>, filter: NewsFilter) -> Result<Vec<News>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::news::get_by_feed(&conn, &filter)
}

#[tauri::command]
pub fn get_news_item(db: State<'_, DbState>, id: i64) -> Result<Option<News>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::news::get_by_id(&conn, id)
}

#[tauri::command]
pub fn update_news(db: State<'_, DbState>, update: NewsUpdate) -> Result<(), String> {
    let mut conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::news::update(&mut conn, &update)
}

#[tauri::command]
pub fn mark_all_read(db: State<'_, DbState>, feed_id: Option<i64>) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::news::mark_all_read(&conn, feed_id)
}

#[tauri::command]
pub fn delete_news(db: State<'_, DbState>, ids: Vec<i64>) -> Result<(), String> {
    let mut conn = db.0.lock().map_err(|e| e.to_string())?;
    let update = NewsUpdate {
        ids,
        is_read: None,
        is_starred: None,
        is_deleted: Some(true),
    };
    crate::db::news::update(&mut conn, &update)
}

#[tauri::command]
pub fn restore_news(db: State<'_, DbState>, ids: Vec<i64>) -> Result<(), String> {
    let mut conn = db.0.lock().map_err(|e| e.to_string())?;
    let update = NewsUpdate {
        ids,
        is_read: None,
        is_starred: None,
        is_deleted: Some(false),
    };
    crate::db::news::update(&mut conn, &update)
}