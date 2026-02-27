use rusqlite::{Connection, OptionalExtension, params};
use crate::models::{Feed, CreateFeed, UpdateFeed, FeedCount};

pub fn get_all(conn: &Connection) -> Result<Vec<Feed>, String> {
    let mut stmt = conn
        .prepare(
            r#"
            SELECT id, parent_id, text, title, description, xml_url, html_url,
                   language, unread_count, new_count, update_interval, auto_update,
                   disabled, layout, last_updated, status, error_message
            FROM feeds
            ORDER BY parent_id, text
            "#,
        )
        .map_err(|e| e.to_string())?;

    let feeds = stmt
        .query_map([], |row| {
            Ok(Feed {
                id: row.get(0)?,
                parent_id: row.get(1)?,
                text: row.get(2)?,
                title: row.get(3)?,
                description: row.get(4)?,
                xml_url: row.get(5)?,
                html_url: row.get(6)?,
                language: row.get(7)?,
                unread_count: row.get(8)?,
                new_count: row.get(9)?,
                update_interval: row.get(10)?,
                auto_update: row.get::<_, i64>(11)? != 0,
                disabled: row.get::<_, i64>(12)? != 0,
                layout: row.get(13)?,
                last_updated: row.get(14)?,
                status: row.get(15)?,
                error_message: row.get(16)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(feeds)
}

pub fn get_by_id(conn: &Connection, id: i64) -> Result<Option<Feed>, String> {
    let mut stmt = conn
        .prepare(
            r#"
            SELECT id, parent_id, text, title, description, xml_url, html_url,
                   language, unread_count, new_count, update_interval, auto_update,
                   disabled, layout, last_updated, status, error_message
            FROM feeds WHERE id = ?
            "#,
        )
        .map_err(|e| e.to_string())?;

    let result = stmt
        .query_row(params![id], |row| {
            Ok(Feed {
                id: row.get(0)?,
                parent_id: row.get(1)?,
                text: row.get(2)?,
                title: row.get(3)?,
                description: row.get(4)?,
                xml_url: row.get(5)?,
                html_url: row.get(6)?,
                language: row.get(7)?,
                unread_count: row.get(8)?,
                new_count: row.get(9)?,
                update_interval: row.get(10)?,
                auto_update: row.get::<_, i64>(11)? != 0,
                disabled: row.get::<_, i64>(12)? != 0,
                layout: row.get(13)?,
                last_updated: row.get(14)?,
                status: row.get(15)?,
                error_message: row.get(16)?,
            })
        })
        .optional()
        .map_err(|e| e.to_string())?;

    Ok(result)
}

pub fn create(conn: &Connection, feed: &CreateFeed) -> Result<i64, String> {
    let now = chrono::Utc::now().to_rfc3339();
    let parent_id = feed.parent_id.unwrap_or(0);
    let title = feed.title.clone().unwrap_or_else(|| feed.xml_url.clone());

    conn.execute(
        r#"
        INSERT INTO feeds (xml_url, parent_id, text, title, created_at, updated_at)
        VALUES (?1, ?2, ?3, ?4, ?5, ?5)
        "#,
        params![feed.xml_url, parent_id, &title, &title, now],
    )
    .map_err(|e| e.to_string())?;

    Ok(conn.last_insert_rowid())
}

pub fn update(conn: &Connection, feed: &UpdateFeed) -> Result<(), String> {
    let now = chrono::Utc::now().to_rfc3339();

    if let Some(title) = &feed.title {
        conn.execute(
            "UPDATE feeds SET title = ?1, text = ?1, updated_at = ?2 WHERE id = ?3",
            params![title, now, feed.id],
        )
        .map_err(|e| e.to_string())?;
    }

    if let Some(parent_id) = feed.parent_id {
        conn.execute(
            "UPDATE feeds SET parent_id = ?1, updated_at = ?2 WHERE id = ?3",
            params![parent_id, now, feed.id],
        )
        .map_err(|e| e.to_string())?;
    }

    if let Some(update_interval) = feed.update_interval {
        conn.execute(
            "UPDATE feeds SET update_interval = ?1, updated_at = ?2 WHERE id = ?3",
            params![update_interval, now, feed.id],
        )
        .map_err(|e| e.to_string())?;
    }

    if let Some(auto_update) = feed.auto_update {
        let val = if auto_update { 1i64 } else { 0i64 };
        conn.execute(
            "UPDATE feeds SET auto_update = ?1, updated_at = ?2 WHERE id = ?3",
            params![val, now, feed.id],
        )
        .map_err(|e| e.to_string())?;
    }

    if let Some(disabled) = feed.disabled {
        let val = if disabled { 1i64 } else { 0i64 };
        conn.execute(
            "UPDATE feeds SET disabled = ?1, updated_at = ?2 WHERE id = ?3",
            params![val, now, feed.id],
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(())
}

pub fn delete(conn: &Connection, id: i64) -> Result<(), String> {
    conn.execute("DELETE FROM feeds WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn update_counts(conn: &mut Connection, counts: &[FeedCount]) -> Result<(), String> {
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    for count in counts {
        tx.execute(
            "UPDATE feeds SET unread_count = ?1, new_count = ?2 WHERE id = ?3",
            params![count.unread_count, count.new_count, count.id],
        )
        .map_err(|e| e.to_string())?;
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}