export interface News {
  id: number;
  feedId: number;
  guid?: string;
  title?: string;
  author?: string;
  authorEmail?: string;
  link?: string;
  description?: string;
  content?: string;
  publishedAt?: string;
  receivedAt: string;
  isRead: boolean;
  isNew: boolean;
  isStarred: boolean;
  isDeleted: boolean;
  category?: string;
  labels: number[];
  enclosureUrl?: string;
  enclosureType?: string;
}

export interface NewsFilter {
  feedId?: number;
  unreadOnly?: boolean;
  starredOnly?: boolean;
  deletedOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface NewsUpdate {
  ids: number[];
  isRead?: boolean;
  isStarred?: boolean;
  isDeleted?: boolean;
}