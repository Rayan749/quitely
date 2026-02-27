export interface Feed {
  id: number;
  parentId: number;
  text: string;
  title: string;
  description?: string;
  xmlUrl: string;
  htmlUrl?: string;
  language?: string;
  unreadCount: number;
  newCount: number;
  updateInterval: number;
  autoUpdate: boolean;
  disabled: boolean;
  layout: 'list' | 'newspaper';
  lastUpdated?: string;
  status: 'ok' | 'error' | 'updating';
  errorMessage?: string;
}

export interface CreateFeed {
  xmlUrl: string;
  parentId?: number;
  title?: string;
}

export interface UpdateFeed {
  id: number;
  title?: string;
  parentId?: number;
  updateInterval?: number;
  autoUpdate?: boolean;
  disabled?: boolean;
  layout?: 'list' | 'newspaper';
}

export interface FeedCount {
  id: number;
  unreadCount: number;
  newCount: number;
}