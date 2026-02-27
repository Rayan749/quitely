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

        Ok(ParsedFeed {
            title: parsed.title.as_ref().map(|t| t.content.clone()).unwrap_or_else(|| url.to_string()),
            description: parsed.description.as_ref().map(|d| d.content.clone()),
            html_url: parsed.links.first().map(|l| l.href.clone()),
            language: parsed.language.clone(),
        })
    }
}

impl Default for FeedFetcher {
    fn default() -> Self {
        Self::new()
    }
}