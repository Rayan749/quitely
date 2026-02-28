use tauri::State;
use crate::db::DbState;
use crate::models::{Label, CreateLabel, UpdateLabel};

#[tauri::command]
pub fn get_labels(db: State<'_, DbState>) -> Result<Vec<Label>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::labels::get_all(&conn)
}

#[tauri::command]
pub fn get_label(db: State<'_, DbState>, id: i64) -> Result<Option<Label>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::labels::get_by_id(&conn, id)
}

#[tauri::command]
pub fn create_label(db: State<'_, DbState>, label: CreateLabel) -> Result<i64, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::labels::create(&conn, &label)
}

#[tauri::command]
pub fn update_label(db: State<'_, DbState>, label: UpdateLabel) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::labels::update(&conn, &label)
}

#[tauri::command]
pub fn delete_label(db: State<'_, DbState>, id: i64) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::labels::delete(&conn, id)
}

#[tauri::command]
pub fn set_article_labels(
    db: State<'_, DbState>,
    news_ids: Vec<i64>,
    label_ids: Vec<i64>,
) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let labels_str = if label_ids.is_empty() {
        None
    } else {
        Some(label_ids.iter().map(|l| l.to_string()).collect::<Vec<_>>().join(","))
    };

    let placeholders: Vec<String> = news_ids.iter().map(|_| "?".to_string()).collect();
    let placeholders_str = placeholders.join(",");

    let query = format!(
        "UPDATE news SET labels = ?1 WHERE id IN ({})",
        placeholders_str
    );

    let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
    params_vec.push(Box::new(labels_str));
    for id in &news_ids {
        params_vec.push(Box::new(*id));
    }

    let params_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|p| p.as_ref()).collect();

    conn.execute(&query, params_refs.as_slice())
        .map_err(|e| e.to_string())?;

    Ok(())
}
