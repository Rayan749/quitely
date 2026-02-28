import { create } from 'zustand';
import type { News, NewsFilter } from '../types';
import * as api from '../api/commands';

interface NewsState {
  news: News[];
  selectedNewsId: number | null;
  loading: boolean;
  error: string | null;
  filter: NewsFilter;
  searchQuery: string;
  totalCount: number;
  hasMore: boolean;

  // Actions
  loadNews: (filter: NewsFilter) => Promise<void>;
  searchNews: (query: string, feedId?: number) => Promise<void>;
  clearSearch: () => void;
  loadMore: () => Promise<void>;
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
    limit: 50,
    offset: 0,
  },
  searchQuery: '',
  totalCount: 0,
  hasMore: false,

  loadNews: async (filter: NewsFilter) => {
    set({ loading: true, error: null, searchQuery: '' });
    try {
      const [news, totalCount] = await Promise.all([
        api.getNews({ ...filter, limit: filter.limit || 50, offset: 0 }),
        api.getNewsCount(filter),
      ]);
      set({
        news,
        loading: false,
        totalCount,
        hasMore: news.length < totalCount,
      });
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  searchNews: async (query, feedId) => {
    set({ loading: true, error: null, searchQuery: query });
    try {
      const news = await api.searchNews(query, feedId, 100);
      set({ news, loading: false, totalCount: news.length, hasMore: false });
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  clearSearch: () => {
    set({ searchQuery: '' });
  },

  loadMore: async () => {
    const state = get();
    if (state.loading || !state.hasMore) return;

    set({ loading: true });
    try {
      const offset = state.news.length;
      const moreNews = await api.getNews({
        ...state.filter,
        limit: state.filter.limit || 50,
        offset,
      });
      set(s => ({
        news: [...s.news, ...moreNews],
        loading: false,
        hasMore: s.news.length + moreNews.length < s.totalCount,
      }));
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
    set({ news: [], selectedNewsId: null, totalCount: 0, hasMore: false });
  },
}));