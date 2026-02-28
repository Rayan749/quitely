use rusqlite::{Connection, params, OptionalExtension};
use crate::models::{Label, CreateLabel, UpdateLabel};

pub fn get_all(conn: &Connection) -> Result<Vec<Label>, String> {
    let mut stmt = conn
        .prepare("SELECT id, name, color, sort_order FROM labels ORDER BY sort_order, name")
        .map_err(|e| e.to_string())?;

    let labels = stmt
        .query_map([], |row| {
            Ok(Label {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
                sort_order: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(labels)
}

pub fn get_by_id(conn: &Connection, id: i64) -> Result<Option<Label>, String> {
    let result = conn
        .query_row(
            "SELECT id, name, color, sort_order FROM labels WHERE id = ?",
            params![id],
            |row| {
                Ok(Label {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    color: row.get(2)?,
                    sort_order: row.get(3)?,
                })
            },
        )
        .optional()
        .map_err(|e| e.to_string())?;

    Ok(result)
}

pub fn create(conn: &Connection, label: &CreateLabel) -> Result<i64, String> {
    conn.execute(
        "INSERT INTO labels (name, color) VALUES (?1, ?2)",
        params![label.name, label.color],
    )
    .map_err(|e| e.to_string())?;

    Ok(conn.last_insert_rowid())
}

pub fn update(conn: &Connection, label: &UpdateLabel) -> Result<(), String> {
    if let Some(ref name) = label.name {
        conn.execute(
            "UPDATE labels SET name = ?1 WHERE id = ?2",
            params![name, label.id],
        )
        .map_err(|e| e.to_string())?;
    }

    if let Some(ref color) = label.color {
        conn.execute(
            "UPDATE labels SET color = ?1 WHERE id = ?2",
            params![color, label.id],
        )
        .map_err(|e| e.to_string())?;
    }

    if let Some(sort_order) = label.sort_order {
        conn.execute(
            "UPDATE labels SET sort_order = ?1 WHERE id = ?2",
            params![sort_order, label.id],
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(())
}

pub fn delete(conn: &Connection, id: i64) -> Result<(), String> {
    conn.execute("DELETE FROM labels WHERE id = ?", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
