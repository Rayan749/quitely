use tauri::State;
use crate::db::DbState;
use crate::models::{Filter, CreateFilter};

#[tauri::command]
pub fn get_filters(db: State<'_, DbState>) -> Result<Vec<Filter>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::filters::get_all(&conn)
}

#[tauri::command]
pub fn create_filter(db: State<'_, DbState>, filter: CreateFilter) -> Result<i64, String> {
    let mut conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::filters::create(&mut conn, &filter)
}

#[tauri::command]
pub fn delete_filter(db: State<'_, DbState>, id: i64) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::filters::delete(&conn, id)
}

#[tauri::command]
pub fn set_filter_enabled(db: State<'_, DbState>, id: i64, enabled: bool) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::filters::set_enabled(&conn, id, enabled)
}
