import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // Panel visibility
  categoriesPanelVisible: boolean;
  feedTreeWidth: number;
  newsListHeight: number;

  // Content view
  contentLayout: 'list' | 'newspaper';

  // Category filter
  selectedCategory: 'unread' | 'starred' | 'deleted' | null;

  // Label filter
  selectedLabelId: number | null;

  // Settings page
  settingsPageOpen: boolean;

  // Actions
  toggleCategoriesPanel: () => void;
  setFeedTreeWidth: (width: number) => void;
  setNewsListHeight: (height: number) => void;
  setContentLayout: (layout: 'list' | 'newspaper') => void;
  selectCategory: (category: 'unread' | 'starred' | 'deleted' | null) => void;
  selectLabel: (id: number | null) => void;
  setSettingsPageOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      categoriesPanelVisible: true,
      feedTreeWidth: 250,
      newsListHeight: 300,
      contentLayout: 'list',
      selectedCategory: null,
      selectedLabelId: null,
      settingsPageOpen: false,

      toggleCategoriesPanel: () =>
        set((state) => ({ categoriesPanelVisible: !state.categoriesPanelVisible })),

      setFeedTreeWidth: (width) => set({ feedTreeWidth: width }),

      setNewsListHeight: (height) => set({ newsListHeight: height }),

      setContentLayout: (layout) => set({ contentLayout: layout }),

      selectCategory: (category) => set({ selectedCategory: category }),

      selectLabel: (id) => set({ selectedLabelId: id }),

      setSettingsPageOpen: (open) => set({ settingsPageOpen: open }),
    }),
    {
      name: 'quitely-ui-settings',
    }
  )
);