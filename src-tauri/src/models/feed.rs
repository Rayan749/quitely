use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Feed {
    pub id: i64,
    pub parent_id: i64,
    pub text: String,
    pub title: String,
    pub description: Option<String>,
    pub xml_url: String,
    pub html_url: Option<String>,
    pub language: Option<String>,
    pub unread_count: i64,
    pub new_count: i64,
    pub update_interval: i64,
    pub auto_update: bool,
    pub disabled: bool,
    pub layout: String,
    pub last_updated: Option<String>,
    pub status: String,
    pub error_message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateFeed {
    pub xml_url: String,
    pub parent_id: Option<i64>,
    pub title: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateFeed {
    pub id: i64,
    pub title: Option<String>,
    pub parent_id: Option<i64>,
    pub update_interval: Option<i64>,
    pub auto_update: Option<bool>,
    pub disabled: Option<bool>,
    pub layout: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeedCount {
    pub id: i64,
    pub unread_count: i64,
    pub new_count: i64,
}