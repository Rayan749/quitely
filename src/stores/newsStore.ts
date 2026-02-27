import { create } from 'zustand';
import type { News, NewsFilter } from '../types';
import * as api from '../api/commands';

interface NewsState {
  news: News[];
  selectedNewsId: number | null;
  loading: boolean;
  error: string | null;
  filter: NewsFilter;

  // Actions
  loadNews: (filter: NewsFilter) => Promise<void>;
  selectNews: (id: number | null) => void;
  markRead: (ids: number[]) => Promise<void>;
  markStarred: (ids: number[], starred: boolean) => Promise<void>;
  deleteNews: (ids: number[]) => Promise<void>;
  restoreNews: (ids: number[]) => Promise<void>;
  markAllRead: (feedId?: number) => Promise<void>;
  setFilter: (filter: Partial<NewsFilter>) => void;
  clearNews: () => void;
}

export const useNewsStore = create<NewsState>((set, get) => ({
  news: [],
  selectedNewsId: null,
  loading: false,
  error: null,
  filter: {
    feedId: undefined,
    unreadOnly: false,
    starredOnly: false,
    deletedOnly: false,
    limit: 100,
    offset: 0,
  },

  loadNews: async (filter: NewsFilter) => {
    set({ loading: true, error: null });
    try {
      const news = await api.getNews(filter);
      set({ news, loading: false });
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  selectNews: (id) => {
    set({ selectedNewsId: id });
    // Mark as read when selected
    if (id !== null) {
      const newsItem = get().news.find(n => n.id === id);
      if (newsItem && !newsItem.isRead) {
        api.updateNews({ ids: [id], isRead: true });
        set(state => ({
          news: state.news.map(n =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        }));
      }
    }
  },

  markRead: async (ids) => {
    try {
      await api.updateNews({ ids, isRead: true });
      set(state => ({
        news: state.news.map(n =>
          ids.includes(n.id) ? { ...n, isRead: true } : n
        ),
      }));
    } catch (error) {
      set({ error: String(error) });
    }
  },

  markStarred: async (ids, starred) => {
    try {
      await api.updateNews({ ids, isStarred: starred });
      set(state => ({
        news: state.news.map(n =>
          ids.includes(n.id) ? { ...n, isStarred: starred } : n
        ),
      }));
    } catch (error) {
      set({ error: String(error) });
    }
  },

  deleteNews: async (ids) => {
    try {
      await api.deleteNews(ids);
      set(state => ({
        news: state.news.map(n =>
          ids.includes(n.id) ? { ...n, isDeleted: true } : n
        ),
        selectedNewsId: ids.includes(state.selectedNewsId || 0)
          ? null
          : state.selectedNewsId,
      }));
    } catch (error) {
      set({ error: String(error) });
    }
  },

  restoreNews: async (ids) => {
    try {
      await api.restoreNews(ids);
      set(state => ({
        news: state.news.map(n =>
          ids.includes(n.id) ? { ...n, isDeleted: false } : n
        ),
      }));
    } catch (error) {
      set({ error: String(error) });
    }
  },

  markAllRead: async (feedId) => {
    try {
      await api.markAllRead(feedId);
      set(state => ({
        news: state.news.map(n =>
          feedId === undefined || n.feedId === feedId
            ? { ...n, isRead: true }
            : n
        ),
      }));
    } catch (error) {
      set({ error: String(error) });
    }
  },

  setFilter: (filterUpdate) => {
    const newFilter = { ...get().filter, ...filterUpdate };
    set({ filter: newFilter });
    get().loadNews(newFilter);
  },

  clearNews: () => {
    set({ news: [], selectedNewsId: null });
  },
}));