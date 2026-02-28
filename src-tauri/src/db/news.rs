use rusqlite::{Connection, params, OptionalExtension};
use crate::models::{News, NewsFilter, NewsUpdate};

pub fn get_all(conn: &Connection) -> Result<Vec<News>, String> {
    let mut stmt = conn
        .prepare(
            r#"
            SELECT id, feed_id, guid, title, author, author_email, link,
                   description, content, published_at, received_at,
                   is_read, is_new, is_starred, is_deleted, category,
                   labels, enclosure_url, enclosure_type
            FROM news
            ORDER BY published_at DESC
            "#
        )
        .map_err(|e| e.to_string())?;

    let news_list = stmt
        .query_map([], |row| {
            let labels_str: Option<String> = row.get(16)?;
            let labels: Vec<i64> = labels_str
                .and_then(|s| {
                    s.split(',')
                        .filter(|s| !s.is_empty())
                        .map(|s| s.parse::<i64>().ok())
                        .collect::<Option<Vec<_>>>()
                })
                .unwrap_or_default();

            Ok(News {
                id: row.get(0)?,
                feed_id: row.get(1)?,
                guid: row.get(2)?,
                title: row.get(3)?,
                author: row.get(4)?,
                author_email: row.get(5)?,
                link: row.get(6)?,
                description: row.get(7)?,
                content: row.get(8)?,
                published_at: row.get(9)?,
                received_at: row.get(10)?,
                is_read: row.get::<_, i64>(11)? != 0,
                is_new: row.get::<_, i64>(12)? != 0,
                is_starred: row.get::<_, i64>(13)? != 0,
                is_deleted: row.get::<_, i64>(14)? != 0,
                category: row.get(15)?,
                labels,
                enclosure_url: row.get(17)?,
                enclosure_type: row.get(18)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(news_list)
}

pub fn get_by_id(conn: &Connection, id: i64) -> Result<Option<News>, String> {
    let mut stmt = conn
        .prepare(
            r#"
            SELECT id, feed_id, guid, title, author, author_email, link,
                   description, content, published_at, received_at,
                   is_read, is_new, is_starred, is_deleted, category,
                   labels, enclosure_url, enclosure_type
            FROM news WHERE id = ?
            "#
        )
        .map_err(|e| e.to_string())?;

    let result = stmt
        .query_row(params![id], |row| {
            let labels_str: Option<String> = row.get(16)?;
            let labels: Vec<i64> = labels_str
                .and_then(|s| {
                    s.split(',')
                        .filter(|s| !s.is_empty())
                        .map(|s| s.parse::<i64>().ok())
                        .collect::<Option<Vec<_>>>()
                })
                .unwrap_or_default();

            Ok(News {
                id: row.get(0)?,
                feed_id: row.get(1)?,
                guid: row.get(2)?,
                title: row.get(3)?,
                author: row.get(4)?,
                author_email: row.get(5)?,
                link: row.get(6)?,
                description: row.get(7)?,
                content: row.get(8)?,
                published_at: row.get(9)?,
                received_at: row.get(10)?,
                is_read: row.get::<_, i64>(11)? != 0,
                is_new: row.get::<_, i64>(12)? != 0,
                is_starred: row.get::<_, i64>(13)? != 0,
                is_deleted: row.get::<_, i64>(14)? != 0,
                category: row.get(15)?,
                labels,
                enclosure_url: row.get(17)?,
                enclosure_type: row.get(18)?,
            })
        })
        .optional()
        .map_err(|e| e.to_string())?;

    Ok(result)
}

pub fn get_by_feed(conn: &Connection, filter: &NewsFilter) -> Result<Vec<News>, String> {
    let mut query = String::from(
        r#"
        SELECT id, feed_id, guid, title, author, author_email, link,
               description, content, published_at, received_at,
               is_read, is_new, is_starred, is_deleted, category,
               labels, enclosure_url, enclosure_type
        FROM news WHERE 1=1
        "#
    );

    let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(feed_id) = filter.feed_id {
        query.push_str(" AND feed_id = ?");
        params_vec.push(Box::new(feed_id));
    }

    if filter.unread_only {
        query.push_str(" AND is_read = 0");
    }

    if filter.starred_only {
        query.push_str(" AND is_starred = 1");
    }

    if filter.deleted_only {
        query.push_str(" AND is_deleted = 1");
    } else {
        query.push_str(" AND is_deleted = 0");
    }

    query.push_str(" ORDER BY published_at DESC");

    if let Some(limit) = filter.limit {
        query.push_str(&format!(" LIMIT {}", limit));
    }

    if let Some(offset) = filter.offset {
        query.push_str(&format!(" OFFSET {}", offset));
    }

    let params_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|p| p.as_ref()).collect();

    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;

    let news_list = stmt
        .query_map(params_refs.as_slice(), |row| {
            let labels_str: Option<String> = row.get(16)?;
            let labels: Vec<i64> = labels_str
                .and_then(|s| {
                    s.split(',')
                        .filter(|s| !s.is_empty())
                        .map(|s| s.parse::<i64>().ok())
                        .collect::<Option<Vec<_>>>()
                })
                .unwrap_or_default();

            Ok(News {
                id: row.get(0)?,
                feed_id: row.get(1)?,
                guid: row.get(2)?,
                title: row.get(3)?,
                author: row.get(4)?,
                author_email: row.get(5)?,
                link: row.get(6)?,
                description: row.get(7)?,
                content: row.get(8)?,
                published_at: row.get(9)?,
                received_at: row.get(10)?,
                is_read: row.get::<_, i64>(11)? != 0,
                is_new: row.get::<_, i64>(12)? != 0,
                is_starred: row.get::<_, i64>(13)? != 0,
                is_deleted: row.get::<_, i64>(14)? != 0,
                category: row.get(15)?,
                labels,
                enclosure_url: row.get(17)?,
                enclosure_type: row.get(18)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(news_list)
}

pub fn create(conn: &Connection, news: &News) -> Result<i64, String> {
    let now = chrono::Utc::now().to_rfc3339();
    let labels_str = if news.labels.is_empty() {
        None
    } else {
        Some(news.labels.iter().map(|l| l.to_string()).collect::<Vec<_>>().join(","))
    };

    conn.execute(
        r#"
        INSERT INTO news (
            feed_id, guid, title, author, author_email, link,
            description, content, published_at, received_at,
            is_read, is_new, is_starred, is_deleted, category,
            labels, enclosure_url, enclosure_type
        )
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18)
        "#,
        params![
            news.feed_id,
            news.guid,
            news.title,
            news.author,
            news.author_email,
            news.link,
            news.description,
            news.content,
            news.published_at,
            now,
            news.is_read as i64,
            news.is_new as i64,
            news.is_starred as i64,
            news.is_deleted as i64,
            news.category,
            labels_str,
            news.enclosure_url,
            news.enclosure_type,
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(conn.last_insert_rowid())
}

pub fn update(conn: &mut Connection, update: &NewsUpdate) -> Result<(), String> {
    let now = chrono::Utc::now().to_rfc3339();

    if update.ids.is_empty() {
        return Ok(());
    }

    let tx = conn.transaction().map_err(|e| e.to_string())?;

    let placeholders: Vec<String> = update.ids.iter().map(|_| "?".to_string()).collect();
    let placeholders_str = placeholders.join(",");

    if let Some(is_read) = update.is_read {
        let query = format!(
            "UPDATE news SET is_read = ?, received_at = ? WHERE id IN ({})",
            placeholders_str
        );
        let mut stmt = tx.prepare(&query).map_err(|e| e.to_string())?;
        let params: Vec<&dyn rusqlite::ToSql> = std::iter::once(&is_read as &dyn rusqlite::ToSql)
            .chain(std::iter::once(&now as &dyn rusqlite::ToSql))
            .chain(update.ids.iter().map(|id| id as &dyn rusqlite::ToSql))
            .collect();
        stmt.execute(params.as_slice()).map_err(|e| e.to_string())?;
    }

    if let Some(is_starred) = update.is_starred {
        let query = format!(
            "UPDATE news SET is_starred = ? WHERE id IN ({})",
            placeholders_str
        );
        let mut stmt = tx.prepare(&query).map_err(|e| e.to_string())?;
        let params: Vec<&dyn rusqlite::ToSql> = std::iter::once(&is_starred as &dyn rusqlite::ToSql)
            .chain(update.ids.iter().map(|id| id as &dyn rusqlite::ToSql))
            .collect();
        stmt.execute(params.as_slice()).map_err(|e| e.to_string())?;
    }

    if let Some(is_deleted) = update.is_deleted {
        let query = format!(
            "UPDATE news SET is_deleted = ? WHERE id IN ({})",
            placeholders_str
        );
        let mut stmt = tx.prepare(&query).map_err(|e| e.to_string())?;
        let params: Vec<&dyn rusqlite::ToSql> = std::iter::once(&is_deleted as &dyn rusqlite::ToSql)
            .chain(update.ids.iter().map(|id| id as &dyn rusqlite::ToSql))
            .collect();
        stmt.execute(params.as_slice()).map_err(|e| e.to_string())?;
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

pub fn mark_all_read(conn: &Connection, feed_id: Option<i64>) -> Result<(), String> {
    let now = chrono::Utc::now().to_rfc3339();

    if let Some(fid) = feed_id {
        conn.execute(
            "UPDATE news SET is_read = 1, received_at = ? WHERE feed_id = ? AND is_read = 0",
            params![now, fid],
        )
        .map_err(|e| e.to_string())?;
    } else {
        conn.execute(
            "UPDATE news SET is_read = 1, received_at = ? WHERE is_read = 0",
            params![now],
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(())
}

pub fn delete_permanently(conn: &Connection, ids: &[i64]) -> Result<(), String> {
    if ids.is_empty() {
        return Ok(());
    }

    let placeholders: Vec<String> = ids.iter().map(|_| "?".to_string()).collect();
    let placeholders_str = placeholders.join(",");

    let query = format!("DELETE FROM news WHERE id IN ({})", placeholders_str);
    let params: Vec<&dyn rusqlite::ToSql> = ids.iter().map(|id| id as &dyn rusqlite::ToSql).collect();

    conn.execute(&query, params.as_slice())
        .map_err(|e| e.to_string())?;

    Ok(())
}

pub fn cleanup_deleted(conn: &Connection, older_than_days: i64) -> Result<usize, String> {
    let cutoff = chrono::Utc::now() - chrono::Duration::days(older_than_days);
    let cutoff_str = cutoff.to_rfc3339();

    let count = conn
        .execute(
            "DELETE FROM news WHERE is_deleted = 1 AND received_at < ?",
            params![cutoff_str],
        )
        .map_err(|e| e.to_string())?;

    Ok(count)
}

pub fn search(conn: &Connection, query: &str, feed_id: Option<i64>, limit: Option<i64>, offset: Option<i64>) -> Result<Vec<News>, String> {
    let search_pattern = format!("%{}%", query);

    let mut sql = String::from(
        r#"
        SELECT id, feed_id, guid, title, author, author_email, link,
               description, content, published_at, received_at,
               is_read, is_new, is_starred, is_deleted, category,
               labels, enclosure_url, enclosure_type
        FROM news WHERE is_deleted = 0
          AND (title LIKE ?1 OR author LIKE ?1 OR content LIKE ?1 OR description LIKE ?1)
        "#
    );

    let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
    params_vec.push(Box::new(search_pattern));

    if let Some(fid) = feed_id {
        sql.push_str(" AND feed_id = ?");
        params_vec.push(Box::new(fid));
    }

    sql.push_str(" ORDER BY published_at DESC");

    if let Some(lim) = limit {
        sql.push_str(&format!(" LIMIT {}", lim));
    }

    if let Some(off) = offset {
        sql.push_str(&format!(" OFFSET {}", off));
    }

    let params_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|p| p.as_ref()).collect();
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;

    let news_list = stmt
        .query_map(params_refs.as_slice(), |row| {
            let labels_str: Option<String> = row.get(16)?;
            let labels: Vec<i64> = labels_str
                .and_then(|s| {
                    s.split(',')
                        .filter(|s| !s.is_empty())
                        .map(|s| s.parse::<i64>().ok())
                        .collect::<Option<Vec<_>>>()
                })
                .unwrap_or_default();

            Ok(News {
                id: row.get(0)?,
                feed_id: row.get(1)?,
                guid: row.get(2)?,
                title: row.get(3)?,
                author: row.get(4)?,
                author_email: row.get(5)?,
                link: row.get(6)?,
                description: row.get(7)?,
                content: row.get(8)?,
                published_at: row.get(9)?,
                received_at: row.get(10)?,
                is_read: row.get::<_, i64>(11)? != 0,
                is_new: row.get::<_, i64>(12)? != 0,
                is_starred: row.get::<_, i64>(13)? != 0,
                is_deleted: row.get::<_, i64>(14)? != 0,
                category: row.get(15)?,
                labels,
                enclosure_url: row.get(17)?,
                enclosure_type: row.get(18)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(news_list)
}

pub fn count(conn: &Connection, filter: &NewsFilter) -> Result<i64, String> {
    let mut query = String::from("SELECT COUNT(*) FROM news WHERE 1=1");
    let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(feed_id) = filter.feed_id {
        query.push_str(" AND feed_id = ?");
        params_vec.push(Box::new(feed_id));
    }

    if filter.unread_only {
        query.push_str(" AND is_read = 0");
    }

    if filter.starred_only {
        query.push_str(" AND is_starred = 1");
    }

    if filter.deleted_only {
        query.push_str(" AND is_deleted = 1");
    } else {
        query.push_str(" AND is_deleted = 0");
    }

    let params_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|p| p.as_ref()).collect();

    conn.query_row(&query, params_refs.as_slice(), |row| row.get(0))
        .map_err(|e| e.to_string())
}