use tauri::State;
use crate::db::DbState;
use crate::models::{Feed, CreateFeed, UpdateFeed, FeedCount};
use crate::feed::{FeedFetcher, ParsedFeed, parse_opml, generate_opml, OpmlData, OpmlFeed, OpmlFolder};

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

#[tauri::command]
pub fn import_opml(db: State<'_, DbState>, content: String) -> Result<usize, String> {
    let opml_data = parse_opml(&content)?;

    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut count = 0;

    // Import root-level feeds
    for feed in &opml_data.feeds {
        let create_feed = CreateFeed {
            xml_url: feed.xml_url.clone(),
            parent_id: None,
            title: Some(feed.title.clone()),
        };
        if crate::db::feeds::create(&conn, &create_feed).is_ok() {
            count += 1;
        }
    }

    // Import feeds from folders
    for folder in &opml_data.folders {
        import_folder(&conn, folder, None, &mut count);
    }

    Ok(count)
}

fn import_folder(
    conn: &rusqlite::Connection,
    folder: &OpmlFolder,
    parent_id: Option<i64>,
    count: &mut usize,
) {
    // Create folder as a feed entry (folders are feeds with is_folder=true)
    // For now, we just import feeds without folder structure
    for feed in &folder.feeds {
        let create_feed = CreateFeed {
            xml_url: feed.xml_url.clone(),
            parent_id,
            title: Some(feed.title.clone()),
        };
        if crate::db::feeds::create(conn, &create_feed).is_ok() {
            *count += 1;
        }
    }

    // Recursively import nested folders
    for nested_folder in &folder.folders {
        import_folder(conn, nested_folder, parent_id, count);
    }
}

#[tauri::command]
pub fn export_opml(db: State<'_, DbState>) -> Result<String, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let feeds = crate::db::feeds::get_all(&conn)?;

    // Filter out feeds with empty xml_url (which would be folders)
    let opml_feeds: Vec<OpmlFeed> = feeds
        .into_iter()
        .filter(|f| !f.xml_url.is_empty())
        .map(|f| OpmlFeed {
            title: if f.title.is_empty() { f.xml_url.clone() } else { f.title },
            xml_url: f.xml_url,
            html_url: f.html_url,
        })
        .collect();

    let opml_data = OpmlData {
        title: "Quitely RSS Feeds".to_string(),
        feeds: opml_feeds,
        folders: Vec::new(),
    };

    generate_opml(&opml_data)
}