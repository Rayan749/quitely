import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useFeedStore, useNewsStore } from '../stores';

export function useTrayEvents() {
  const { loadFeeds } = useFeedStore();
  const { markAllRead } = useNewsStore();

  useEffect(() => {
    const unlisteners: Array<() => void> = [];

    // Listen for update-feeds event from tray
    listen('tray:update-feeds', async () => {
      console.log('Updating all feeds from tray...');
      await loadFeeds();
    }).then(unlisten => {
      unlisteners.push(unlisten);
    });

    // Listen for mark-all-read event from tray
    listen('tray:mark-all-read', async () => {
      console.log('Marking all read from tray...');
      markAllRead(undefined);
    }).then(unlisten => {
      unlisteners.push(unlisten);
    });

    // Listen for scheduler update-feeds event
    listen('scheduler:update-feeds', async () => {
      console.log('Auto-updating feeds from scheduler...');
      await loadFeeds();
    }).then(unlisten => {
      unlisteners.push(unlisten);
    });

    return () => {
      unlisteners.forEach(unlisten => unlisten());
    };
  }, [loadFeeds, markAllRead]);
}