import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // Panel visibility
  categoriesPanelVisible: boolean;
  feedTreeWidth: number;
  newsListHeight: number;

  // Content view
  contentLayout: 'list' | 'newspaper';

  // Actions
  toggleCategoriesPanel: () => void;
  setFeedTreeWidth: (width: number) => void;
  setNewsListHeight: (height: number) => void;
  setContentLayout: (layout: 'list' | 'newspaper') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      categoriesPanelVisible: true,
      feedTreeWidth: 250,
      newsListHeight: 300,
      contentLayout: 'list',

      toggleCategoriesPanel: () =>
        set((state) => ({ categoriesPanelVisible: !state.categoriesPanelVisible })),

      setFeedTreeWidth: (width) => set({ feedTreeWidth: width }),

      setNewsListHeight: (height) => set({ newsListHeight: height }),

      setContentLayout: (layout) => set({ contentLayout: layout }),
    }),
    {
      name: 'quitely-ui-settings',
    }
  )
);