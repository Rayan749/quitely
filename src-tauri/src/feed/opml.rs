use quick_xml::Reader;
use quick_xml::events::Event;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpmlFeed {
    pub title: String,
    pub xml_url: String,
    pub html_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpmlFolder {
    pub title: String,
    pub feeds: Vec<OpmlFeed>,
    pub folders: Vec<OpmlFolder>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpmlData {
    pub title: String,
    pub feeds: Vec<OpmlFeed>,
    pub folders: Vec<OpmlFolder>,
}

pub fn parse_opml(content: &str) -> Result<OpmlData, String> {
    let mut reader = Reader::from_str(content);
    reader.trim_text(true);

    let mut title = String::new();
    let mut feeds: Vec<OpmlFeed> = Vec::new();
    let mut folders: Vec<OpmlFolder> = Vec::new();

    let mut current_folder_title: Option<String> = None;
    let mut current_folder_feeds: Vec<OpmlFeed> = Vec::new();
    let mut folder_depth = 0;

    let mut buf = Vec::new();

    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Start(ref e)) => {
                if e.name().as_ref() == b"outline" {
                    let mut xml_url: Option<String> = None;
                    let mut html_url: Option<String> = None;
                    let mut outline_title: Option<String> = None;

                    for attr in e.attributes().flatten() {
                        match attr.key.as_ref() {
                            b"xmlUrl" => {
                                xml_url = Some(String::from_utf8_lossy(&attr.value).into_owned());
                            }
                            b"htmlUrl" => {
                                html_url = Some(String::from_utf8_lossy(&attr.value).into_owned());
                            }
                            b"title" | b"text" => {
                                outline_title = Some(String::from_utf8_lossy(&attr.value).into_owned());
                            }
                            _ => {}
                        }
                    }

                    if let Some(url) = xml_url {
                        // This is a feed
                        let feed = OpmlFeed {
                            title: outline_title.unwrap_or_else(|| url.clone()),
                            xml_url: url,
                            html_url,
                        };

                        if folder_depth > 0 {
                            current_folder_feeds.push(feed);
                        } else {
                            feeds.push(feed);
                        }
                    } else if let Some(folder_title) = outline_title {
                        // This is a folder
                        if current_folder_title.is_none() {
                            current_folder_title = Some(folder_title);
                            folder_depth += 1;
                        }
                    }
                }
            }
            Ok(Event::Empty(ref e)) => {
                if e.name().as_ref() == b"outline" {
                    let mut xml_url: Option<String> = None;
                    let mut html_url: Option<String> = None;
                    let mut outline_title: Option<String> = None;

                    for attr in e.attributes().flatten() {
                        match attr.key.as_ref() {
                            b"xmlUrl" => {
                                xml_url = Some(String::from_utf8_lossy(&attr.value).into_owned());
                            }
                            b"htmlUrl" => {
                                html_url = Some(String::from_utf8_lossy(&attr.value).into_owned());
                            }
                            b"title" | b"text" => {
                                outline_title = Some(String::from_utf8_lossy(&attr.value).into_owned());
                            }
                            _ => {}
                        }
                    }

                    if let Some(url) = xml_url {
                        let feed = OpmlFeed {
                            title: outline_title.unwrap_or_else(|| url.clone()),
                            xml_url: url,
                            html_url,
                        };

                        if let Some(_) = &current_folder_title {
                            current_folder_feeds.push(feed);
                        } else {
                            feeds.push(feed);
                        }
                    }
                }
            }
            Ok(Event::End(ref e)) => {
                if e.name().as_ref() == b"outline" {
                    if folder_depth > 0 {
                        folder_depth -= 1;
                        if let Some(folder_title) = current_folder_title.take() {
                            folders.push(OpmlFolder {
                                title: folder_title,
                                feeds: current_folder_feeds.clone(),
                                folders: Vec::new(),
                            });
                            current_folder_feeds.clear();
                        }
                    }
                }
            }
            Ok(Event::Text(ref e)) => {
                if title.is_empty() {
                    title = e.unescape().unwrap_or_default().into_owned();
                }
            }
            Ok(Event::Eof) => break,
            Err(e) => return Err(format!("Error parsing OPML: {:?}", e)),
            _ => {}
        }
        buf.clear();
    }

    Ok(OpmlData {
        title,
        feeds,
        folders,
    })
}

pub fn generate_opml(data: &OpmlData) -> Result<String, String> {
    let mut output = String::new();
    output.push_str(r#"<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
<head>
<title>"#);
    output.push_str(&data.title);
    output.push_str(r#"</title>
</head>
<body>
"#);

    for feed in &data.feeds {
        output.push_str(r#"<outline type="rss" ""#);
        output.push_str(&format!("title=\"{}\" ", escape_xml(&feed.title)));
        output.push_str(&format!("xmlUrl=\"{}\" ", escape_xml(&feed.xml_url)));
        if let Some(ref html_url) = feed.html_url {
            output.push_str(&format!("htmlUrl=\"{}\" ", escape_xml(html_url)));
        }
        output.push_str("/>\n");
    }

    for folder in &data.folders {
        output.push_str(&format!("<outline text=\"{}\">\n", escape_xml(&folder.title)));
        for feed in &folder.feeds {
            output.push_str(r#"    <outline type="rss" ""#);
            output.push_str(&format!("title=\"{}\" ", escape_xml(&feed.title)));
            output.push_str(&format!("xmlUrl=\"{}\" ", escape_xml(&feed.xml_url)));
            if let Some(ref html_url) = feed.html_url {
                output.push_str(&format!("htmlUrl=\"{}\" ", escape_xml(html_url)));
            }
            output.push_str("/>\n");
        }
        output.push_str("</outline>\n");
    }

    output.push_str("</body>\n</opml>");
    Ok(output)
}

fn escape_xml(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&apos;")
}