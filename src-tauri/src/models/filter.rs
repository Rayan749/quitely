use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Filter {
    pub id: i64,
    pub name: String,
    pub enabled: bool,
    pub feed_ids: Vec<i64>,
    pub match_type: String, // "any" or "all"
    pub sort_order: i64,
    pub conditions: Vec<FilterCondition>,
    pub actions: Vec<FilterAction>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FilterCondition {
    pub id: i64,
    pub filter_id: i64,
    pub field: String,    // "title", "author", "category", "content"
    pub operator: String, // "contains", "not_contains", "equals", "starts_with", "regex"
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FilterAction {
    pub id: i64,
    pub filter_id: i64,
    pub action: String, // "mark_read", "mark_starred", "add_label", "delete"
    pub params: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateFilter {
    pub name: String,
    pub feed_ids: Vec<i64>,
    pub match_type: String,
    pub conditions: Vec<CreateFilterCondition>,
    pub actions: Vec<CreateFilterAction>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateFilterCondition {
    pub field: String,
    pub operator: String,
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateFilterAction {
    pub action: String,
    pub params: Option<String>,
}
