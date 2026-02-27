use tauri::State;
use crate::db::DbState;

#[tauri::command]
pub fn get_setting(db: State<'_, DbState>, key: String) -> Result<Option<String>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::settings::get(&conn, &key)
}

#[tauri::command]
pub fn set_setting(db: State<'_, DbState>, key: String, value: String) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::settings::set(&conn, &key, &value)
}

#[tauri::command]
pub fn delete_setting(db: State<'_, DbState>, key: String) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::settings::delete(&conn, &key)
}

#[tauri::command]
pub fn get_all_settings(db: State<'_, DbState>) -> Result<Vec<(String, String)>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::settings::get_all(&conn)
}