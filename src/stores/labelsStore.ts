import { create } from 'zustand';
import type { Label, CreateLabel, UpdateLabel } from '../types';
import * as api from '../api/commands';

interface LabelsState {
  labels: Label[];
  loading: boolean;
  error: string | null;

  loadLabels: () => Promise<void>;
  addLabel: (label: CreateLabel) => Promise<number>;
  updateLabel: (label: UpdateLabel) => Promise<void>;
  removeLabel: (id: number) => Promise<void>;
  setArticleLabels: (newsIds: number[], labelIds: number[]) => Promise<void>;
}

export const useLabelsStore = create<LabelsState>((set, get) => ({
  labels: [],
  loading: false,
  error: null,

  loadLabels: async () => {
    set({ loading: true, error: null });
    try {
      const labels = await api.getLabels();
      set({ labels, loading: false });
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  addLabel: async (label) => {
    const id = await api.createLabel(label);
    await get().loadLabels();
    return id;
  },

  updateLabel: async (label) => {
    await api.updateLabel(label);
    await get().loadLabels();
  },

  removeLabel: async (id) => {
    await api.deleteLabel(id);
    set(state => ({
      labels: state.labels.filter(l => l.id !== id),
    }));
  },

  setArticleLabels: async (newsIds, labelIds) => {
    await api.setArticleLabels(newsIds, labelIds);
  },
}));
