'use client';

import { useState } from 'react';

import type { SortOrder } from '@/shared/ui/table/types';

/**
 * useTableSort — manages sort field + direction state for server-side sorted tables.
 * Clicking the same field toggles asc/desc; clicking a new field resets to desc.
 */
export function useTableSort<Field extends string>(
  defaultField: Field,
  defaultOrder: SortOrder = 'desc',
) {
  const [sortField, setSortField] = useState<Field>(defaultField);
  const [sortOrder, setSortOrder] = useState<SortOrder>(defaultOrder);

  function handleSort(field: Field): void {
    if (field === sortField) {
      setSortOrder((prev) => {
        return prev === 'asc' ? 'desc' : 'asc';
      });
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  }

  return { sortField, sortOrder, handleSort };
}
