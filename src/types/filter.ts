export interface Filter {
  id: number;
  name: string;
  enabled: boolean;
  feedIds: number[];
  matchType: 'any' | 'all';
  sortOrder: number;
  conditions: FilterCondition[];
  actions: FilterAction[];
}

export interface FilterCondition {
  id: number;
  filterId: number;
  field: 'title' | 'author' | 'category' | 'content';
  operator: 'contains' | 'not_contains' | 'equals' | 'starts_with' | 'regex';
  value: string;
}

export interface FilterAction {
  id: number;
  filterId: number;
  action: 'mark_read' | 'mark_starred' | 'add_label' | 'delete';
  params?: string;
}

export interface CreateFilter {
  name: string;
  feedIds: number[];
  matchType: 'any' | 'all';
  conditions: { field: string; operator: string; value: string }[];
  actions: { action: string; params?: string }[];
}
