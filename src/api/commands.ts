import { invoke } from '@tauri-apps/api/core';
import type { Feed, CreateFeed, UpdateFeed, FeedCount, News, NewsFilter, NewsUpdate } from '../types';

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

// News commands (placeholder for Phase 3)
export async function getNews(filter: NewsFilter): Promise<News[]> {
  return invoke<News[]>('get_news', { filter });
}

export async function updateNews(update: NewsUpdate): Promise<void> {
  return invoke('update_news', { update });
}