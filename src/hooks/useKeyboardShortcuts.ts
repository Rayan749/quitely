import { useEffect } from 'react';
import { useFeedStore, useNewsStore } from '../stores';

export function useKeyboardShortcuts() {
  const { feeds, selectedFeedId, selectFeed } = useFeedStore();
  const { news, selectedNewsId, selectNews, markAllRead } = useNewsStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      // Cmd/Ctrl + R: Refresh (prevent default browser refresh)
      if (cmdKey && e.key === 'r') {
        e.preventDefault();
        // Emit refresh event
        window.dispatchEvent(new CustomEvent('app:refresh'));
        return;
      }

      // Cmd/Ctrl + Shift + A: Mark all read
      if (cmdKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        markAllRead(selectedFeedId ?? undefined);
        return;
      }

      // Cmd/Ctrl + S: Star current article
      if (cmdKey && e.key === 's') {
        e.preventDefault();
        if (selectedNewsId !== null) {
          const article = news.find(n => n.id === selectedNewsId);
          if (article) {
            const { markStarred } = useNewsStore.getState();
            markStarred([selectedNewsId], !article.isStarred);
          }
        }
        return;
      }

      // Up/Down arrows: Navigate articles
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (news.length === 0) return;

        const currentIndex = news.findIndex(n => n.id === selectedNewsId);
        let newIndex: number;

        if (e.key === 'ArrowUp') {
          newIndex = currentIndex <= 0 ? news.length - 1 : currentIndex - 1;
        } else {
          newIndex = currentIndex >= news.length - 1 ? 0 : currentIndex + 1;
        }

        selectNews(news[newIndex].id);
        return;
      }

      // Left/Right arrows: Navigate feeds
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        if (feeds.length === 0) return;

        const feedIndex = feeds.findIndex(f => f.id === selectedFeedId);
        let newFeedIndex: number;

        if (e.key === 'ArrowLeft') {
          newFeedIndex = feedIndex <= 0 ? feeds.length - 1 : feedIndex - 1;
        } else {
          newFeedIndex = feedIndex >= feeds.length - 1 ? 0 : feedIndex + 1;
        }

        selectFeed(feeds[newFeedIndex].id);
        return;
      }

      // Enter: Open article link
      if (e.key === 'Enter' && selectedNewsId !== null) {
        e.preventDefault();
        const article = news.find(n => n.id === selectedNewsId);
        if (article?.link) {
          window.open(article.link, '_blank');
        }
        return;
      }

      // Delete/Backspace: Delete current article
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNewsId !== null) {
          e.preventDefault();
          const { deleteNews } = useNewsStore.getState();
          deleteNews([selectedNewsId]);
        }
        return;
      }

      // Escape: Deselect article
      if (e.key === 'Escape') {
        selectNews(null);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [feeds, news, selectedFeedId, selectedNewsId, selectFeed, selectNews, markAllRead]);
}