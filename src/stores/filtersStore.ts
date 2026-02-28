import { create } from 'zustand';
import type { Filter, CreateFilter } from '../types';
import * as api from '../api/commands';

interface FiltersState {
  filters: Filter[];
  loading: boolean;
  error: string | null;

  loadFilters: () => Promise<void>;
  addFilter: (filter: CreateFilter) => Promise<number>;
  removeFilter: (id: number) => Promise<void>;
  toggleFilter: (id: number, enabled: boolean) => Promise<void>;
}

export const useFiltersStore = create<FiltersState>((set, get) => ({
  filters: [],
  loading: false,
  error: null,

  loadFilters: async () => {
    set({ loading: true, error: null });
    try {
      const filters = await api.getFilters();
      set({ filters, loading: false });
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  addFilter: async (filter) => {
    const id = await api.createFilter(filter);
    await get().loadFilters();
    return id;
  },

  removeFilter: async (id) => {
    await api.deleteFilter(id);
    set(state => ({
      filters: state.filters.filter(f => f.id !== id),
    }));
  },

  toggleFilter: async (id, enabled) => {
    await api.setFilterEnabled(id, enabled);
    set(state => ({
      filters: state.filters.map(f =>
        f.id === id ? { ...f, enabled } : f
      ),
    }));
  },
}));
