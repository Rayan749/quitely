export interface Label {
  id: number;
  name: string;
  color?: string;
  sortOrder: number;
}

export interface CreateLabel {
  name: string;
  color?: string;
}

export interface UpdateLabel {
  id: number;
  name?: string;
  color?: string;
  sortOrder?: number;
}
