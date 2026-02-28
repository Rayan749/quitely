import { create } from 'zustand';
import type { Feed, CreateFeed, UpdateFeed, FeedCount } from '../types';
import * as api from '../api/commands';

interface FeedState {
  feeds: Feed[];
  selectedFeedId: number | null;
  loading: boolean;
  error: string | null;

  // Actions
  loadFeeds: () => Promise<void>;
  selectFeed: (id: number | null) => void;
  addFeed: (feed: CreateFeed) => Promise<number>;
  updateFeed: (feed: UpdateFeed) => Promise<void>;
  deleteFeed: (id: number) => Promise<void>;
  updateCounts: (counts: FeedCount[]) => void;
  moveFeed: (feedId: number, newParentId: number | null) => Promise<void>;
  markFeedAsRead: (feedId: number) => Promise<void>;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  feeds: [],
  selectedFeedId: null,
  loading: false,
  error: null,

  loadFeeds: async () => {
    set({ loading: true, error: null });
    try {
      const feeds = await api.getFeeds();
      set({ feeds, loading: false });
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  selectFeed: (id) => {
    set({ selectedFeedId: id });
  },

  addFeed: async (feed) => {
    const id = await api.createFeed(feed);
    await get().loadFeeds();
    return id;
  },

  updateFeed: async (feed) => {
    await api.updateFeed(feed);
    await get().loadFeeds();
  },

  deleteFeed: async (id) => {
    await api.deleteFeed(id);
    set((state) => ({
      feeds: state.feeds.filter((f) => f.id !== id),
      selectedFeedId: state.selectedFeedId === id ? null : state.selectedFeedId,
    }));
  },

  updateCounts: (counts) => {
    set((state) => ({
      feeds: state.feeds.map((feed) => {
        const count = counts.find((c) => c.id === feed.id);
        if (count) {
          return { ...feed, unreadCount: count.unreadCount, newCount: count.newCount };
        }
        return feed;
      }),
    }));
  },

  moveFeed: async (feedId, newParentId) => {
    await api.updateFeed({ id: feedId, parentId: newParentId ?? undefined });
    await get().loadFeeds();
  },

  markFeedAsRead: async (feedId) => {
    await api.markAllRead(feedId);
    // Update unread counts locally
    set((state) => ({
      feeds: state.feeds.map((feed) =>
        feed.id === feedId ? { ...feed, unreadCount: 0, newCount: 0 } : feed
      ),
    }));
  },
}));