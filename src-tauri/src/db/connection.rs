use std::path::PathBuf;
use std::sync::Mutex;
use rusqlite::Connection;
use tauri::Manager;

pub struct DbState(pub Mutex<Connection>);

pub fn init_db(app_handle: &tauri::AppHandle) -> Result<DbState, String> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;

    std::fs::create_dir_all(&app_dir)
        .map_err(|e| format!("Failed to create app data dir: {}", e))?;

    let db_path = PathBuf::from(&app_dir).join("quitely.db");

    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;

    // Enable foreign keys
    conn.execute_batch("PRAGMA foreign_keys = ON;")
        .map_err(|e| format!("Failed to enable foreign keys: {}", e))?;

    // Create tables
    crate::db::schema::create_tables(&conn)?;

    Ok(DbState(Mutex::new(conn)))
}