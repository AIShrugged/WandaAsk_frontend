import type React from 'react';

export type SortOrder = 'asc' | 'desc';

export interface TableColumn<T> {
  id: string;
  header: React.ReactNode;
  renderCell: (row: T) => React.ReactNode;
  cellClassName?: string;
  renderCardField?: (row: T) => React.ReactNode;
}
