use tauri::State;
use crate::db::DbState;
use crate::models::{Feed, CreateFeed, UpdateFeed, FeedCount};
use crate::feed::{FeedFetcher, ParsedFeed};

#[tauri::command]
pub fn get_feeds(db: State<'_, DbState>) -> Result<Vec<Feed>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::feeds::get_all(&conn)
}

#[tauri::command]
pub fn get_feed(db: State<'_, DbState>, id: i64) -> Result<Option<Feed>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::feeds::get_by_id(&conn, id)
}

#[tauri::command]
pub fn create_feed(db: State<'_, DbState>, feed: CreateFeed) -> Result<i64, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::feeds::create(&conn, &feed)
}

#[tauri::command]
pub fn update_feed(db: State<'_, DbState>, feed: UpdateFeed) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::feeds::update(&conn, &feed)
}

#[tauri::command]
pub fn delete_feed(db: State<'_, DbState>, id: i64) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::feeds::delete(&conn, id)
}

#[tauri::command]
pub fn update_feed_counts(db: State<'_, DbState>, counts: Vec<FeedCount>) -> Result<(), String> {
    let mut conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::feeds::update_counts(&mut conn, &counts)
}

#[tauri::command]
pub async fn fetch_feed_info(url: String) -> Result<ParsedFeed, String> {
    let fetcher = FeedFetcher::new();
    fetcher.fetch_and_parse(&url).await
}

#[tauri::command]
pub async fn add_feed_with_fetch(
    db: State<'_, DbState>,
    url: String,
    parent_id: Option<i64>,
) -> Result<Feed, String> {
    // Fetch feed info
    let fetcher = FeedFetcher::new();
    let info = fetcher.fetch_and_parse(&url).await?;

    // Create feed in database
    let create_feed = CreateFeed {
        xml_url: url,
        parent_id,
        title: Some(info.title),
    };

    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let id = crate::db::feeds::create(&conn, &create_feed)?;

    // Get the created feed
    crate::db::feeds::get_by_id(&conn, id)?
        .ok_or_else(|| "Failed to get created feed".to_string())
}