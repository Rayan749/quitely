use rusqlite::Connection;

pub fn create_tables(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS feeds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            parent_id INTEGER DEFAULT 0,
            text TEXT,
            title TEXT,
            description TEXT,
            xml_url TEXT NOT NULL,
            html_url TEXT,
            language TEXT,
            image_data BLOB,
            unread_count INTEGER DEFAULT 0,
            new_count INTEGER DEFAULT 0,
            update_interval INTEGER DEFAULT 30,
            update_on_startup INTEGER DEFAULT 1,
            auto_update INTEGER DEFAULT 1,
            disabled INTEGER DEFAULT 0,
            layout TEXT DEFAULT 'list',
            last_updated TEXT,
            status TEXT DEFAULT 'ok',
            error_message TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS news (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            feed_id INTEGER NOT NULL,
            guid TEXT,
            title TEXT,
            author TEXT,
            author_email TEXT,
            link TEXT,
            description TEXT,
            content TEXT,
            published_at TEXT,
            received_at TEXT DEFAULT CURRENT_TIMESTAMP,
            is_read INTEGER DEFAULT 0,
            is_new INTEGER DEFAULT 1,
            is_starred INTEGER DEFAULT 0,
            is_deleted INTEGER DEFAULT 0,
            category TEXT,
            labels TEXT,
            enclosure_url TEXT,
            enclosure_type TEXT,
            FOREIGN KEY (feed_id) REFERENCES feeds(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS labels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            color TEXT,
            icon_data BLOB,
            sort_order INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS filters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            enabled INTEGER DEFAULT 1,
            feed_ids TEXT,
            match_type TEXT DEFAULT 'any',
            sort_order INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS filter_conditions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filter_id INTEGER NOT NULL,
            field TEXT,
            operator TEXT,
            value TEXT,
            FOREIGN KEY (filter_id) REFERENCES filters(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS filter_actions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filter_id INTEGER NOT NULL,
            action TEXT,
            params TEXT,
            FOREIGN KEY (filter_id) REFERENCES filters(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_news_feed_id ON news(feed_id);
        CREATE INDEX IF NOT EXISTS idx_news_is_read ON news(is_read);
        CREATE INDEX IF NOT EXISTS idx_news_is_starred ON news(is_starred);
        CREATE INDEX IF NOT EXISTS idx_news_published_at ON news(published_at);
        CREATE INDEX IF NOT EXISTS idx_feeds_parent_id ON feeds(parent_id);
        "#,
    )
    .map_err(|e| format!("Failed to create tables: {}", e))?;

    Ok(())
}