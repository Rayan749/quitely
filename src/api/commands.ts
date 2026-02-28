import { invoke } from '@tauri-apps/api/core';
import type { Feed, CreateFeed, UpdateFeed, FeedCount, News, NewsFilter, NewsUpdate, Label, CreateLabel, UpdateLabel } from '../types';

// Parsed feed info from URL
export interface ParsedFeed {
  title: string;
  description?: string;
  html_url?: string;
  language?: string;
}

// Feed commands
export async function getFeeds(): Promise<Feed[]> {
  return invoke<Feed[]>('get_feeds');
}

export async function getFeed(id: number): Promise<Feed | null> {
  return invoke<Feed | null>('get_feed', { id });
}

export async function createFeed(feed: CreateFeed): Promise<number> {
  return invoke<number>('create_feed', { feed });
}

export async function updateFeed(feed: UpdateFeed): Promise<void> {
  return invoke('update_feed', { feed });
}

export async function deleteFeed(id: number): Promise<void> {
  return invoke('delete_feed', { id });
}

export async function updateFeedCounts(counts: FeedCount[]): Promise<void> {
  return invoke('update_feed_counts', { counts });
}

export async function fetchFeedInfo(url: string): Promise<ParsedFeed> {
  return invoke<ParsedFeed>('fetch_feed_info', { url });
}

export async function addFeedWithFetch(url: string, parentId?: number): Promise<Feed> {
  return invoke<Feed>('add_feed_with_fetch', { url, parentId });
}

// OPML commands
export async function importOpml(content: string): Promise<number> {
  return invoke<number>('import_opml', { content });
}

export async function exportOpml(): Promise<string> {
  return invoke<string>('export_opml');
}

// News commands
export async function getNews(filter: NewsFilter): Promise<News[]> {
  return invoke<News[]>('get_news', { filter });
}

export async function getNewsItem(id: number): Promise<News | null> {
  return invoke<News | null>('get_news_item', { id });
}

export async function updateNews(update: NewsUpdate): Promise<void> {
  return invoke('update_news', { update });
}

export async function markAllRead(feedId?: number): Promise<void> {
  return invoke('mark_all_read', { feedId });
}

export async function deleteNews(ids: number[]): Promise<void> {
  return invoke('delete_news', { ids });
}

export async function restoreNews(ids: number[]): Promise<void> {
  return invoke('restore_news', { ids });
}

// Settings commands
export async function getSetting(key: string): Promise<string | null> {
  return invoke<string | null>('get_setting', { key });
}

export async function setSetting(key: string, value: string): Promise<void> {
  return invoke('set_setting', { key, value });
}

export async function deleteSetting(key: string): Promise<void> {
  return invoke('delete_setting', { key });
}

export async function getAllSettings(): Promise<[string, string][]> {
  return invoke<[string, string][]>('get_all_settings');
}

// Label commands
export async function getLabels(): Promise<Label[]> {
  return invoke<Label[]>('get_labels');
}

export async function createLabel(label: CreateLabel): Promise<number> {
  return invoke<number>('create_label', { label });
}

export async function updateLabel(label: UpdateLabel): Promise<void> {
  return invoke('update_label', { label });
}

export async function deleteLabel(id: number): Promise<void> {
  return invoke('delete_label', { id });
}

export async function setArticleLabels(newsIds: number[], labelIds: number[]): Promise<void> {
  return invoke('set_article_labels', { newsIds, labelIds });
}

// Feed update commands
export interface UpdateFeedResult {
  feed_id: number;
  new_count: number;
  total_count: number;
}

export async function updateFeedArticles(feedId: number): Promise<UpdateFeedResult> {
  return invoke<UpdateFeedResult>('update_feed_articles', { feedId });
}

export async function updateAllFeeds(): Promise<UpdateFeedResult[]> {
  return invoke<UpdateFeedResult[]>('update_all_feeds');
}

export async function cleanupDeletedNews(olderThanDays: number): Promise<number> {
  return invoke<number>('cleanup_deleted_news', { olderThanDays });
}