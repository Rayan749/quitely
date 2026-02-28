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

#[tauri::command]
pub fn cleanup_deleted_news(db: State<'_, DbState>, older_than_days: i64) -> Result<usize, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::news::cleanup_deleted(&conn, older_than_days)
}

#[tauri::command]
pub fn search_news(
    db: State<'_, DbState>,
    query: String,
    feed_id: Option<i64>,
    limit: Option<i64>,
    offset: Option<i64>,
) -> Result<Vec<News>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::news::search(&conn, &query, feed_id, limit, offset)
}

#[tauri::command]
pub fn get_news_count(db: State<'_, DbState>, filter: NewsFilter) -> Result<i64, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::news::count(&conn, &filter)
}

#[tauri::command]
pub fn get_all_news(db: State<'_, DbState>) -> Result<Vec<News>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::news::get_all(&conn)
}

#[tauri::command]
pub fn purge_news(db: State<'_, DbState>, ids: Vec<i64>) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::news::delete_permanently(&conn, &ids)
}