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

#[tauri::command]
pub async fn test_proxy(proxy_url: String) -> Result<String, String> {
    let proxy = reqwest::Proxy::all(&proxy_url).map_err(|e| e.to_string())?;
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .proxy(proxy)
        .build()
        .map_err(|e| e.to_string())?;

    let response = client
        .get("https://httpbin.org/ip")
        .send()
        .await
        .map_err(|e| format!("Connection failed: {}", e))?;

    let status = response.status();
    if status.is_success() {
        Ok(format!("Proxy working (status: {})", status))
    } else {
        Err(format!("Proxy returned status: {}", status))
    }
}