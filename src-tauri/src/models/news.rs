use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct News {
    pub id: i64,
    pub feed_id: i64,
    pub guid: Option<String>,
    pub title: Option<String>,
    pub author: Option<String>,
    pub author_email: Option<String>,
    pub link: Option<String>,
    pub description: Option<String>,
    pub content: Option<String>,
    pub published_at: Option<String>,
    pub received_at: String,
    pub is_read: bool,
    pub is_new: bool,
    pub is_starred: bool,
    pub is_deleted: bool,
    pub category: Option<String>,
    pub labels: Vec<i64>,
    pub enclosure_url: Option<String>,
    pub enclosure_type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NewsFilter {
    pub feed_id: Option<i64>,
    pub unread_only: bool,
    pub starred_only: bool,
    pub deleted_only: bool,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NewsUpdate {
    pub ids: Vec<i64>,
    pub is_read: Option<bool>,
    pub is_starred: Option<bool>,
    pub is_deleted: Option<bool>,
}