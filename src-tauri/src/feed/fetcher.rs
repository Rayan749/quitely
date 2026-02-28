use reqwest::Client;
use feed_rs::parser;
use serde::{Deserialize, Serialize};

pub struct FeedFetcher {
    client: Client,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedFeed {
    pub title: String,
    pub description: Option<String>,
    pub html_url: Option<String>,
    pub language: Option<String>,
    pub entries: Vec<ParsedEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedEntry {
    pub guid: Option<String>,
    pub title: Option<String>,
    pub author: Option<String>,
    pub author_email: Option<String>,
    pub link: Option<String>,
    pub description: Option<String>,
    pub content: Option<String>,
    pub published_at: Option<String>,
    pub category: Option<String>,
    pub enclosure_url: Option<String>,
    pub enclosure_type: Option<String>,
}

impl FeedFetcher {
    pub fn new() -> Self {
        Self {
            client: Client::builder()
                .timeout(std::time::Duration::from_secs(30))
                .user_agent("QuitelyRSS/0.1.0")
                .build()
                .unwrap(),
        }
    }

    pub fn with_proxy(proxy_url: &str) -> Result<Self, String> {
        let proxy = reqwest::Proxy::all(proxy_url).map_err(|e| e.to_string())?;
        let client = Client::builder()
            .timeout(std::time::Duration::from_secs(30))
            .user_agent("QuitelyRSS/0.1.0")
            .proxy(proxy)
            .build()
            .map_err(|e| e.to_string())?;
        Ok(Self { client })
    }

    pub async fn fetch_and_parse(&self, url: &str) -> Result<ParsedFeed, String> {
        let response = self.client
            .get(url)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("HTTP error: {}", response.status()));
        }

        let content = response
            .text()
            .await
            .map_err(|e| format!("Failed to read response: {}", e))?;

        let parsed = parser::parse(content.as_bytes())
            .map_err(|e| format!("Failed to parse feed: {}", e))?;

        let entries: Vec<ParsedEntry> = parsed.entries
            .into_iter()
            .map(|entry| {
                let published_at = entry.published
                    .or(entry.updated)
                    .map(|dt| chrono::DateTime::<chrono::Utc>::from(dt).to_rfc3339());

                let enclosure_url = entry.media.first()
                    .and_then(|m| m.content.first())
                    .and_then(|c| c.url.as_ref())
                    .map(|u| u.to_string());

                let enclosure_type = entry.media.first()
                    .and_then(|m| m.content.first())
                    .and_then(|c| c.content_type.as_ref())
                    .map(|ct| ct.to_string());

                ParsedEntry {
                    guid: Some(entry.id).filter(|s| !s.is_empty()),
                    title: entry.title.map(|t| t.content),
                    author: entry.authors.first().map(|a| a.name.clone()),
                    author_email: entry.authors.first().and_then(|a| a.email.clone()),
                    link: entry.links.first().map(|l| l.href.clone()),
                    description: entry.summary.map(|s| s.content),
                    content: entry.content.and_then(|c| c.body),
                    published_at,
                    category: entry.categories.first().map(|c| c.term.clone()),
                    enclosure_url,
                    enclosure_type,
                }
            })
            .collect();

        Ok(ParsedFeed {
            title: parsed.title.as_ref().map(|t| t.content.clone()).unwrap_or_else(|| url.to_string()),
            description: parsed.description.as_ref().map(|d| d.content.clone()),
            html_url: parsed.links.first().map(|l| l.href.clone()),
            language: parsed.language.clone(),
            entries,
        })
    }
}

impl Default for FeedFetcher {
    fn default() -> Self {
        Self::new()
    }
}