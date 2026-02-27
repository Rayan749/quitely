use tauri::State;
use crate::db::DbState;
use crate::models::{Feed, CreateFeed, UpdateFeed, FeedCount};

#[tauri::command]
pub fn get_feeds(db: State<'_, DbState>) -> Result<Vec<Feed>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::feeds::get_all(&conn)
}

#[tauri::command]
pub fn get_feed(db: State<'_, DbState>, id: i64) -> Result<Option<Feed>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::feeds::get_by_id(&conn, id)
}

#[tauri::command]
pub fn create_feed(db: State<'_, DbState>, feed: CreateFeed) -> Result<i64, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::feeds::create(&conn, &feed)
}

#[tauri::command]
pub fn update_feed(db: State<'_, DbState>, feed: UpdateFeed) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::feeds::update(&conn, &feed)
}

#[tauri::command]
pub fn delete_feed(db: State<'_, DbState>, id: i64) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::feeds::delete(&conn, id)
}

#[tauri::command]
pub fn update_feed_counts(db: State<'_, DbState>, counts: Vec<FeedCount>) -> Result<(), String> {
    let mut conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::feeds::update_counts(&mut conn, &counts)
}