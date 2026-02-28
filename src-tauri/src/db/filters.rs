use rusqlite::{Connection, params};
use crate::models::{Filter, FilterCondition, FilterAction, CreateFilter};

pub fn get_all(conn: &Connection) -> Result<Vec<Filter>, String> {
    let mut stmt = conn
        .prepare("SELECT id, name, enabled, feed_ids, match_type, sort_order FROM filters ORDER BY sort_order")
        .map_err(|e| e.to_string())?;

    let filters: Vec<Filter> = stmt
        .query_map([], |row| {
            let feed_ids_str: Option<String> = row.get(3)?;
            let feed_ids: Vec<i64> = feed_ids_str
                .and_then(|s| {
                    s.split(',')
                        .filter(|s| !s.is_empty())
                        .map(|s| s.parse::<i64>().ok())
                        .collect::<Option<Vec<_>>>()
                })
                .unwrap_or_default();

            Ok(Filter {
                id: row.get(0)?,
                name: row.get::<_, Option<String>>(1)?.unwrap_or_default(),
                enabled: row.get::<_, i64>(2)? != 0,
                feed_ids,
                match_type: row.get::<_, Option<String>>(4)?.unwrap_or_else(|| "any".to_string()),
                sort_order: row.get(5)?,
                conditions: vec![],
                actions: vec![],
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    // Load conditions and actions for each filter
    let mut result = Vec::new();
    for mut filter in filters {
        filter.conditions = get_conditions(conn, filter.id)?;
        filter.actions = get_actions(conn, filter.id)?;
        result.push(filter);
    }

    Ok(result)
}

fn get_conditions(conn: &Connection, filter_id: i64) -> Result<Vec<FilterCondition>, String> {
    let mut stmt = conn
        .prepare("SELECT id, filter_id, field, operator, value FROM filter_conditions WHERE filter_id = ?")
        .map_err(|e| e.to_string())?;

    let conditions = stmt
        .query_map(params![filter_id], |row| {
            Ok(FilterCondition {
                id: row.get(0)?,
                filter_id: row.get(1)?,
                field: row.get::<_, Option<String>>(2)?.unwrap_or_default(),
                operator: row.get::<_, Option<String>>(3)?.unwrap_or_default(),
                value: row.get::<_, Option<String>>(4)?.unwrap_or_default(),
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(conditions)
}

fn get_actions(conn: &Connection, filter_id: i64) -> Result<Vec<FilterAction>, String> {
    let mut stmt = conn
        .prepare("SELECT id, filter_id, action, params FROM filter_actions WHERE filter_id = ?")
        .map_err(|e| e.to_string())?;

    let actions = stmt
        .query_map(params![filter_id], |row| {
            Ok(FilterAction {
                id: row.get(0)?,
                filter_id: row.get(1)?,
                action: row.get::<_, Option<String>>(2)?.unwrap_or_default(),
                params: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(actions)
}

pub fn create(conn: &mut Connection, filter: &CreateFilter) -> Result<i64, String> {
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    let feed_ids_str = if filter.feed_ids.is_empty() {
        None
    } else {
        Some(filter.feed_ids.iter().map(|id| id.to_string()).collect::<Vec<_>>().join(","))
    };

    tx.execute(
        "INSERT INTO filters (name, feed_ids, match_type) VALUES (?1, ?2, ?3)",
        params![filter.name, feed_ids_str, filter.match_type],
    )
    .map_err(|e| e.to_string())?;

    let filter_id = tx.last_insert_rowid();

    for cond in &filter.conditions {
        tx.execute(
            "INSERT INTO filter_conditions (filter_id, field, operator, value) VALUES (?1, ?2, ?3, ?4)",
            params![filter_id, cond.field, cond.operator, cond.value],
        )
        .map_err(|e| e.to_string())?;
    }

    for action in &filter.actions {
        tx.execute(
            "INSERT INTO filter_actions (filter_id, action, params) VALUES (?1, ?2, ?3)",
            params![filter_id, action.action, action.params],
        )
        .map_err(|e| e.to_string())?;
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(filter_id)
}

pub fn delete(conn: &Connection, id: i64) -> Result<(), String> {
    // CASCADE will handle conditions and actions
    conn.execute("DELETE FROM filters WHERE id = ?", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn set_enabled(conn: &Connection, id: i64, enabled: bool) -> Result<(), String> {
    conn.execute(
        "UPDATE filters SET enabled = ? WHERE id = ?",
        params![enabled as i64, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

/// Execute all enabled filters against the given news IDs.
/// Returns the number of articles affected.
pub fn execute_filters(conn: &Connection, news_ids: &[i64]) -> Result<usize, String> {
    if news_ids.is_empty() {
        return Ok(0);
    }

    let filters = get_all(conn)?;
    let enabled_filters: Vec<&Filter> = filters.iter().filter(|f| f.enabled).collect();

    if enabled_filters.is_empty() {
        return Ok(0);
    }

    let mut affected = 0;

    // Load the articles we need to check
    for &news_id in news_ids {
        let article = conn.query_row(
            "SELECT title, author, category, content, description FROM news WHERE id = ?",
            params![news_id],
            |row| {
                Ok((
                    row.get::<_, Option<String>>(0)?.unwrap_or_default(),
                    row.get::<_, Option<String>>(1)?.unwrap_or_default(),
                    row.get::<_, Option<String>>(2)?.unwrap_or_default(),
                    row.get::<_, Option<String>>(3)?.unwrap_or_default(),
                    row.get::<_, Option<String>>(4)?.unwrap_or_default(),
                ))
            },
        ).map_err(|e| e.to_string())?;

        let (title, author, category, content, description) = article;
        let full_content = format!("{} {}", content, description);

        for filter in &enabled_filters {
            let matches = check_filter_conditions(filter, &title, &author, &category, &full_content);

            if matches {
                apply_filter_actions(conn, filter, news_id)?;
                affected += 1;
            }
        }
    }

    Ok(affected)
}

fn check_filter_conditions(filter: &Filter, title: &str, author: &str, category: &str, content: &str) -> bool {
    let results: Vec<bool> = filter.conditions.iter().map(|cond| {
        let field_value = match cond.field.as_str() {
            "title" => title,
            "author" => author,
            "category" => category,
            "content" => content,
            _ => "",
        };

        match cond.operator.as_str() {
            "contains" => field_value.to_lowercase().contains(&cond.value.to_lowercase()),
            "not_contains" => !field_value.to_lowercase().contains(&cond.value.to_lowercase()),
            "equals" => field_value.eq_ignore_ascii_case(&cond.value),
            "starts_with" => field_value.to_lowercase().starts_with(&cond.value.to_lowercase()),
            "regex" => {
                regex::Regex::new(&cond.value)
                    .map(|re| re.is_match(field_value))
                    .unwrap_or(false)
            }
            _ => false,
        }
    }).collect();

    if results.is_empty() {
        return false;
    }

    match filter.match_type.as_str() {
        "all" => results.iter().all(|&r| r),
        _ => results.iter().any(|&r| r), // "any" is default
    }
}

fn apply_filter_actions(conn: &Connection, filter: &Filter, news_id: i64) -> Result<(), String> {
    for action in &filter.actions {
        match action.action.as_str() {
            "mark_read" => {
                conn.execute("UPDATE news SET is_read = 1 WHERE id = ?", params![news_id])
                    .map_err(|e| e.to_string())?;
            }
            "mark_starred" => {
                conn.execute("UPDATE news SET is_starred = 1 WHERE id = ?", params![news_id])
                    .map_err(|e| e.to_string())?;
            }
            "add_label" => {
                if let Some(ref label_id_str) = action.params {
                    // Append label to existing labels
                    let current: Option<String> = conn.query_row(
                        "SELECT labels FROM news WHERE id = ?",
                        params![news_id],
                        |row| row.get(0),
                    ).map_err(|e| e.to_string())?;

                    let mut label_set: Vec<String> = current
                        .unwrap_or_default()
                        .split(',')
                        .filter(|s| !s.is_empty())
                        .map(|s| s.to_string())
                        .collect();

                    if !label_set.contains(label_id_str) {
                        label_set.push(label_id_str.clone());
                    }

                    let new_labels = label_set.join(",");
                    conn.execute(
                        "UPDATE news SET labels = ? WHERE id = ?",
                        params![new_labels, news_id],
                    )
                    .map_err(|e| e.to_string())?;
                }
            }
            "delete" => {
                conn.execute("UPDATE news SET is_deleted = 1 WHERE id = ?", params![news_id])
                    .map_err(|e| e.to_string())?;
            }
            _ => {}
        }
    }
    Ok(())
}
